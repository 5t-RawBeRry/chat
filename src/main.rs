#[macro_use] extern crate rocket;
#[macro_use] extern crate rocket_include_static_resources;

use rocket::config::Config;
use rocket::figment::Figment;
use rocket::tokio::sync::broadcast::channel;
use rocket::tokio::sync::Mutex;
use std::collections::HashMap;
use std::sync::Arc;

mod routes;
mod handlers;
mod models;
mod utils;

use routes::{static_files_routes, api_routes};
use handlers::index;
use models::Message;
use utils::Cache;

#[launch]
fn rocket() -> _ {
    let cache: Cache = Arc::new(Mutex::new(HashMap::new()));
    let figment = Figment::from(Config::default())
        .merge(("port", 65535))
        .merge(("address", "127.0.0.1"))
        .merge(("log_level", "critical"))
        .merge(("secret_key", "1feb33f4-9e45-4491-903b-757b60163bb4"));

    rocket::custom(figment)
        .attach(static_resources_initializer!(
            "login" => "static/login.html",
            "menu" => "static/menu.html",
            "profile" => "static/profile.html",
            "spectreicons" => "static/css/spectre-icons.min.css",
            "spectre" => "static/css/spectre.min.css",
            "addons" => "static/css/addons.css",
            "indexcss" => "static/css/index.css",
            "logincss" => "static/css/login.css",
            "script" => "static/js/script.js",
            "purify" => "static/js/purify.min.js",
            "marked" => "static/js/marked.min.js",
            "highlight" => "static/js/highlight.min.js",
            "github-dark" => "static/css/github-dark.min.css",
            "toastify" => "static/js/toastify.min.js",
            "toastifycss" => "static/css/toastify.min.css",
            "font" => "static/fonts/fusion-pixel-10px-proportional-zh_hans.woff2",
            "monaspaceneon" => "static/fonts/MonaspaceNeon-Regular.woff",
            "background" => "static/images/113113442_p0.avif",
            "avatar" => "static/images/9b4815d6-bc7d-4bf9-aba3-18975efc89d1.avif",
            "room" => "static/index.html",
        ))
        .manage(cache)
        .manage(channel::<Message>(1024).0)
        .mount("/", static_files_routes())
        .mount("/", api_routes())
        .mount("/", routes![index])
}
