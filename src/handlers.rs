use rocket::{State, Shutdown};
use rocket::form::Form;
use rocket::response::stream::{EventStream, Event};
use rocket::tokio::select;
use rocket::tokio::sync::broadcast::{Sender, error::RecvError};
use rocket_include_static_resources::{EtagIfNoneMatch, StaticContextManager, StaticResponse};

use crate::models::Message;
use crate::utils::{process_username, Cache};

#[post("/message", data = "<form>")]
pub async fn post_message(
    form: Form<Message>, 
    queue: &State<Sender<Message>>, 
    cache: &State<Cache>
) {
    let mut msg = form.into_inner();
    msg.username = process_username(&msg.username);

    let mut cache_lock = cache.lock().await;
    if msg.message == "/clear" {
        cache_lock.entry(msg.room.clone()).or_insert_with(Vec::new).clear();
    } else {
        cache_lock.entry(msg.room.clone()).or_insert_with(Vec::new).push(msg.clone());
        let _res = queue.send(msg);
    }
}

#[get("/events/<room_id>")]
pub async fn events(
    room_id: String, 
    queue: &State<Sender<Message>>, 
    cache: &State<Cache>, 
    mut end: Shutdown
) -> EventStream![] {
    let mut rx = queue.subscribe();
    let cache_lock = cache.lock().await;
    let cached_messages = cache_lock.get(&room_id).cloned().unwrap_or_default();

    EventStream! {
        // Send cached messages first
        for message in cached_messages {
            yield Event::json(&message);
        }

        // Listen for new messages
        loop {
            let msg = select! {
                msg = rx.recv() => match msg {
                    Ok(msg) => msg,
                    Err(RecvError::Closed) => break,
                    Err(RecvError::Lagged(_)) => continue,
                },
                _ = &mut end => break,
            };

            if msg.room == room_id {
                yield Event::json(&msg);
            }
        }
    }
}

#[get("/")]
pub fn index(
    static_resources: &State<StaticContextManager>, 
    etag_if_none_match: EtagIfNoneMatch
) -> StaticResponse {
    static_resources.build(&etag_if_none_match, "room")
}
