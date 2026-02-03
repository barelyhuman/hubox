use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HuBoxNotification {
    pub id: String,
    pub reason: String,
    pub repository: Repository,
    pub subject: Subject,
    pub updated_at: String,
    pub unread: bool,
    pub url: String,

    // App-specific custom state
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_read: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_done: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub priority: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_viewed_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Repository {
    pub full_name: String,
    pub owner: Owner,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Owner {
    pub login: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Subject {
    pub title: String,
    #[serde(rename = "type")]
    pub subject_type: String,
    pub url: Option<String>,
    pub latest_comment_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationDetails {
    pub notification: HuBoxNotification,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub comments: Option<Vec<Comment>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub issue: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pull_request: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Comment {
    pub id: i64,
    pub user: User,
    pub body: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub login: String,
    pub avatar_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationStats {
    pub total: usize,
    pub unread: usize,
    pub app_unread: usize,
    pub done: usize,
    pub in_progress: usize,
    pub last_sync: i64,
    pub is_online: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomState {
    pub is_read: bool,
    pub is_done: bool,
    pub priority: i32,
    pub last_viewed_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageData {
    pub notifications: Vec<HuBoxNotification>,
    pub active_batch_ids: Vec<String>,
    pub custom_states: HashMap<String, CustomState>,
    pub last_sync: i64,
    pub max_active: usize,
}

impl Default for StorageData {
    fn default() -> Self {
        Self {
            notifications: Vec::new(),
            active_batch_ids: Vec::new(),
            custom_states: HashMap::new(),
            last_sync: 0,
            max_active: 10,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheEntry {
    pub response: String,
    pub timestamp: i64,
}

pub type RequestCache = HashMap<String, CacheEntry>;
