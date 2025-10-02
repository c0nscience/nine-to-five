use base64::{engine::general_purpose, Engine};
use hmac::{Hmac, Mac};
use sha2::Sha256;

#[allow(clippy::missing_errors_doc)]
pub fn hash(value: &str, key: &str) -> anyhow::Result<String> {
    let mut mac = Hmac::<Sha256>::new_from_slice(key.as_bytes())?;
    mac.update(value.as_bytes());
    let result = mac.finalize().into_bytes();
    let result = general_purpose::STANDARD.encode(result);
    Ok(result)
}
