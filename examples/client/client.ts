import { config } from "dotenv";
config();
import { wrapFetchWithPayment, x402Client, decodePaymentResponseHeader } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";
import fs from "fs";

type NetworkId = `${string}:${string}`;

const privateKey =
  process.env.EVM_PRIVATE_KEY ||
  (fs.existsSync(".private_key") ? fs.readFileSync(".private_key", "utf-8").trim() : null);
if (!privateKey) { console.error("Set EVM_PRIVATE_KEY or create .private_key file"); process.exit(1); }

const signer = privateKeyToAccount(privateKey as `0x${string}`);
const network: NetworkId = (process.env.PHAROS_NETWORK || "eip155:688689") as NetworkId;
const client = new x402Client();
client.register(network, new ExactEvmScheme(signer));
const fetchWithPayment = wrapFetchWithPayment(fetch, client);
const url = process.argv[2] || process.env.TARGET_URL || "http://localhost:4021/data";

console.log(`Requesting: ${url}`);
console.log(`Wallet: ${signer.address}`);
console.log(`Network: ${network}`);

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
