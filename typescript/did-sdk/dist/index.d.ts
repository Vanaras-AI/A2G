/**
 * @aeon/did-sdk
 *
 * DID identity and HMAC-SHA256 signing for AEON agents.
 *
 * @example
 * ```typescript
 * import { AeonDID, Signer } from "@aeon/did-sdk";
 *
 * // Create a new DID with signing key
 * const did = AeonDID.create("my-agent");
 * console.log(did.did); // → "did:aeon:my-agent"
 *
 * // Sign a message
 * const signature = did.sign({ tool: "read_file", args: {} });
 *
 * // Or use Signer directly
 * const sig = Signer.sign(key, "message");
 * const valid = Signer.verify(key, sig, "message");
 * ```
 *
 * @packageDocumentation
 */
export { AeonDID } from "./src/did.js";
export { Signer } from "./src/signer.js";
export type { AeonDIDDocument, Signature, CreateDIDOptions, SignOptions, DIDStorage, } from "./src/types.js";
//# sourceMappingURL=index.d.ts.map