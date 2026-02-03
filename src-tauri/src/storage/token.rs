use keyring::Entry;
use std::error::Error;

const SERVICE_NAME: &str = "hubox";
const USERNAME: &str = "github_token";

pub fn save_token(token: &str) -> Result<(), Box<dyn Error>> {
    let entry = Entry::new(SERVICE_NAME, USERNAME)?;
    entry.set_password(token)?;
    Ok(())
}

pub fn get_token() -> Result<Option<String>, Box<dyn Error>> {
    let entry = Entry::new(SERVICE_NAME, USERNAME)?;
    match entry.get_password() {
        Ok(token) => Ok(Some(token)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(Box::new(e)),
    }
}

pub fn delete_token() -> Result<(), Box<dyn Error>> {
    let entry = Entry::new(SERVICE_NAME, USERNAME)?;
    match entry.delete_password() {
        Ok(_) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()), // Already deleted
        Err(e) => Err(Box::new(e)),
    }
}
