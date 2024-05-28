use rocket::Route;
use crate::handlers::{post_message, events};

pub fn static_files_routes() -> Vec<Route> {
    routes![
        login,
        menu,
        profile,
        script,
        background,
        avatar,
        font,
        monaspaceneon,
        spectre,
        spectreicons,
        indexcss,
        logincss,
        addons,
        purify,
        marked,
        highlight,
        githubdark,
        toastify,
        toastifycss,
    ]
}

pub fn api_routes() -> Vec<Route> {
    routes![
        post_message,
        events,
    ]
}

static_response_handler! {
    "/login" => login => "login",
    "/menu" => menu => "menu",
    "/profile" => profile => "profile",
    "/js/script.js" => script => "script",
    "/js/purify.min.js" => purify => "purify",
    "/js/marked.min.js" => marked => "marked",
    "/js/highlight.min.js" => highlight => "highlight",
    "/css/github-dark.min.css" => githubdark => "github-dark",
    "/js/toastify.min.js" => toastify => "toastify",
    "/css/toastify.min.css" => toastifycss => "toastifycss",
    "/css/index.css" => indexcss => "indexcss",
    "/css/login.css" => logincss => "logincss",
    "/images/113113442_p0.avif" => background => "background",
    "/images/9b4815d6-bc7d-4bf9-aba3-18975efc89d1.avif" => avatar => "avatar",
    "/fonts/fusion-pixel-10px-proportional-zh_hans.woff2" => font => "font",
    "/fonts/MonaspaceNeon-Regular.woff" => monaspaceneon => "monaspaceneon",
    "/css/spectre-icons.min.css" => spectreicons => "spectreicons",
    "/css/spectre.min.css" => spectre => "spectre",
    "/css/addons.css" => addons => "addons",
}
