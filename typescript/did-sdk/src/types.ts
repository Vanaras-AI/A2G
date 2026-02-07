/**
 * @aeon/did-sdk - Type Definitions
 * 
 * Core interfaces for DID identity and HMAC signing.
 */

/**
 * Represents an AEON DID (Decentralized Identifier)
 */
export interface AeonDIDDocument {
    /** The DID string (e.g., "did:aeon:my-agent") */
    did: string;

    /** The agent name */
    name: string;

    /** HMAC-SHA256 signing key (hex-encoded, 256-bit) */
    signingKey: string;

    /** When the DID was created */
    createdAt: Date;

    /** Optional metadata */
    metadata?: Record<string, unknown>;
}

/**
 * Signature produced by HMAC-SHA256 signing
 */
export interface Signature {
    /** Unix timestamp in milliseconds when signature was created */
    timestamp: string;

    /** Unique nonce (UUIDv4) to prevent replay attacks */
    nonce: string;

    /** HMAC-SHA256 hash of the message (hex-encoded) */
    hash: string;
}

/**
 * Options for creating a new DID
 */
export interface CreateDIDOptions {
    /** Custom signing key (if not provided, one will be generated) */
    signingKey?: string;

    /** Optional metadata to attach to the DID document */
    metadata?: Record<string, unknown>;
}

/**
 * Options for signing a message
 */
export interface SignOptions {
    /** Custom timestamp (defaults to current time) */
    timestamp?: string;

    /** Custom nonce (defaults to UUIDv4) */
    nonce?: string;
}

/**
 * Storage interface for DID documents
 */
export interface DIDStorage {
    /** Save a DID document */
    save(doc: AeonDIDDocument): Promise<void>;

    /** Load a DID document by name */
    load(name: string): Promise<AeonDIDDocument | null>;

    /** List all stored DIDs */
    list(): Promise<AeonDIDDocument[]>;

    /** Delete a DID document */
    delete(name: string): Promise<boolean>;
}
