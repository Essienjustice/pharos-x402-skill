# pharos/x402 — Pharos x402 Agent Skill

> The first agent skill for x402 micro-payments on Pharos Network — 30,000 TPS, sub-second finality, Pacific Mainnet (Chain ID 1672).

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
[![npm: @pharosnetwork/x402-skill](https://img.shields.io/badge/npm-%40pharosnetwork%2Fx402--skill-red.svg)](https://www.npmjs.com/package/@pharosnetwork/x402-skill)
[![Compatible with: Claude Code | Codex | Gemini CLI | Cursor](https://img.shields.io/badge/Compatible%20with-Claude%20Code%20%7C%20Codex%20%7C%20Gemini%20CLI%20%7C%20Cursor-green.svg)](#quick-start-3-terminals)
[![Verified Working: 3 payments settled on Pharos Atlantic Testnet](https://img.shields.io/badge/Verified%20Working-3%20payments%20settled%20on%20Pharos%20Atlantic%20Testnet-brightgreen.svg)](#live-demo)

---

## What this skill does

x402 reactivates HTTP 402 Payment Required for machine-native micro-payments. No accounts, no subscriptions, no payment gateways: the server returns 402 with payment terms, the client auto-pays from a wallet, and content is delivered immediately. The entire flow is trustless and programmable.

Why Pharos, not Base: Base has about 2s block time and finality that takes minutes for certainty; Pharos has sub-second finality and 30,000 TPS. For micro-payment scenarios such as sub-$0.01 pricing, high-frequency requests, and real-time access, Pharos's economics make it viable where Base cannot. Pharos is also the only major EVM chain currently without a public x402 agent skill, and this skill fills that gap.

---

## Quick Start (3 terminals)

**Terminal 1 — Facilitator**

```bash
cd examples/facilitator
cp .env.example .env
# Edit .env: set EVM_PRIVATE_KEY to your burner wallet private key
npm install
npm run start
```

**Terminal 2 — Server**

```bash
cd examples/server
cp .env.example .env
# Edit .env: set PAY_TO_ADDRESS to your receiving wallet
npm install
npm run start
```

**Terminal 3 — Client**

```bash
cd examples/client
cp .env.example .env
# Edit .env: set EVM_PRIVATE_KEY and get USDC from https://faucet.circle.com (select Pharos network)
npm install
npx ts-node client.ts
```

---

## Live Demo

Verified transactions on Pharos Atlantic Testnet (`eip155:688689`):

- [0x6b6adb78c0ae0d712c99e69fe3d3c5239b432517408a268f475624e459990594](https://atlantic.pharosscan.xyz/tx/0x6b6adb78c0ae0d712c99e69fe3d3c5239b432517408a268f475624e459990594)
- [0x364ef3d20e06a713f23bf6922262068c2788fe911dbb217d86e087dd089924b8](https://atlantic.pharosscan.xyz/tx/0x364ef3d20e06a713f23bf6922262068c2788fe911dbb217d86e087dd089924b8)
- [0xc7d84b419b86c5c850a8c7331390d89966043bed74c35bae93f86c95e45eb913](https://atlantic.pharosscan.xyz/tx/0xc7d84b419b86c5c850a8c7331390d89966043bed74c35bae93f86c95e45eb913)

---

## Three roles

| Role | Trigger phrases | What the agent builds |
|------|----------------|----------------------|
| Server | "monetize my API", "add a paywall", "charge per request", "x402 server" | Express server with payment middleware protecting endpoints |
| Client | "call a paid API", "auto-pay", "x402 client", "pay for access" | Fetch wrapper that auto-pays 402 responses from a wallet |
| Facilitator | "run a facilitator", "x402 settlement service", "on-chain verification" | Express service handling /verify and /settle for on-chain USDC settlement |

---

## Network details

| Property | Atlantic Testnet | Pacific Ocean Mainnet |
|----------|------------------|-----------------------|
| Chain ID | 688689 | 1672 |
| EIP identifier | eip155:688689 | eip155:1672 |
| Native token (gas) | PHRS | PROS |
| RPC | https://atlantic.dplabs-internal.com | https://rpc.pharos.xyz |
| Explorer | https://atlantic.pharosscan.xyz | https://pharosscan.xyz |
| USDC | 0xcfc8330f4bcab529c625d12781b1c19466a9fc8b (Circle official) | Retrieve from docs.pharos.xyz |
| Test faucet | https://testnet.pharosnetwork.xyz | — |

> **Mainnet USDC address:** Retrieve from [docs.pharos.xyz](https://docs.pharos.xyz/developer-guide/x402.md) before production deployment. The Atlantic Testnet USDC (`0xcfc8330f4bcab529c625d12781b1c19466a9fc8b`) is the Circle official test token.

> **Get Testnet USDC:** Claim USDC from https://faucet.circle.com — select Pharos from the network dropdown. You need USDC to make payments and PHRS for gas (claim from https://testnet.pharosnetwork.xyz).

---

## Running the examples

### 1. Server

1. `git clone https://github.com/pharosnetwork/pharos-x402-skill && cd pharos-x402-skill`
2. `cd examples/server`
3. `cp .env.example .env`
4. Edit `.env` — fill in your wallet address and USDC contract.
5. `npm install`
6. `npm run start`
7. Test with `curl http://localhost:4021/health`

### 2. Client

1. `git clone https://github.com/pharosnetwork/pharos-x402-skill && cd pharos-x402-skill`
2. `cd examples/client`
3. `cp .env.example .env`
4. Edit `.env` — fill in your wallet address and USDC contract.
5. `npm install`
6. `npm run start`
7. Test with `npx ts-node client.ts http://localhost:4021/data`

### 3. Facilitator

1. `git clone https://github.com/pharosnetwork/pharos-x402-skill && cd pharos-x402-skill`
2. `cd examples/facilitator`
3. `cp .env.example .env`
4. Edit `.env` — fill in your wallet address and USDC contract.
5. `npm install`
6. `npm run start`
7. Test with `curl http://localhost:3000/health` and `curl http://localhost:3000/supported`

---

## Security

1. Never write private keys into source files or commit them to git. Always use `.env` files or `.private_key` files. Both are in `.gitignore`.
2. Always warn users to use a dedicated burner wallet for testing with only the minimum tokens needed.
3. In production, `FACILITATOR_URL` must be HTTPS, not HTTP.
4. Implement idempotency on the server: track seen `tx_hash` values (in-memory Map or Redis) and reject duplicate payment payloads to prevent double-billing.
5. Issue short-lived JWTs after payment verification for repeated access to the same resource within a session - reduces on-chain verification calls.
6. Never log private keys, never print them, never pass them as command-line arguments (visible in process list).
7. On mainnet: verify USDC contract address from https://docs.pharos.xyz before deploying. Never assume it matches the testnet address.

---

## Registry

This skill is submitted to:

- [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills)
- [agentskills/agentskills](https://github.com/agentskills/agentskills)
- [openclaw/skills](https://github.com/openclaw/skills)

---

## License

Apache-2.0 © Pharos Network Contributors
