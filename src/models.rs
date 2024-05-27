use rocket::serde::{Serialize, Deserialize};

#[derive(Debug, Clone, FromForm, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, UriDisplayQuery))]
#[serde(crate = "rocket::serde")]
pub struct Message {
    #[field(validate = len(..1024))]
    pub room: String,
    #[field(validate = len(..20))]
    pub username: String,
    pub avatar: String,
    pub message: String,
    pub timestamp: i64,
}
