# pharos/x402 — Pharos x402 Agent Skill

> The first agent skill for x402 micro-payments on Pharos Network — 30,000 TPS, sub-second finality, Pacific Mainnet (Chain ID 1672).

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
[![npm: @pharosnetwork/x402-skill](https://img.shields.io/badge/npm-%40pharosnetwork%2Fx402--skill-red.svg)](https://www.npmjs.com/package/@pharosnetwork/x402-skill)
[![Compatible with: Claude Code | Codex | Gemini CLI | Cursor](https://img.shields.io/badge/Compatible%20with-Claude%20Code%20%7C%20Codex%20%7C%20Gemini%20CLI%20%7C%20Cursor-green.svg)](#quick-install)

---

## What this skill does

x402 reactivates HTTP 402 Payment Required for machine-native micro-payments. No accounts, no subscriptions, no payment gateways: the server returns 402 with payment terms, the client auto-pays from a wallet, and content is delivered immediately. The entire flow is trustless and programmable.

Why Pharos, not Base: Base has about 2s block time and finality that takes minutes for certainty; Pharos has sub-second finality and 30,000 TPS. For micro-payment scenarios such as sub-$0.01 pricing, high-frequency requests, and real-time access, Pharos's economics make it viable where Base cannot. Pharos is also the only major EVM chain currently without a public x402 agent skill, and this skill fills that gap.

---

## Quick install

**Claude Code**

```bash
npx ai-agent-skills install pharosnetwork/pharos-x402-skill
```

**Codex**

```bash
npx ai-agent-skills install pharosnetwork/pharos-x402-skill --agent codex
```

**Gemini CLI**

```bash
gemini extensions install https://github.com/pharosnetwork/pharos-x402-skill
```

**Cursor / manual**

```bash
git clone https://github.com/pharosnetwork/pharos-x402-skill ~/.skills/pharos-x402-skill
```

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
| Test faucet | https://testnet.pharosnetwork.xyz | — |

> **Mainnet USDC address:** Retrieve from [docs.pharos.xyz](https://docs.pharos.xyz/developer-guide/x402.md) before production deployment. The testnet USDC (`0xE0BE08c77f415F577A1B3A9aD7a1Df1479564ec8`) is a test token only.

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
