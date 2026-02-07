//! A2G SDK for Rust
//! 
//! Provides types and traits for implementing AEON agents in Rust.

pub mod did;
pub mod protocol;

pub use did::{Signer, Signature, AeonDID};
pub use protocol::*;

// Re-export common types
pub use protocol::{A2gIntent, G2aVerdict, A2gReport};
