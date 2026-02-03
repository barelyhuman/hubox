use crate::github::GitHubClient;
use crate::storage;
use crate::types::*;
use std::collections::HashMap;
use std::error::Error;

pub struct NotificationManager {
    client: GitHubClient,
    storage: StorageData,
    cache: RequestCache,
    is_online: bool,
}

impl NotificationManager {
    pub async fn new(token: String) -> Result<Self, Box<dyn Error>> {
        let client = GitHubClient::new(token)?;
        
        // Validate token
        client.validate_token().await?;
        
        // Load cached data
        let storage = storage::load_storage_data().unwrap_or_default();
        let cache = storage::load_cache().unwrap_or_default();
        
        Ok(Self {
            client,
            storage,
            cache,
            is_online: true,
        })
    }

    pub async fn sync(&mut self) -> Result<(), Box<dyn Error>> {
        match self.client.fetch_notifications(None, Some(100)).await {
            Ok(api_notifications) => {
                self.is_online = true;
                self.merge_notifications(api_notifications);
                self.recalculate_inbox();
                self.storage.last_sync = chrono::Utc::now().timestamp_millis();
                storage::save_storage_data(&self.storage)?;
                Ok(())
            }
            Err(e) => {
                self.is_online = false;
                Err(e)
            }
        }
    }

    fn merge_notifications(&mut self, api_notifications: Vec<HuBoxNotification>) {
        // Create a map of existing notifications
        let mut existing: HashMap<String, HuBoxNotification> = self
            .storage
            .notifications
            .iter()
            .map(|n| (n.id.clone(), n.clone()))
            .collect();

        // Merge API notifications with existing custom states
        for mut api_notif in api_notifications {
            if let Some(existing_notif) = existing.get(&api_notif.id) {
                // Preserve custom states
                api_notif.is_read = existing_notif.is_read;
                api_notif.is_done = existing_notif.is_done;
                api_notif.priority = existing_notif.priority;
                api_notif.last_viewed_at = existing_notif.last_viewed_at;
            } else if let Some(custom_state) = self.storage.custom_states.get(&api_notif.id) {
                // Apply from custom states map
                api_notif.is_read = Some(custom_state.is_read);
                api_notif.is_done = Some(custom_state.is_done);
                api_notif.priority = Some(custom_state.priority);
                api_notif.last_viewed_at = Some(custom_state.last_viewed_at);
            }
            existing.insert(api_notif.id.clone(), api_notif);
        }

        // Convert back to vec
        self.storage.notifications = existing.into_values().collect();
    }

    fn recalculate_inbox(&mut self) {
        // Filter out done notifications
        let mut available: Vec<_> = self
            .storage
            .notifications
            .iter()
            .filter(|n| !n.is_done.unwrap_or(false))
            .collect();

        // Sort by updated_at descending (newest first)
        available.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));

        // Preserve existing active batch items that are still valid
        let mut new_active_ids: Vec<String> = Vec::new();
        for id in &self.storage.active_batch_ids {
            if available.iter().any(|n| &n.id == id) {
                new_active_ids.push(id.clone());
            }
        }

        // Fill remaining slots
        for notif in available {
            if new_active_ids.len() >= self.storage.max_active {
                break;
            }
            if !new_active_ids.contains(&notif.id) {
                new_active_ids.push(notif.id.clone());
            }
        }

        self.storage.active_batch_ids = new_active_ids;
    }

    pub fn get_in_progress(&self) -> Vec<HuBoxNotification> {
        let mut result: Vec<HuBoxNotification> = self
            .storage
            .notifications
            .iter()
            .filter(|n| self.storage.active_batch_ids.contains(&n.id))
            .cloned()
            .collect();

        result.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
        result
    }

    pub fn get_all(&self) -> Vec<HuBoxNotification> {
        let mut result = self.storage.notifications.clone();
        result.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
        result
    }

    pub fn get_done(&self) -> Vec<HuBoxNotification> {
        let mut result: Vec<HuBoxNotification> = self
            .storage
            .notifications
            .iter()
            .filter(|n| n.is_done.unwrap_or(false))
            .cloned()
            .collect();

        result.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
        result
    }

    pub async fn get_details(&mut self, id: &str) -> Result<NotificationDetails, Box<dyn Error>> {
        let notification = self
            .storage
            .notifications
            .iter()
            .find(|n| n.id == id)
            .ok_or("Notification not found")?
            .clone();

        // Extract repo info and number from subject URL
        let (owner, repo, number) = self.parse_subject_url(&notification)?;

        // Fetch details based on type
        let (issue, pull_request, comments) = match notification.subject.subject_type.as_str() {
            "Issue" => {
                let issue_data = self.client.get_issue_details(&owner, &repo, number).await.ok();
                let comments_data = self.client.get_comments(&owner, &repo, number).await.ok();
                (issue_data, None, comments_data)
            }
            "PullRequest" => {
                let pr_data = self.client.get_pull_request_details(&owner, &repo, number).await.ok();
                let comments_data = self.client.get_comments(&owner, &repo, number).await.ok();
                (None, pr_data, comments_data)
            }
            _ => (None, None, None),
        };

        Ok(NotificationDetails {
            notification,
            comments,
            issue,
            pull_request,
        })
    }

    fn parse_subject_url(&self, notification: &HuBoxNotification) -> Result<(String, String, u32), Box<dyn Error>> {
        let url = notification
            .subject
            .url
            .as_ref()
            .ok_or("No subject URL")?;

        // Parse URL like: https://api.github.com/repos/owner/repo/issues/123
        let parts: Vec<&str> = url.split('/').collect();
        if parts.len() < 8 {
            return Err("Invalid subject URL format".into());
        }

        let owner = parts[parts.len() - 4].to_string();
        let repo = parts[parts.len() - 3].to_string();
        let number: u32 = parts[parts.len() - 1].parse()?;

        Ok((owner, repo, number))
    }

    pub fn mark_as_read(&mut self, id: &str) -> Result<(), Box<dyn Error>> {
        if let Some(notification) = self.storage.notifications.iter_mut().find(|n| n.id == id) {
            notification.is_read = Some(true);
            notification.last_viewed_at = Some(chrono::Utc::now().timestamp_millis());
            
            // Update custom states map
            self.storage.custom_states.insert(
                id.to_string(),
                CustomState {
                    is_read: true,
                    is_done: notification.is_done.unwrap_or(false),
                    priority: notification.priority.unwrap_or(0),
                    last_viewed_at: notification.last_viewed_at.unwrap_or(0),
                },
            );
            
            storage::save_storage_data(&self.storage)?;
        }
        Ok(())
    }

    pub async fn mark_as_done(&mut self, id: &str) -> Result<(), Box<dyn Error>> {
        if let Some(notification) = self.storage.notifications.iter_mut().find(|n| n.id == id) {
            notification.is_done = Some(true);
            notification.is_read = Some(true);
            
            // Update custom states map
            self.storage.custom_states.insert(
                id.to_string(),
                CustomState {
                    is_read: true,
                    is_done: true,
                    priority: notification.priority.unwrap_or(0),
                    last_viewed_at: notification.last_viewed_at.unwrap_or(0),
                },
            );
            
            // Recalculate inbox (backfill)
            self.recalculate_inbox();
            
            storage::save_storage_data(&self.storage)?;
            
            // Best-effort mark as done on GitHub
            let _ = self.client.mark_thread_as_done(id).await;
        }
        Ok(())
    }

    pub fn expand_inbox(&mut self) -> Result<(), Box<dyn Error>> {
        self.storage.max_active += 10;
        self.recalculate_inbox();
        storage::save_storage_data(&self.storage)?;
        Ok(())
    }

    pub fn get_stats(&self) -> NotificationStats {
        let total = self.storage.notifications.len();
        let unread = self
            .storage
            .notifications
            .iter()
            .filter(|n| n.unread)
            .count();
        let app_unread = self
            .get_in_progress()
            .iter()
            .filter(|n| !n.is_read.unwrap_or(false))
            .count();
        let done = self
            .storage
            .notifications
            .iter()
            .filter(|n| n.is_done.unwrap_or(false))
            .count();
        let in_progress = self.storage.active_batch_ids.len();

        NotificationStats {
            total,
            unread,
            app_unread,
            done,
            in_progress,
            last_sync: self.storage.last_sync,
            is_online: self.is_online,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn repo(owner: &str, name: &str) -> Repository {
        Repository {
            full_name: format!("{}/{}", owner, name),
            owner: Owner {
                login: owner.to_string(),
            },
            name: name.to_string(),
        }
    }

    fn subject(subject_type: &str, url: Option<&str>) -> Subject {
        Subject {
            title: "Test".to_string(),
            subject_type: subject_type.to_string(),
            url: url.map(|value| value.to_string()),
            latest_comment_url: None,
        }
    }

    fn notification(
        id: &str,
        updated_at: &str,
        unread: bool,
        is_read: Option<bool>,
        is_done: Option<bool>,
    ) -> HuBoxNotification {
        HuBoxNotification {
            id: id.to_string(),
            reason: "assign".to_string(),
            repository: repo("octo", "hub"),
            subject: subject("Issue", None),
            updated_at: updated_at.to_string(),
            unread,
            url: "https://api.github.com/notifications/threads/1".to_string(),
            is_read,
            is_done,
            priority: None,
            last_viewed_at: None,
        }
    }

    fn test_manager(storage: StorageData) -> NotificationManager {
        NotificationManager {
            client: GitHubClient::new("token".to_string()).expect("client"),
            storage,
            cache: RequestCache::new(),
            is_online: true,
        }
    }

    #[test]
    fn merge_preserves_existing_custom_state() {
        let mut storage = StorageData::default();
        let mut existing = notification("1", "2024-01-01T00:00:00Z", true, Some(true), Some(true));
        existing.priority = Some(2);
        existing.last_viewed_at = Some(100);
        storage.notifications.push(existing);

        let mut manager = test_manager(storage);
        let api = vec![notification("1", "2024-02-01T00:00:00Z", false, None, None)];

        manager.merge_notifications(api);

        let merged = manager
            .storage
            .notifications
            .iter()
            .find(|n| n.id == "1")
            .expect("merged notification");

        assert_eq!(merged.updated_at, "2024-02-01T00:00:00Z");
        assert_eq!(merged.is_read, Some(true));
        assert_eq!(merged.is_done, Some(true));
        assert_eq!(merged.priority, Some(2));
        assert_eq!(merged.last_viewed_at, Some(100));
    }

    #[test]
    fn merge_applies_custom_states_when_missing() {
        let mut storage = StorageData::default();
        storage.custom_states.insert(
            "2".to_string(),
            CustomState {
                is_read: true,
                is_done: false,
                priority: 3,
                last_viewed_at: 200,
            },
        );

        let mut manager = test_manager(storage);
        let api = vec![notification("2", "2024-03-01T00:00:00Z", true, None, None)];

        manager.merge_notifications(api);

        let merged = manager
            .storage
            .notifications
            .iter()
            .find(|n| n.id == "2")
            .expect("merged notification");

        assert_eq!(merged.is_read, Some(true));
        assert_eq!(merged.is_done, Some(false));
        assert_eq!(merged.priority, Some(3));
        assert_eq!(merged.last_viewed_at, Some(200));
    }

    #[test]
    fn recalculate_inbox_preserves_and_fills_active_batch() {
        let mut storage = StorageData::default();
        storage.max_active = 2;
        storage.active_batch_ids = vec!["n2".to_string(), "n4".to_string()];
        storage.notifications = vec![
            notification("n1", "2024-01-01T00:00:00Z", true, None, None),
            notification("n2", "2024-01-02T00:00:00Z", true, None, None),
            notification("n3", "2024-01-03T00:00:00Z", true, None, None),
            notification("n4", "2024-01-04T00:00:00Z", true, None, Some(true)),
        ];

        let mut manager = test_manager(storage);
        manager.recalculate_inbox();

        assert_eq!(manager.storage.active_batch_ids, vec!["n2", "n3"]);
    }

    #[test]
    fn get_in_progress_sorts_by_updated_at() {
        let mut storage = StorageData::default();
        storage.active_batch_ids = vec!["a", "b"].iter().map(|id| id.to_string()).collect();
        storage.notifications = vec![
            notification("a", "2024-01-01T00:00:00Z", true, None, None),
            notification("b", "2024-02-01T00:00:00Z", true, None, None),
        ];

        let manager = test_manager(storage);
        let result = manager.get_in_progress();

        assert_eq!(result.len(), 2);
        assert_eq!(result[0].id, "b");
        assert_eq!(result[1].id, "a");
    }

    #[test]
    fn parse_subject_url_extracts_owner_repo_number() {
        let storage = StorageData::default();
        let manager = test_manager(storage);

        let mut notif = notification("x", "2024-01-01T00:00:00Z", true, None, None);
        notif.subject = subject(
            "Issue",
            Some("https://api.github.com/repos/acme/hub/issues/123"),
        );

        let (owner, repo, number) = manager.parse_subject_url(&notif).expect("parsed");
        assert_eq!(owner, "acme");
        assert_eq!(repo, "hub");
        assert_eq!(number, 123);
    }

    #[test]
    fn get_stats_counts_notification_states() {
        let mut storage = StorageData::default();
        storage.active_batch_ids = vec!["a".to_string(), "b".to_string()];
        storage.notifications = vec![
            notification("a", "2024-01-01T00:00:00Z", true, Some(false), Some(false)),
            notification("b", "2024-01-02T00:00:00Z", false, Some(true), Some(true)),
            notification("c", "2024-01-03T00:00:00Z", true, None, Some(true)),
        ];

        let manager = test_manager(storage);
        let stats = manager.get_stats();

        assert_eq!(stats.total, 3);
        assert_eq!(stats.unread, 2);
        assert_eq!(stats.app_unread, 1);
        assert_eq!(stats.done, 2);
        assert_eq!(stats.in_progress, 2);
        assert_eq!(stats.is_online, true);
    }
}
