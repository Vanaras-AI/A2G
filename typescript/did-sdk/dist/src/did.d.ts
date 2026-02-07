/**
 * @aeon/did-sdk - DID Management
 *
 * Create and manage AEON Decentralized Identifiers.
 */
import type { AeonDIDDocument, CreateDIDOptions } from "./types.js";
import { Signer } from "./signer.js";
/**
 * AEON DID - Decentralized Identifier for Agents
 *
 * @example
 * ```typescript
 * // Create a new DID
 * const did = AeonDID.create("my-agent");
 * console.log(did.did); // → "did:aeon:my-agent"
 *
 * // Sign with the DID's key
 * const sig = did.sign("message");
 * ```
 */
export declare class AeonDID {
    private document;
    private constructor();
    /** The full DID string (e.g., "did:aeon:my-agent") */
    get did(): string;
    /** The agent name */
    get name(): string;
    /** The signing key (keep this secret!) */
    get signingKey(): string;
    /** When the DID was created */
    get createdAt(): Date;
    /** The full DID document */
    get doc(): AeonDIDDocument;
    /**
     * Create a new DID with a generated signing key
     *
     * @param name - Name for the agent (used in DID)
     * @param options - Optional configuration
     * @returns New AeonDID instance
     *
     * @example
     * ```typescript
     * const did = AeonDID.create("my-agent");
     * // → did:aeon:my-agent
     * ```
     */
    static create(name: string, options?: CreateDIDOptions): AeonDID;
    /**
     * Create an AeonDID from an existing document
     *
     * @param document - The DID document
     * @returns AeonDID instance
     */
    static fromDocument(document: AeonDIDDocument): AeonDID;
    /**
     * Parse a DID string to extract the name
     *
     * @param did - DID string (e.g., "did:aeon:my-agent")
     * @returns The agent name
     */
    static parseName(did: string): string;
    /**
     * Sign a message with this DID's signing key
     *
     * @param message - Message to sign
     * @returns Signature object
     */
    sign(message: string | object): import("./types.js").Signature;
    /**
     * Verify a signature against this DID's signing key
     *
     * @param signature - Signature to verify
     * @param message - Original message
     * @returns True if valid
     */
    verify(signature: Parameters<typeof Signer.verify>[1], message: string | object): boolean;
    /**
     * Save this DID to the default storage location
     * (~/.aeon/dids/{name}.json)
     */
    save(): Promise<void>;
    /**
     * Load a DID from the default storage location
     *
     * @param name - Name of the DID to load
     * @returns AeonDID instance or null if not found
     */
    static load(name: string): Promise<AeonDID | null>;
    /**
     * List all stored DIDs
     */
    static list(): Promise<AeonDID[]>;
    /**
     * Delete a stored DID
     *
     * @param name - Name of the DID to delete
     * @returns True if deleted
     */
    static delete(name: string): Promise<boolean>;
}
//# sourceMappingURL=did.d.ts.map