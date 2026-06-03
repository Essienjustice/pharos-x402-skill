#!/usr/bin/env node
"use strict";

const readline = require("readline");
const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const TESTNET_USDC = "0xE0BE08c77f415F577A1B3A9aD7a1Df1479564ec8";
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

const askWalletAddress = async () => {
  while (true) {
    const value = (await question("PAY_TO_ADDRESS (0x...): ")).trim();
    if (value.startsWith("0x") && value.length === 42) {
      return value;
    }
    console.error("Invalid address. Enter a 42-character 0x wallet address.");
  }
};

const ensureNewDirectory = (dir) => {
  if (fs.existsSync(dir)) {
    throw new Error(`${path.basename(dir)} already exists. Remove it or choose a clean directory before scaffolding.`);
  }
  fs.mkdirSync(dir, { recursive: true });
};

const writeFile = (dir, fileName, contents) => {
  fs.writeFileSync(path.join(dir, fileName), contents, "utf8");
};

const packageJson = `{
  "name": "pharos-x402-server-example",
  "version": "1.0.0",
  "scripts": { "start": "npx ts-node server.ts" },
  "dependencies": {
    "@x402/express": "latest",
    "@x402/evm": "latest",
    "@x402/core": "latest",
    "express": "^4",
    "dotenv": "^16"
  },
  "devDependencies": {
    "typescript": "^5",
    "ts-node": "^10",
    "@types/express": "^4",
    "@types/node": "^20"
  }
}
`;

const tsconfigJson = `{ "compilerOptions": { "target": "ES2022", "module": "CommonJS", "strict": true, "esModuleInterop": true } }
`;

const serverTemplate = (dataPrice, premiumPrice) => `import { config } from "dotenv";
config();
import express, { NextFunction, Request, Response } from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";

type NetworkId = \`\${string}:\${string}\`;
type PaymentSignaturePayload = {
  tx_hash?: string;
  transaction?: string;
  txHash?: string;
  hash?: string;
};

const payToAddress = process.env.PAY_TO_ADDRESS as \`0x\${string}\`;
if (!payToAddress) { console.error("PAY_TO_ADDRESS required"); process.exit(1); }
const facilitatorUrl = process.env.FACILITATOR_URL!;
const port = parseInt(process.env.PORT || "4021", 10);
const usdcAddress = process.env.USDC_ADDRESS!;
const usdcName = process.env.USDC_NAME || "USDC";
const network: NetworkId = (process.env.PHAROS_NETWORK || "eip155:688689") as NetworkId; // eip155:1672 for mainnet
const seenPayments = new Set<string>();

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

const extractTxHash = (headerValue: string): string | null => {
  const decoded = Buffer.from(headerValue, "base64").toString("utf8");
  const payload = JSON.parse(decoded) as PaymentSignaturePayload;
  return payload.tx_hash || payload.transaction || payload.txHash || payload.hash || null;
};

const rejectDuplicatePayment = (req: Request, res: Response, next: NextFunction) => {
  const paymentSignature = req.header("PAYMENT-SIGNATURE");
  if (!paymentSignature) {
    next();
    return;
  }

  try {
    const txHash = extractTxHash(paymentSignature);
    if (!txHash) {
      next();
      return;
    }

    if (seenPayments.has(txHash)) {
      res.status(409).json({ error: "duplicate payment" });
      return;
    }

    seenPayments.add(txHash);
    next();
  } catch {
    next();
  }
};

app.use(rejectDuplicatePayment);

app.use(paymentMiddleware(
  {
    "GET /data": { accepts: { scheme: "exact", price: "${dataPrice}", network, payTo: payToAddress }, description: "Paid data", mimeType: "application/json" },
    "GET /api/premium": { accepts: { scheme: "exact", price: "${premiumPrice}", network, payTo: payToAddress }, description: "Premium endpoint", mimeType: "application/json" },
  },
  resourceServer
));

app.get("/data", (_req, res) => res.json({ message: "Paid access granted", timestamp: Date.now() }));
app.get("/api/premium", (_req, res) => res.json({ message: "Premium content", timestamp: Date.now() }));
app.get("/health", (_req, res) => res.json({ status: "ok", chainId: network, payTo: payToAddress }));

app.listen(port, () => {
  console.log(\`Server on http://localhost:\${port}\`);
  console.log(\`Network: \${network}\`);
  console.log(\`Paying to: \${payToAddress}\`);
});
`;

const run = async () => {
  let failed = false;
  try {
    const networkInput = (await question("Network? [testnet/mainnet] (default: testnet): ")).trim().toLowerCase();
    const selectedNetwork = networkInput === "mainnet" ? "mainnet" : "testnet";
    const payToAddress = await askWalletAddress();
    const facilitatorUrl = (await question("FACILITATOR_URL (default: http://localhost:3000): ")).trim() || "http://localhost:3000";
    const port = (await question("PORT (default: 4021): ")).trim() || "4021";
    const usdcInput = (await question(`USDC_ADDRESS — press Enter to use testnet default (${TESTNET_USDC}): `)).trim();
    const dataPrice = (await question("Price for GET /data in USD (default: 0.01): ")).trim() || "0.01";
    const premiumPrice = (await question("Price for GET /api/premium in USD (default: 0.05): ")).trim() || "0.05";
    const pharosNetwork = selectedNetwork === "mainnet" ? "eip155:1672" : "eip155:688689";
    const usdcAddress = selectedNetwork === "mainnet" && !usdcInput ? "" : (usdcInput || TESTNET_USDC);

    if (selectedNetwork === "mainnet" && !usdcInput) {
      console.warn("⚠️  You must set the mainnet USDC address. Get it from: https://docs.pharos.xyz/developer-guide/x402.md?ask=USDC+contract+Pacific+Mainnet");
    }

    const targetDir = path.resolve(process.cwd(), "pharos-x402-server");
    ensureNewDirectory(targetDir);
    writeFile(targetDir, "server.ts", serverTemplate(dataPrice, premiumPrice));
    writeFile(targetDir, ".env", `PAY_TO_ADDRESS=${payToAddress}
FACILITATOR_URL=${facilitatorUrl}
PORT=${port}
USDC_ADDRESS=${usdcAddress}
USDC_NAME=USDC
PHAROS_NETWORK=${pharosNetwork}
`);
    writeFile(targetDir, "package.json", packageJson);
    writeFile(targetDir, "tsconfig.json", tsconfigJson);

    console.log(`✅ Server scaffolded in ./pharos-x402-server/

Next steps:
  cd pharos-x402-server
  npm install
  npm run start

Verify with:
  curl http://localhost:${port}/health`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    failed = true;
  } finally {
    rl.close();
  }

  if (failed) {
    process.exit(1);
  }
};

void childProcess;
void run();
