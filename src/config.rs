use rocket::serde::Deserialize;
use std::fs;

#[derive(Deserialize)]
pub struct Config {
    pub port: Option<u16>,
    pub address: Option<String>,
    pub log_level: Option<String>,
    pub secret_key: Option<String>,
}

impl Config {
    pub fn from_file(path: &str) -> Self {
        let content = fs::read_to_string(path).unwrap_or_else(|_| String::new());
        toml::from_str(&content).unwrap_or_else(|_| Config {
            port: None,
            address: None,
            log_level: None,
            secret_key: None,
        })
    }
}
