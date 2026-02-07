/**
 * @aeon/did-sdk - DID Management
 * 
 * Create and manage AEON Decentralized Identifiers.
 */

import { promises as fs } from "fs";
import { homedir } from "os";
import { join } from "path";
import type { AeonDIDDocument, CreateDIDOptions, DIDStorage } from "./types.js";
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
export class AeonDID {
    private document: AeonDIDDocument;

    private constructor(document: AeonDIDDocument) {
        this.document = document;
    }

    // =========================================================================
    // Getters
    // =========================================================================

    /** The full DID string (e.g., "did:aeon:my-agent") */
    get did(): string {
        return this.document.did;
    }

    /** The agent name */
    get name(): string {
        return this.document.name;
    }

    /** The signing key (keep this secret!) */
    get signingKey(): string {
        return this.document.signingKey;
    }

    /** When the DID was created */
    get createdAt(): Date {
        return this.document.createdAt;
    }

    /** The full DID document */
    get doc(): AeonDIDDocument {
        return { ...this.document };
    }

    // =========================================================================
    // Factory Methods
    // =========================================================================

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
    static create(name: string, options?: CreateDIDOptions): AeonDID {
        // Validate name
        if (!name || !/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(name)) {
            throw new Error(
                "Invalid DID name. Use lowercase letters, numbers, and hyphens. " +
                "Must start and end with alphanumeric."
            );
        }

        const signingKey = options?.signingKey || Signer.generateKey();

        const document: AeonDIDDocument = {
            did: `did:aeon:${name}`,
            name,
            signingKey,
            createdAt: new Date(),
            metadata: options?.metadata,
        };

        return new AeonDID(document);
    }

    /**
     * Create an AeonDID from an existing document
     * 
     * @param document - The DID document
     * @returns AeonDID instance
     */
    static fromDocument(document: AeonDIDDocument): AeonDID {
        return new AeonDID(document);
    }

    /**
     * Parse a DID string to extract the name
     * 
     * @param did - DID string (e.g., "did:aeon:my-agent")
     * @returns The agent name
     */
    static parseName(did: string): string {
        const match = did.match(/^did:aeon:(.+)$/);
        if (!match) {
            throw new Error(`Invalid AEON DID format: ${did}`);
        }
        return match[1];
    }

    // =========================================================================
    // Signing Methods
    // =========================================================================

    /**
     * Sign a message with this DID's signing key
     * 
     * @param message - Message to sign
     * @returns Signature object
     */
    sign(message: string | object) {
        return Signer.sign(this.signingKey, message);
    }

    /**
     * Verify a signature against this DID's signing key
     * 
     * @param signature - Signature to verify
     * @param message - Original message
     * @returns True if valid
     */
    verify(signature: Parameters<typeof Signer.verify>[1], message: string | object) {
        return Signer.verify(this.signingKey, signature, message);
    }

    // =========================================================================
    // Storage
    // =========================================================================

    /**
     * Save this DID to the default storage location
     * (~/.aeon/dids/{name}.json)
     */
    async save(): Promise<void> {
        const storage = new FileStorage();
        await storage.save(this.document);
    }

    /**
     * Load a DID from the default storage location
     * 
     * @param name - Name of the DID to load
     * @returns AeonDID instance or null if not found
     */
    static async load(name: string): Promise<AeonDID | null> {
        const storage = new FileStorage();
        const doc = await storage.load(name);
        return doc ? new AeonDID(doc) : null;
    }

    /**
     * List all stored DIDs
     */
    static async list(): Promise<AeonDID[]> {
        const storage = new FileStorage();
        const docs = await storage.list();
        return docs.map(doc => new AeonDID(doc));
    }

    /**
     * Delete a stored DID
     * 
     * @param name - Name of the DID to delete
     * @returns True if deleted
     */
    static async delete(name: string): Promise<boolean> {
        const storage = new FileStorage();
        return storage.delete(name);
    }
}

/**
 * File-based DID storage
 * Stores DIDs in ~/.aeon/dids/
 */
class FileStorage implements DIDStorage {
    private basePath: string;

    constructor(basePath?: string) {
        this.basePath = basePath || join(homedir(), ".aeon", "dids");
    }

    private async ensureDir(): Promise<void> {
        await fs.mkdir(this.basePath, { recursive: true });
    }

    private getPath(name: string): string {
        return join(this.basePath, `${name}.json`);
    }

    async save(doc: AeonDIDDocument): Promise<void> {
        await this.ensureDir();
        const path = this.getPath(doc.name);
        await fs.writeFile(path, JSON.stringify(doc, null, 2), "utf-8");
    }

    async load(name: string): Promise<AeonDIDDocument | null> {
        try {
            const path = this.getPath(name);
            const content = await fs.readFile(path, "utf-8");
            const doc = JSON.parse(content);
            doc.createdAt = new Date(doc.createdAt);
            return doc;
        } catch {
            return null;
        }
    }

    async list(): Promise<AeonDIDDocument[]> {
        try {
            await this.ensureDir();
            const files = await fs.readdir(this.basePath);
            const docs: AeonDIDDocument[] = [];

            for (const file of files) {
                if (file.endsWith(".json")) {
                    const name = file.replace(".json", "");
                    const doc = await this.load(name);
                    if (doc) docs.push(doc);
                }
            }

            return docs;
        } catch {
            return [];
        }
    }

    async delete(name: string): Promise<boolean> {
        try {
            const path = this.getPath(name);
            await fs.unlink(path);
            return true;
        } catch {
            return false;
        }
    }
}
