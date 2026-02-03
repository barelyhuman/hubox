use crate::types::StorageData;
use std::error::Error;
use std::fs;
use std::path::PathBuf;

fn get_data_dir() -> Result<PathBuf, Box<dyn Error>> {
    let mut path = dirs::home_dir().ok_or("Could not find home directory")?;
    path.push(".hubox");

    // Create directory if it doesn't exist
    if !path.exists() {
        fs::create_dir_all(&path)?;
    }

    Ok(path)
}

fn get_storage_file_path() -> Result<PathBuf, Box<dyn Error>> {
    let mut path = get_data_dir()?;
    path.push("github-notifications.json");
    Ok(path)
}

pub fn load_storage_data() -> Result<StorageData, Box<dyn Error>> {
    let path = get_storage_file_path()?;

    if !path.exists() {
        return Ok(StorageData::default());
    }

    let contents = fs::read_to_string(path)?;
    let data: StorageData = serde_json::from_str(&contents)?;
    Ok(data)
}

pub fn save_storage_data(data: &StorageData) -> Result<(), Box<dyn Error>> {
    let path = get_storage_file_path()?;
    let contents = serde_json::to_string_pretty(data)?;
    fs::write(path, contents)?;
    Ok(())
}
