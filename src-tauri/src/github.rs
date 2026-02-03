use crate::types::{Comment, HuBoxNotification};
use reqwest::header::{HeaderMap, HeaderValue, ACCEPT, AUTHORIZATION, USER_AGENT};
use std::error::Error;

pub struct GitHubClient {
    token: String,
    client: reqwest::Client,
}

impl GitHubClient {
    pub fn new(token: String) -> Result<Self, Box<dyn Error>> {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(30))
            .build()?;
        
        Ok(Self { token, client })
    }

    fn get_headers(&self) -> HeaderMap {
        let mut headers = HeaderMap::new();
        headers.insert(
            AUTHORIZATION,
            HeaderValue::from_str(&format!("Bearer {}", self.token)).unwrap(),
        );
        headers.insert(
            ACCEPT,
            HeaderValue::from_static("application/vnd.github+json"),
        );
        headers.insert(USER_AGENT, HeaderValue::from_static("Hubox"));
        headers
    }

    pub async fn validate_token(&self) -> Result<(), Box<dyn Error>> {
        let url = "https://api.github.com/notifications?all=true&per_page=1";
        let response = self
            .client
            .get(url)
            .headers(self.get_headers())
            .send()
            .await?;

        if response.status().is_success() {
            Ok(())
        } else {
            Err(format!("Invalid token: {}", response.status()).into())
        }
    }

    pub async fn fetch_notifications(
        &self,
        page: Option<u32>,
        per_page: Option<u32>,
    ) -> Result<Vec<HuBoxNotification>, Box<dyn Error>> {
        let page = page.unwrap_or(1);
        let per_page = per_page.unwrap_or(100);
        
        let url = format!(
            "https://api.github.com/notifications?all=true&page={}&per_page={}",
            page, per_page
        );

        let response = self
            .client
            .get(&url)
            .headers(self.get_headers())
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(format!("Failed to fetch notifications: {}", response.status()).into());
        }

        let notifications: Vec<HuBoxNotification> = response.json().await?;
        Ok(notifications)
    }

    pub async fn mark_thread_as_done(&self, thread_id: &str) -> Result<(), Box<dyn Error>> {
        let url = format!("https://api.github.com/notifications/threads/{}", thread_id);
        
        let response = self
            .client
            .patch(&url)
            .headers(self.get_headers())
            .send()
            .await?;

        if response.status().is_success() || response.status().as_u16() == 205 {
            Ok(())
        } else {
            Err(format!("Failed to mark as done: {}", response.status()).into())
        }
    }

    pub async fn get_issue_details(
        &self,
        owner: &str,
        repo: &str,
        number: u32,
    ) -> Result<serde_json::Value, Box<dyn Error>> {
        let url = format!(
            "https://api.github.com/repos/{}/{}/issues/{}",
            owner, repo, number
        );

        let response = self
            .client
            .get(&url)
            .headers(self.get_headers())
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(format!("Failed to fetch issue: {}", response.status()).into());
        }

        let issue: serde_json::Value = response.json().await?;
        Ok(issue)
    }

    pub async fn get_pull_request_details(
        &self,
        owner: &str,
        repo: &str,
        number: u32,
    ) -> Result<serde_json::Value, Box<dyn Error>> {
        let url = format!(
            "https://api.github.com/repos/{}/{}/pulls/{}",
            owner, repo, number
        );

        let response = self
            .client
            .get(&url)
            .headers(self.get_headers())
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(format!("Failed to fetch PR: {}", response.status()).into());
        }

        let pr: serde_json::Value = response.json().await?;
        Ok(pr)
    }

    pub async fn get_comments(
        &self,
        owner: &str,
        repo: &str,
        number: u32,
    ) -> Result<Vec<Comment>, Box<dyn Error>> {
        let url = format!(
            "https://api.github.com/repos/{}/{}/issues/{}/comments",
            owner, repo, number
        );

        let response = self
            .client
            .get(&url)
            .headers(self.get_headers())
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(format!("Failed to fetch comments: {}", response.status()).into());
        }

        let comments: Vec<Comment> = response.json().await?;
        Ok(comments)
    }
}
