


⚠️ This Repository Has Been Deprecated
This repo is no longer maintained. The A2G Protocol has moved to a new home:
→ Vanaras-AI/a2g-cli
The new repo contains the full Rust implementation with:

8-step deterministic enforcement pipeline
ed25519 identity, signed mandates, hash-chained receipts
Layer 0 authority governance (delegation chains, proposals, reviews)
Execution lineage and trust compression
Visual governance receipts (terminal, HTML, JSON)
Drop-in integrations for LangChain, CrewAI, OpenAI Agents, Claude SDK, and MCP
39 unit tests, 4.6MB release binary, zero runtime dependencies

bashgit clone https://github.com/Vanaras-AI/a2g-cli.git
cd a2g-cli
cargo build --release

This repository is archived and read-only. All issues and PRs should be opened on a2g-cli.

























# A2G Protocol SDKs

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Protocol](https://img.shields.io/badge/A2G-v1.1.6-green.svg)

This repository contains the official Software Development Kits (SDKs) for the **Agent-to-Governance (A2G) Protocol**, enabling AI agents to connect securely with the AEON Governance Engine.

## 📂 Repository Structure

```text
A2G/
├── python/        # Python SDK (a2g-sdk)
├── typescript/    # TypeScript SDKs
│   ├── a2g-sdk/   # Client SDK (@aeon/a2g-sdk)
│   └── did-sdk/   # Identity SDK (@aeon/did-sdk)
└── rust/          # Rust SDK (a2g-rust)
```

## 🚀 Getting Started

### 🐍 Python
Install the SDK:
```bash
pip install a2g-sdk
```

Usage:
```python
from a2g_sdk import A2gClient, ClientConfig

config = ClientConfig(agent_did="did:aeon:my-agent")
async with A2gClient(config) as client:
    verdict = await client.request_intent("write_file", {"path": "/tmp/test"})
```

### 📘 TypeScript
Install the packages:
```bash
npm install @aeon/a2g-sdk @aeon/did-sdk
```

Usage:
```typescript
import { A2gClient } from "@aeon/a2g-sdk";

const client = new A2gClient("ws://localhost:3000", "did:aeon:my-agent");
await client.connect();
const verdict = await client.requestIntent("write_file", { path: "/tmp/test" });
```

### 🦀 Rust
Add to `Cargo.toml`:
```toml
[dependencies]
a2g-rust = { path = "A2G/rust/a2g-rust" }
```

Usage:
```rust
use a2g_rust::{A2gIntent, Signer};

let intent = A2gIntent::new("did:aeon:my-agent", "write_file", json!({...}));
```

## 🔐 Security
All SDKs implement **Identity-Only Signing** for the initial handshake
(`timestamp:nonce:agent_did`) and **full payload signing** for intents
(`timestamp:nonce:canonical_json(params_without_signature)`) verified by the AEON Engine.

## 📜 License
MIT License. See [LICENSE](LICENSE) for details.
