/**
 * @aeon/did-sdk - HMAC-SHA256 Signer
 *
 * Provides cryptographic signing and verification for AEON agents.
 */
import type { Signature, SignOptions } from "./types.js";
/**
 * HMAC-SHA256 Signer for AEON DID authentication
 */
export declare class Signer {
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
    static sign(signingKey: string, message: string | object, options?: SignOptions): Signature;
    /**
     * Stable JSON stringify with sorted keys
     * Ensures consistent serialization across languages
     */
    private static stableStringify;
    private static sortKeys;
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
    static verify(signingKey: string, signature: Signature, message: string | object, maxAgeMs?: number): boolean;
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
    static generateKey(): string;
    /**
     * Hash a message without timestamp/nonce
     * Useful for creating deterministic hashes
     *
     * @param signingKey - The secret key
     * @param message - The message to hash
     * @returns Hex-encoded HMAC-SHA256 hash
     */
    static hash(signingKey: string, message: string | object): string;
    /**
     * Constant-time string comparison
     * Prevents timing attacks on hash comparison
     */
    private static constantTimeEqual;
}
//# sourceMappingURL=signer.d.ts.map