"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Signer = exports.AeonDID = void 0;
var did_js_1 = require("./src/did.js");
Object.defineProperty(exports, "AeonDID", { enumerable: true, get: function () { return did_js_1.AeonDID; } });
var signer_js_1 = require("./src/signer.js");
Object.defineProperty(exports, "Signer", { enumerable: true, get: function () { return signer_js_1.Signer; } });
//# sourceMappingURL=index.js.map