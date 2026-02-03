use crate::types::{CacheEntry, RequestCache};
use std::collections::HashMap;
use std::error::Error;
use std::fs;
use std::path::PathBuf;

const CACHE_TTL_MS: i64 = 300_000; // 5 minutes

fn get_cache_file_path() -> Result<PathBuf, Box<dyn Error>> {
    let mut path = dirs::home_dir().ok_or("Could not find home directory")?;
    path.push(".hubox");

    if !path.exists() {
        fs::create_dir_all(&path)?;
    }

    path.push("request-cache.json");
    Ok(path)
}

pub fn load_cache() -> Result<RequestCache, Box<dyn Error>> {
    let path = get_cache_file_path()?;

    if !path.exists() {
        return Ok(HashMap::new());
    }

    let contents = fs::read_to_string(path)?;
    let cache: RequestCache = serde_json::from_str(&contents)?;
    Ok(cache)
}

pub fn save_cache(cache: &RequestCache) -> Result<(), Box<dyn Error>> {
    let path = get_cache_file_path()?;
    let contents = serde_json::to_string_pretty(cache)?;
    fs::write(path, contents)?;
    Ok(())
}

pub fn get_cached_response(cache: &RequestCache, url: &str, current_time: i64) -> Option<String> {
    if let Some(entry) = cache.get(url) {
        if current_time - entry.timestamp < CACHE_TTL_MS {
            return Some(entry.response.clone());
        }
    }
    None
}

pub fn set_cached_response(
    cache: &mut RequestCache,
    url: String,
    response: String,
    current_time: i64,
) {
    cache.insert(
        url,
        CacheEntry {
            response,
            timestamp: current_time,
        },
    );
}
