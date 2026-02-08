"use strict";
/**
 * @aeon/did-sdk - HMAC-SHA256 Signer
 *
 * Provides cryptographic signing and verification for AEON agents.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Signer = void 0;
const crypto_1 = require("crypto");
const uuid_1 = require("uuid");
/**
 * HMAC-SHA256 Signer for AEON DID authentication
 */
class Signer {
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
    static sign(signingKey, message, options) {
        const timestamp = options?.timestamp || Date.now().toString();
        const nonce = options?.nonce || (0, uuid_1.v4)();
        // Normalize message to string with sorted keys for consistency
        const messageStr = typeof message === "object"
            ? this.stableStringify(message)
            : message;
        // Create payload: timestamp:nonce:message
        const payload = `${timestamp}:${nonce}:${messageStr}`;
        // Generate HMAC-SHA256 hash
        const hash = (0, crypto_1.createHmac)("sha256", signingKey)
            .update(payload)
            .digest("hex");
        return { timestamp, nonce, hash };
    }
    /**
     * Stable JSON stringify with sorted keys
     * Ensures consistent serialization across languages
     */
    static stableStringify(value) {
        return JSON.stringify(this.sortKeys(value));
    }
    static sortKeys(value) {
        if (Array.isArray(value)) {
            return value.map((item) => this.sortKeys(item));
        }
        if (value && typeof value === "object") {
            const record = value;
            const next = {};
            for (const key of Object.keys(record).sort()) {
                next[key] = this.sortKeys(record[key]);
            }
            return next;
        }
        return value;
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
    static verify(signingKey, signature, message, maxAgeMs = 5 * 60 * 1000 // 5 minutes
    ) {
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
    static generateKey() {
        return (0, crypto_1.randomBytes)(32).toString("hex");
    }
    /**
     * Hash a message without timestamp/nonce
     * Useful for creating deterministic hashes
     *
     * @param signingKey - The secret key
     * @param message - The message to hash
     * @returns Hex-encoded HMAC-SHA256 hash
     */
    static hash(signingKey, message) {
        const messageStr = typeof message === "object"
            ? this.stableStringify(message)
            : message;
        return (0, crypto_1.createHmac)("sha256", signingKey)
            .update(messageStr)
            .digest("hex");
    }
    /**
     * Constant-time string comparison
     * Prevents timing attacks on hash comparison
     */
    static constantTimeEqual(a, b) {
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
exports.Signer = Signer;
//# sourceMappingURL=signer.js.map