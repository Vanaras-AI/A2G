/**
 * @aeon/did-sdk - HMAC-SHA256 Signer
 * 
 * Provides cryptographic signing and verification for AEON agents.
 */

import { createHmac, randomBytes } from "crypto";
import { v4 as uuidv4 } from "uuid";
import type { Signature, SignOptions } from "./types.js";

/**
 * HMAC-SHA256 Signer for AEON DID authentication
 */
export class Signer {
    /**
     * Sign a message using HMAC-SHA256
     * 
     * @param signingKey - The secret key (hex-encoded, 256-bit)
     * @param message - The message to sign (string or object)
     * @param options - Optional signing parameters
     * @returns Signature object with timestamp, nonce, and hash
     * 
     * @example
     * ```typescript
     * const sig = Signer.sign(key, "intent:tools/read_file");
     * // → { timestamp: "1738...", nonce: "uuid", hash: "abc123..." }
     * ```
     */
    static sign(
        signingKey: string,
        message: string | object,
        options?: SignOptions
    ): Signature {
        const timestamp = options?.timestamp || Date.now().toString();
        const nonce = options?.nonce || uuidv4();

        // Normalize message to string with sorted keys for consistency
        const messageStr = typeof message === "object"
            ? this.stableStringify(message)
            : message;

        // Create payload: timestamp:nonce:message
        const payload = `${timestamp}:${nonce}:${messageStr}`;

        // Generate HMAC-SHA256 hash
        const hash = createHmac("sha256", signingKey)
            .update(payload)
            .digest("hex");

        return { timestamp, nonce, hash };
    }

    /**
     * Stable JSON stringify with sorted keys
     * Ensures consistent serialization across languages
     */
    private static stableStringify(obj: object): string {
        return JSON.stringify(obj, Object.keys(obj).sort());
    }

    /**
     * Verify a signature
     * 
     * @param signingKey - The secret key used for signing
     * @param signature - The signature to verify
     * @param message - The original message
     * @param maxAgeMs - Maximum age of signature in ms (default: 5 minutes)
     * @returns True if signature is valid and not expired
     * 
     * @example
     * ```typescript
     * const valid = Signer.verify(key, signature, "message");
     * // → true
     * ```
     */
    static verify(
        signingKey: string,
        signature: Signature,
        message: string | object,
        maxAgeMs: number = 5 * 60 * 1000 // 5 minutes
    ): boolean {
        // Check timestamp age
        const signedAt = parseInt(signature.timestamp, 10);
        const now = Date.now();

        if (now - signedAt > maxAgeMs) {
            return false; // Signature expired
        }

        // Recompute the hash
        const expected = this.sign(signingKey, message, {
            timestamp: signature.timestamp,
            nonce: signature.nonce,
        });

        // Constant-time comparison to prevent timing attacks
        return this.constantTimeEqual(signature.hash, expected.hash);
    }

    /**
     * Generate a new random signing key
     * 
     * @returns Hex-encoded 256-bit key
     * 
     * @example
     * ```typescript
     * const key = Signer.generateKey();
     * // → "7f3a2b8c9d1e4f5a6b7c8d9e0f1a2b3c..."
     * ```
     */
    static generateKey(): string {
        return randomBytes(32).toString("hex");
    }

    /**
     * Hash a message without timestamp/nonce
     * Useful for creating deterministic hashes
     * 
     * @param signingKey - The secret key
     * @param message - The message to hash
     * @returns Hex-encoded HMAC-SHA256 hash
     */
    static hash(signingKey: string, message: string | object): string {
        const messageStr = typeof message === "object"
            ? this.stableStringify(message)
            : message;

        return createHmac("sha256", signingKey)
            .update(messageStr)
            .digest("hex");
    }

    /**
     * Constant-time string comparison
     * Prevents timing attacks on hash comparison
     */
    private static constantTimeEqual(a: string, b: string): boolean {
        if (a.length !== b.length) {
            return false;
        }

        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }

        return result === 0;
    }
}
