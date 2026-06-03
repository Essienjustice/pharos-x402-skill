import { config } from "dotenv";
config();

import { decodePaymentResponseHeader, wrapFetchWithPayment, x402Client } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

const privateKey = process.env.EVM_PRIVATE_KEY as `0x${string}` | undefined;
const targetUrl = process.env.TARGET_URL || "http://localhost:4021/data";
const network = process.env.PHAROS_NETWORK || "eip155:688689";

if (!privateKey) {
  console.error("EVM_PRIVATE_KEY required");
  process.exit(1);
}

const evmPrivateKey = privateKey;

async function main() {
  const signer = privateKeyToAccount(evmPrivateKey);
  const client = new x402Client();
  registerExactEvmScheme(client, {
    signer,
    networks: [network as `${string}:${string}`],
  });

  const fetchWithPayment = wrapFetchWithPayment(globalThis.fetch, client);

  console.log(`Requesting: ${targetUrl}`);
  console.log(`Network: ${network}`);
  console.log(`Wallet: ${signer.address}`);

  const response = await fetchWithPayment(targetUrl);
  const rawBody = await response.text();

  console.log(`Status: ${response.status}`);
  console.log(`Body: ${rawBody}`);

  const paymentResponseHeader = response.headers.get("PAYMENT-RESPONSE");
  const lowercasePaymentResponseHeader = response.headers.get("payment-response");
  const receiptHeader = paymentResponseHeader || lowercasePaymentResponseHeader;

  if (receiptHeader) {
    console.log("PAYMENT-RESPONSE:", receiptHeader);
    try {
      console.log("Decoded payment receipt:", JSON.stringify(decodePaymentResponseHeader(receiptHeader), null, 2));
    } catch (error) {
      console.log("Could not decode PAYMENT-RESPONSE header:", error);
    }
  } else {
    console.log("No PAYMENT-RESPONSE header received.");
  }
}

main().catch((error) => {
  console.error("Client request failed:", error);
  process.exit(1);
});
