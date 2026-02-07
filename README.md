# A2G Protocol SDKs

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Protocol](https://img.shields.io/badge/A2G-v1.1.5-green.svg)

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
All SDKs implement the **Identity-Only Signing** scheme (`timestamp:nonce:agent_did`) verified by the AEON Engine.

## 📜 License
MIT License. See [LICENSE](LICENSE) for details.
