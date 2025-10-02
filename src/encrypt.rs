use aes_gcm::{
    aead::{Aead, OsRng},
    AeadCore, Aes256Gcm, Key, KeyInit, Nonce,
};
use anyhow::anyhow;
use base64::{engine::general_purpose, Engine};

#[allow(clippy::missing_errors_doc)]
pub fn encrypt(value: &str, key: &Key<Aes256Gcm>) -> anyhow::Result<String> {
    let aead = Aes256Gcm::new(key);
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);

    let cyphertext = aead
        .encrypt(&nonce, value.as_ref())
        .map_err(|e| anyhow!(e))?;

    let mut encrypted_data: Vec<u8> = nonce.to_vec();
    encrypted_data.extend_from_slice(&cyphertext);
    Ok(general_purpose::STANDARD.encode(encrypted_data))
}

#[allow(clippy::missing_errors_doc)]
pub fn decrypt(cyphertext: &str, key: &Key<Aes256Gcm>) -> anyhow::Result<String> {
    let cyphertext = general_purpose::STANDARD.decode(cyphertext)?;
    let (nonce_arr, ciphered_data) = cyphertext.split_at(12);
    let nonce = Nonce::from_slice(nonce_arr);

    let aead = Aes256Gcm::new(key);
    let plain_text = aead.decrypt(nonce, ciphered_data).map_err(|e| anyhow!(e))?;

    let plain_text = String::from_utf8(plain_text)?;
    Ok(plain_text)
}
