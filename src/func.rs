use axum_extra::headers::Cookie;
use chrono_tz::Tz;
use urlencoding::decode;

pub fn parse_timezone(cookie: &Cookie) -> Tz {
    cookie
        .get("timezone")
        .and_then(|d| decode(d).ok())
        .and_then(|d| d.parse::<Tz>().ok())
        .unwrap_or(Tz::Europe__Berlin)
}
