---
name: pharos/x402
version: 1.0.0
description: Build and consume x402 micro-payment APIs on Pharos Network. Supports monetizing any HTTP endpoint, auto-paying from an agent wallet, and running an on-chain settlement facilitator. Works on Atlantic Testnet (chain ID 688689) and Pacific Mainnet (chain ID 1672).
authors:
  - Pharos Network
license: Apache-2.0
tags:
  - pharos
  - x402
  - micro-payments
  - blockchain
  - usdc
  - realfi
  - agent-commerce
activation:
  triggers:
    - monetize an API
    - add a paywall
    - charge per request
    - x402 server
    - pay for API access
    - auto-pay
    - x402 client
    - run a facilitator
    - x402 settlement
    - pay-per-use
    - pharos payment
    - x402 on pharos
---

## Overview

x402 is the HTTP 402 Payment Required protocol reactivated for crypto micro-payments. This skill lets agents build monetized APIs, pay for x402-gated services, or run settlement infrastructure, all on Pharos Network. Pharos is currently the only major EVM chain with a first-class x402 skill in the agent skills registries, covering Atlantic Testnet and Pacific Mainnet.

## When to use this skill

- "I want to charge for my API / monetize an endpoint" -> Role: SERVER
- "I want my agent to call a paid API and pay automatically" -> Role: CLIENT
- "I want to run the payment verification and settlement service" -> Role: FACILITATOR

## Network reference

| Property | Atlantic Testnet | Pacific Mainnet |
|---|---|---|
| Network name | Atlantic Testnet | Pacific Ocean Mainnet |
| Chain ID | 688689 | 1672 |
| EIP identifier | eip155:688689 | eip155:1672 |
| Native token | PHRS | PROS |
| RPC (public) | https://atlantic.dplabs-internal.com | https://rpc.pharos.xyz |
| WSS | wss://atlantic.dplabs-internal.com | (see docs.pharos.xyz) |
| Explorer | https://atlantic.pharosscan.xyz | https://pharosscan.xyz |
| Testnet flag in viem | testnet: true | testnet: false |

Always verify the latest RPC URLs and USDC contract addresses at https://docs.pharos.xyz before production deployment. For mainnet USDC, query: GET https://docs.pharos.xyz/developer-guide/x402.md?ask=What+is+the+USDC+contract+address+on+Pacific+Mainnet

## USDC token addresses

- Atlantic Testnet (unofficial test token): `0xE0BE08c77f415F577A1B3A9aD7a1Df1479564ec8` - NOT for production
- Pacific Mainnet: Retrieve from official docs before use. USDC and CCTP deployed to Pharos mainnet in April 2026 via Circle partnership. Do NOT hardcode; always read from docs.pharos.xyz.
- USDC has 6 decimals. 1 USDC = 1,000,000 raw units. Conversion: `Math.round(amountUSD * 1e6).toString()`

## SDK packages

Install with:

```bash
npm install @x402/express @x402/fetch @x402/core @x402/evm viem dotenv
```

- `@x402/express` - server-side paymentMiddleware
- `@x402/fetch` - client-side wrapFetchWithPayment
- `@x402/core/server` - HTTPFacilitatorClient, x402ResourceServer
- `@x402/core/facilitator` - x402Facilitator
- `@x402/evm` - toFacilitatorEvmSigner
- `@x402/evm/exact/server` - ExactEvmScheme (server)
- `@x402/evm/exact/client` - ExactEvmScheme (client)
- `@x402/evm/exact/facilitator` - ExactEvmScheme (facilitator)
- `viem` - defineChain, createWalletClient, privateKeyToAccount

## Role 1: Monetize an API (SERVER)

Step-by-step instructions the agent must follow exactly:

1. Ask the user for these values (do not proceed without them):
   - `PAY_TO_ADDRESS`: the wallet address that receives payments (0x...)
   - `FACILITATOR_URL`: URL of a running facilitator service (default: http://localhost:3000)
   - `PORT`: server port (default: 4021)
   - `USDC_ADDRESS`: USDC contract on the target network - warn user to verify from docs.pharos.xyz for mainnet
   - `NETWORK`: "testnet" (eip155:688689) or "mainnet" (eip155:1672)
   - Endpoint prices: list at least one endpoint with its USD price

2. Create `server.ts` using this exact pattern (agent must use real values from step 1, not placeholders):

```typescript
import { config } from "dotenv";
config();
import express from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";

const payToAddress = process.env.PAY_TO_ADDRESS as `0x${string}`;
if (!payToAddress) { console.error("PAY_TO_ADDRESS required"); process.exit(1); }
const facilitatorUrl = process.env.FACILITATOR_URL!;
const port = parseInt(process.env.PORT || "4021", 10);
const usdcAddress = process.env.USDC_ADDRESS!;
const usdcName = process.env.USDC_NAME || "USDC";
const network = process.env.PHAROS_NETWORK || "eip155:688689"; // eip155:1672 for mainnet

const facilitatorClient = new HTTPFacilitatorClient({ url: facilitatorUrl });
const resourceServer = new x402ResourceServer(facilitatorClient);
const evmScheme = new ExactEvmScheme();

evmScheme.registerMoneyParser(async (amount: number, net: string) => {
  if (net === network) {
    return {
      amount: Math.round(amount * 1e6).toString(),
      asset: usdcAddress,
      extra: { token: usdcName, name: usdcName, version: "2" },
    };
  }
  return null;
});

resourceServer.register(network, evmScheme);
const app = express();

app.use(paymentMiddleware(
  {
    "GET /data": { accepts: { scheme: "exact", price: "0.01", network, payTo: payToAddress }, description: "Paid data", mimeType: "application/json" },
    "GET /api/premium": { accepts: { scheme: "exact", price: "0.05", network, payTo: payToAddress }, description: "Premium endpoint", mimeType: "application/json" },
  },
  resourceServer
));

app.get("/data", (_req, res) => res.json({ message: "Paid access granted", timestamp: Date.now() }));
app.get("/api/premium", (_req, res) => res.json({ message: "Premium content", timestamp: Date.now() }));
app.get("/health", (_req, res) => res.json({ status: "ok", chainId: network, payTo: payToAddress }));

app.listen(port, () => {
  console.log(`Server on http://localhost:${port}`);
  console.log(`Network: ${network}`);
  console.log(`Paying to: ${payToAddress}`);
});
```

3. Write `.env` with the values collected in step 1. NEVER write actual private keys.
4. Write `package.json` with dependencies: `@x402/express`, `@x402/evm`, `@x402/core`, `viem`, `express`, `dotenv`; devDependencies: `typescript@^5`, `ts-node@^10`, `@types/express@^4`, `@types/node@^20`; scripts: `{ "start": "npx ts-node server.ts" }`
5. Run: `npm install && npm run start`
6. Verify: `curl http://localhost:4021/health`

## Role 2: Call a paid API (CLIENT)

Step-by-step instructions:

1. Warn: "Use a BURNER WALLET with only the USDC needed for this test. Never use your main wallet. Never share your private key with any service."
2. Ask for:
   - `EVM_PRIVATE_KEY`: private key of burner wallet (0x...) - or path to `.private_key` file
   - `TARGET_URL`: the x402-protected endpoint to call (default: http://localhost:4021/data)
   - `NETWORK`: "testnet" or "mainnet"

3. Create `client.ts` using this exact pattern:

```typescript
import { config } from "dotenv";
config();
import { wrapFetchWithPayment, x402Client, decodePaymentResponseHeader } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";
import fs from "fs";

const privateKey =
  process.env.EVM_PRIVATE_KEY ||
  (fs.existsSync(".private_key") ? fs.readFileSync(".private_key", "utf-8").trim() : null);
if (!privateKey) { console.error("Set EVM_PRIVATE_KEY or create .private_key file"); process.exit(1); }

const signer = privateKeyToAccount(privateKey as `0x${string}`);
const network = process.env.PHAROS_NETWORK || "eip155:688689";
const client = new x402Client();
client.register(network, new ExactEvmScheme(signer));
const fetchWithPayment = wrapFetchWithPayment(fetch, client);
const url = process.argv[2] || process.env.TARGET_URL || "http://localhost:4021/data";

console.log(`Requesting: ${url}`);
console.log(`Wallet: ${signer.address}`);
console.log(`Network: ${network}`);

try {
  const response = await fetchWithPayment(url);
  const data = await response.json();
  console.log("Response:", JSON.stringify(data, null, 2));
  const header = response.headers.get("PAYMENT-RESPONSE");
  if (header) {
    const p = decodePaymentResponseHeader(header);
    console.log("Tx hash:", p.transaction);
    console.log("Network:", p.network);
    console.log("Payer:", p.payer);
  }
} catch (err) {
  console.error("Failed:", err);
  process.exit(1);
}
```

4. Write `.env` with collected values (PHAROS_NETWORK=eip155:688689 or eip155:1672)
5. Write `package.json` with dependencies: `@x402/fetch`, `@x402/evm`, `viem`, `dotenv`; devDependencies same as server
6. Run: `npm install && npx ts-node client.ts`

## Role 3: Run a Facilitator (FACILITATOR)

Step-by-step instructions:

1. Warn: "The facilitator wallet must hold native tokens for gas: PHRS on testnet, PROS on mainnet. Fund it before starting."
2. Ask for:
   - `EVM_PRIVATE_KEY`: facilitator wallet private key
   - `PORT`: facilitator port (default: 3000)
   - `NETWORK`: "testnet" (chain 688689) or "mainnet" (chain 1672)

3. Create `facilitator.ts` with the correct chain definition per selected network:

For TESTNET (chain 688689):

```typescript
const pharos = defineChain({
  id: 688_689,
  name: "Pharos Atlantic Testnet",
  nativeCurrency: { name: "PHRS", symbol: "PHRS", decimals: 18 },
  rpcUrls: { default: { http: ["https://atlantic.dplabs-internal.com"] } },
  blockExplorers: { default: { name: "PharosScan", url: "https://atlantic.pharosscan.xyz" } },
  testnet: true,
});
const NETWORK_ID = "eip155:688689";
```

For MAINNET (chain 1672):

```typescript
const pharos = defineChain({
  id: 1672,
  name: "Pharos Pacific Ocean Mainnet",
  nativeCurrency: { name: "PROS", symbol: "PROS", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.pharos.xyz"] } },
  blockExplorers: { default: { name: "PharosScan", url: "https://pharosscan.xyz" } },
  testnet: false,
});
const NETWORK_ID = "eip155:1672";
```

Then continue with:

```typescript
import dotenv from "dotenv";
import express from "express";
import { privateKeyToAccount } from "viem/accounts";
import { createWalletClient, http, publicActions, defineChain } from "viem";
import { x402Facilitator } from "@x402/core/facilitator";
import { toFacilitatorEvmSigner } from "@x402/evm";
import { ExactEvmScheme } from "@x402/evm/exact/facilitator";
dotenv.config();

if (!process.env.EVM_PRIVATE_KEY) { console.error("EVM_PRIVATE_KEY required"); process.exit(1); }

// [insert chain definition from above]

const account = privateKeyToAccount(process.env.EVM_PRIVATE_KEY as `0x${string}`);
const walletClient = createWalletClient({
  account, chain: pharos,
  transport: http(undefined, { timeout: 30_000 }),
}).extend(publicActions);

const signer = toFacilitatorEvmSigner({
  address: account.address,
  getCode: (args) => walletClient.getCode(args),
  readContract: (args) => walletClient.readContract({ ...args, args: args.args || [] }),
  verifyTypedData: (args) => walletClient.verifyTypedData(args as any),
  writeContract: (args) => walletClient.writeContract({ ...args, args: args.args || [] }),
  sendTransaction: (args) => walletClient.sendTransaction(args),
  waitForTransactionReceipt: (args) => walletClient.waitForTransactionReceipt(args),
});

const facilitator = new x402Facilitator();
facilitator.register(NETWORK_ID, new ExactEvmScheme(signer, { deployERC4337WithEIP6492: true }));

const app = express();
app.use(express.json());

app.post("/verify", async (req, res) => {
  try { res.json(await facilitator.verify(req.body.paymentPayload, req.body.paymentRequirements)); }
  catch (e) { res.status(500).json({ error: (e as Error).message }); }
});
app.post("/settle", async (req, res) => {
  try { res.json(await facilitator.settle(req.body.paymentPayload, req.body.paymentRequirements)); }
  catch (e) { res.status(500).json({ error: (e as Error).message }); }
});
app.get("/supported", (_req, res) => res.json(facilitator.getSupported()));
app.get("/health", (_req, res) => res.json({ status: "ok", network: NETWORK_ID, address: account.address }));

const PORT = parseInt(process.env.PORT || "3000", 10);
app.listen(PORT, () => {
  console.log(`Facilitator on http://localhost:${PORT}`);
  console.log(`Network: ${NETWORK_ID}`);
  console.log(`Wallet: ${account.address}`);
});
```

4. Write `.env` and `package.json` (deps: `@x402/core`, `@x402/evm`, `viem`, `express`, `dotenv`)
5. Run: `npm install && npm run start`
6. Verify: `curl http://localhost:3000/health` and `curl http://localhost:3000/supported`

## Security rules (agent must follow these - never skip)

1. Never write private keys into source files or commit them to git. Always use `.env` files or `.private_key` files. Both are in `.gitignore`.
2. Always warn users to use a dedicated burner wallet for testing with only the minimum tokens needed.
3. In production, `FACILITATOR_URL` must be HTTPS, not HTTP.
4. Implement idempotency on the server: track seen `tx_hash` values (in-memory Map or Redis) and reject duplicate payment payloads to prevent double-billing.
5. Issue short-lived JWTs after payment verification for repeated access to the same resource within a session - reduces on-chain verification calls.
6. Never log private keys, never print them, never pass them as command-line arguments (visible in process list).
7. On mainnet: verify USDC contract address from https://docs.pharos.xyz before deploying. Never assume it matches the testnet address.

## Troubleshooting

| Symptom | Fix |
|---|---|
| 402 returned but payment not attempted | FACILITATOR_URL is unreachable from client; check network/firewall |
| "chain not supported" error | Confirm PHAROS_NETWORK env var matches the registered network in both client and server |
| "insufficient funds" | Wallet has no USDC; get testnet tokens at https://testnet.pharosnetwork.xyz or bridge mainnet USDC via CCTP |
| Transaction not settling | Pharos has sub-second finality; if pending >5s check RPC endpoint at https://atlantic.pharosscan.xyz (testnet) or https://pharosscan.xyz (mainnet) |
| Module not found @x402/* | Run `npm install` in the correct subdirectory; ensure package.json has the right deps |
| Wrong USDC decimals | USDC is always 6 decimals: 1 USDC = 1_000_000 raw units |
| Server returns 500 on /verify | Facilitator wallet has insufficient gas (PHRS on testnet, PROS on mainnet) |

## Live documentation query

Agents can query Pharos docs dynamically for any value not in this skill:
GET https://docs.pharos.xyz/developer-guide/x402.md?ask=<your question>
Example: `GET https://docs.pharos.xyz/developer-guide/x402.md?ask=What+is+the+USDC+contract+address+on+Pacific+Mainnet`
