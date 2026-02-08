use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;
use hmac::{Hmac, Mac};
use sha2::Sha256;
use hex;
use std::fs;
use std::path::{PathBuf};
use subtle::ConstantTimeEq;

type HmacSha256 = Hmac<Sha256>;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AeonDIDDocument {
    pub did: String,
    pub name: String,
    pub signing_key: String,
    pub created_at: DateTime<Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Signature {
    pub timestamp: String,
    pub nonce: String,
    pub hash: String,
}

pub struct Signer;

impl Signer {
    pub fn generate_key() -> String {
        let mut key = [0u8; 32];
        rand::Rng::fill(&mut rand::thread_rng(), &mut key);
        hex::encode(key)
    }

    pub fn sign(signing_key: &str, message: &serde_json::Value, timestamp: Option<String>, nonce: Option<String>) -> Result<Signature, Box<dyn std::error::Error>> {
        let timestamp = timestamp.unwrap_or_else(|| Utc::now().timestamp_millis().to_string());
        let nonce = nonce.unwrap_or_else(|| Uuid::new_v4().to_string());

        let message_str = Self::stable_stringify(message)?;
        // Identity-only signing payload format: timestamp:nonce:agent_did
        // BUT wait - the generic signer should sign what it's given. 
        // The SDK client determines WHAT to sign.
        // However, looking at the Python/TS implementations, `Signer.sign` takes a message and constructs payload:
        // payload = f"{ts}:{nc}:{msg_str}"
        // So for identity-only signing, `message` will be the DID string.
        
        let payload = format!("{}:{}:{}", timestamp, nonce, message_str);

        let mut mac = HmacSha256::new_from_slice(hex::decode(signing_key)?.as_slice())
            .map_err(|_| "Invalid key length")?;
        mac.update(payload.as_bytes());
        let result = mac.finalize();
        let hash = hex::encode(result.into_bytes());

        Ok(Signature { timestamp, nonce, hash })
    }

    pub fn verify(signing_key: &str, signature: &Signature, message: &serde_json::Value, max_age_ms: u64) -> bool {
        let signed_at = match signature.timestamp.parse::<i64>() {
            Ok(t) => t,
            Err(_) => return false,
        };
        let now = Utc::now().timestamp_millis();

        if (now - signed_at).abs() as u64 > max_age_ms {
            return false;
        }

        let expected_sig = match Self::sign(
            signing_key,
            message,
            Some(signature.timestamp.clone()),
            Some(signature.nonce.clone()),
        ) {
            Ok(s) => s,
            Err(_) => return false,
        };

        let sig_hash_bytes = match hex::decode(&signature.hash) {
            Ok(b) => b,
            Err(_) => return false,
        };
        let expected_hash_bytes = match hex::decode(&expected_sig.hash) {
            Ok(b) => b,
            Err(_) => return false,
        };

        sig_hash_bytes.ct_eq(&expected_hash_bytes).into()
    }

    fn stable_stringify(message: &serde_json::Value) -> Result<String, Box<dyn std::error::Error>> {
        fn normalize(value: &serde_json::Value) -> serde_json::Value {
            match value {
                serde_json::Value::Object(map) => {
                    let mut keys: Vec<_> = map.keys().collect();
                    keys.sort();
                    let mut ordered = serde_json::Map::new();
                    for key in keys {
                        if let Some(v) = map.get(key) {
                            ordered.insert(key.clone(), normalize(v));
                        }
                    }
                    serde_json::Value::Object(ordered)
                }
                serde_json::Value::Array(items) => {
                    serde_json::Value::Array(items.iter().map(normalize).collect())
                }
                _ => value.clone(),
            }
        }

        let normalized = normalize(message);
        match normalized {
            serde_json::Value::String(s) => Ok(s),
            _ => Ok(serde_json::to_string(&normalized)?),
        }
    }
}

pub struct AeonDID {
    pub document: AeonDIDDocument,
}

impl AeonDID {
    pub fn create(name: &str, signing_key: Option<String>, metadata: Option<serde_json::Value>) -> Result<Self, Box<dyn std::error::Error>> {
        if name.is_empty() || !name.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-') {
            return Err("Invalid DID name. Use lowercase letters, numbers, and hyphens.".into());
        }

        let signing_key = signing_key.unwrap_or_else(Signer::generate_key);

        let document = AeonDIDDocument {
            did: format!("did:aeon:{}", name),
            name: name.to_string(),
            signing_key,
            created_at: Utc::now(),
            metadata,
        };

        Ok(AeonDID { document })
    }

    pub fn from_document(document: AeonDIDDocument) -> Self {
        AeonDID { document }
    }

    pub fn signing_key(&self) -> &str {
        &self.document.signing_key
    }
}
