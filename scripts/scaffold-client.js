#!/usr/bin/env node
"use strict";

const readline = require("readline");
const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

const ensureNewDirectory = (dir) => {
  if (fs.existsSync(dir)) {
    throw new Error(`${path.basename(dir)} already exists. Remove it or choose a clean directory before scaffolding.`);
  }
  fs.mkdirSync(dir, { recursive: true });
};

const writeFile = (dir, fileName, contents) => {
  fs.writeFileSync(path.join(dir, fileName), contents, "utf8");
};

const clientTs = `import { config } from "dotenv";
config();
import { wrapFetchWithPayment, x402Client, decodePaymentResponseHeader } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";
import fs from "fs";

type NetworkId = \`\${string}:\${string}\`;

const privateKey =
  process.env.EVM_PRIVATE_KEY ||
  (fs.existsSync(".private_key") ? fs.readFileSync(".private_key", "utf-8").trim() : null);
if (!privateKey) { console.error("Set EVM_PRIVATE_KEY or create .private_key file"); process.exit(1); }

const signer = privateKeyToAccount(privateKey as \`0x\${string}\`);
const network: NetworkId = (process.env.PHAROS_NETWORK || "eip155:688689") as NetworkId;
const client = new x402Client();
client.register(network, new ExactEvmScheme(signer));
const fetchWithPayment = wrapFetchWithPayment(fetch, client);
const url = process.argv[2] || process.env.TARGET_URL || "http://localhost:4021/data";

console.log(\`Requesting: \${url}\`);
console.log(\`Wallet: \${signer.address}\`);
console.log(\`Network: \${network}\`);

const main = async () => {
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
};

void main();
`;

const packageJson = `{
  "name": "pharos-x402-client-example",
  "version": "1.0.0",
  "scripts": { "start": "npx ts-node client.ts" },
  "dependencies": {
    "@x402/fetch": "latest",
    "@x402/evm": "latest",
    "viem": "latest",
    "dotenv": "^16"
  },
  "devDependencies": {
    "typescript": "^5",
    "ts-node": "^10",
    "@types/node": "^20"
  }
}
`;

const tsconfigJson = `{ "compilerOptions": { "target": "ES2022", "module": "CommonJS", "strict": true, "esModuleInterop": true } }
`;

const run = async () => {
  let failed = false;
  try {
    const networkInput = (await question("Network? [testnet/mainnet] (default: testnet): ")).trim().toLowerCase();
    const selectedNetwork = networkInput === "mainnet" ? "mainnet" : "testnet";
    const pharosNetwork = selectedNetwork === "mainnet" ? "eip155:1672" : "eip155:688689";
    const targetUrl = (await question("Target URL (default: http://localhost:4021/data): ")).trim() || "http://localhost:4021/data";
    console.warn("⚠️  Use a BURNER WALLET with only the USDC needed for this test. Never use your main wallet. Never share your private key with any service.");
    const privateKeyPath = (await question("Private key file path (leave blank to use EVM_PRIVATE_KEY env var): ")).trim();
    const targetDir = path.resolve(process.cwd(), "pharos-x402-client");

    ensureNewDirectory(targetDir);
    writeFile(targetDir, "client.ts", clientTs);
    writeFile(targetDir, ".env", privateKeyPath
      ? `EVM_PRIVATE_KEY=
TARGET_URL=${targetUrl}
PHAROS_NETWORK=${pharosNetwork}
# Private key file path provided: ${privateKeyPath}
# Set EVM_PRIVATE_KEY to your burner wallet private key before running.
`
      : `# Set EVM_PRIVATE_KEY to your burner wallet private key.
EVM_PRIVATE_KEY=
TARGET_URL=${targetUrl}
PHAROS_NETWORK=${pharosNetwork}
`);
    writeFile(targetDir, "package.json", packageJson);
    writeFile(targetDir, "tsconfig.json", tsconfigJson);

    console.log(`✅ Client scaffolded in ./pharos-x402-client/

Next steps:
  cd pharos-x402-client
  # Edit .env — set EVM_PRIVATE_KEY to your burner wallet private key
  npm install
  npx ts-node client.ts`);
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
