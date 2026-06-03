import { config } from "dotenv";
config();
import express, { NextFunction, Request, Response } from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";

type NetworkId = `${string}:${string}`;
type PaymentSignaturePayload = {
  tx_hash?: string;
  transaction?: string;
  txHash?: string;
  hash?: string;
};

const payToAddress = process.env.PAY_TO_ADDRESS as `0x${string}`;
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
