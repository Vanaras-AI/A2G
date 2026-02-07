"use strict";
/**
 * @aeon/did-sdk - DID Management
 *
 * Create and manage AEON Decentralized Identifiers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AeonDID = void 0;
const fs_1 = require("fs");
const os_1 = require("os");
const path_1 = require("path");
const signer_js_1 = require("./signer.js");
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
class AeonDID {
    document;
    constructor(document) {
        this.document = document;
    }
    // =========================================================================
    // Getters
    // =========================================================================
    /** The full DID string (e.g., "did:aeon:my-agent") */
    get did() {
        return this.document.did;
    }
    /** The agent name */
    get name() {
        return this.document.name;
    }
    /** The signing key (keep this secret!) */
    get signingKey() {
        return this.document.signingKey;
    }
    /** When the DID was created */
    get createdAt() {
        return this.document.createdAt;
    }
    /** The full DID document */
    get doc() {
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
    static create(name, options) {
        // Validate name
        if (!name || !/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(name)) {
            throw new Error("Invalid DID name. Use lowercase letters, numbers, and hyphens. " +
                "Must start and end with alphanumeric.");
        }
        const signingKey = options?.signingKey || signer_js_1.Signer.generateKey();
        const document = {
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
    static fromDocument(document) {
        return new AeonDID(document);
    }
    /**
     * Parse a DID string to extract the name
     *
     * @param did - DID string (e.g., "did:aeon:my-agent")
     * @returns The agent name
     */
    static parseName(did) {
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
    sign(message) {
        return signer_js_1.Signer.sign(this.signingKey, message);
    }
    /**
     * Verify a signature against this DID's signing key
     *
     * @param signature - Signature to verify
     * @param message - Original message
     * @returns True if valid
     */
    verify(signature, message) {
        return signer_js_1.Signer.verify(this.signingKey, signature, message);
    }
    // =========================================================================
    // Storage
    // =========================================================================
    /**
     * Save this DID to the default storage location
     * (~/.aeon/dids/{name}.json)
     */
    async save() {
        const storage = new FileStorage();
        await storage.save(this.document);
    }
    /**
     * Load a DID from the default storage location
     *
     * @param name - Name of the DID to load
     * @returns AeonDID instance or null if not found
     */
    static async load(name) {
        const storage = new FileStorage();
        const doc = await storage.load(name);
        return doc ? new AeonDID(doc) : null;
    }
    /**
     * List all stored DIDs
     */
    static async list() {
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
    static async delete(name) {
        const storage = new FileStorage();
        return storage.delete(name);
    }
}
exports.AeonDID = AeonDID;
/**
 * File-based DID storage
 * Stores DIDs in ~/.aeon/dids/
 */
class FileStorage {
    basePath;
    constructor(basePath) {
        this.basePath = basePath || (0, path_1.join)((0, os_1.homedir)(), ".aeon", "dids");
    }
    async ensureDir() {
        await fs_1.promises.mkdir(this.basePath, { recursive: true });
    }
    getPath(name) {
        return (0, path_1.join)(this.basePath, `${name}.json`);
    }
    async save(doc) {
        await this.ensureDir();
        const path = this.getPath(doc.name);
        await fs_1.promises.writeFile(path, JSON.stringify(doc, null, 2), "utf-8");
    }
    async load(name) {
        try {
            const path = this.getPath(name);
            const content = await fs_1.promises.readFile(path, "utf-8");
            const doc = JSON.parse(content);
            doc.createdAt = new Date(doc.createdAt);
            return doc;
        }
        catch {
            return null;
        }
    }
    async list() {
        try {
            await this.ensureDir();
            const files = await fs_1.promises.readdir(this.basePath);
            const docs = [];
            for (const file of files) {
                if (file.endsWith(".json")) {
                    const name = file.replace(".json", "");
                    const doc = await this.load(name);
                    if (doc)
                        docs.push(doc);
                }
            }
            return docs;
        }
        catch {
            return [];
        }
    }
    async delete(name) {
        try {
            const path = this.getPath(name);
            await fs_1.promises.unlink(path);
            return true;
        }
        catch {
            return false;
        }
    }
}
//# sourceMappingURL=did.js.map