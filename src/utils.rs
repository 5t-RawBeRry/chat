use rocket::tokio::sync::Mutex;
use std::collections::HashMap;
use std::sync::Arc;
use tripcode::{TripcodeGenerator, Fourchan};
use crate::models::Message;

pub type Cache = Arc<Mutex<HashMap<String, Vec<Message>>>>;

pub fn process_username(username: &str) -> String {
    if let Some(pos) = username.find('#') {
        let (nick, tripcode) = username.split_at(pos);
        if nick.is_empty() {
            return username.to_string();
        }
        let tripcode_without_hash = &tripcode[1..];
        format!("{}#{}", nick, Fourchan::generate(tripcode_without_hash))
    } else {
        username.to_string()
    }
}