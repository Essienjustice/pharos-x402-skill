import { config } from "dotenv";
config();

import express from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { HTTPFacilitatorClient } from "@x402/core/server";
import type { RoutesConfig } from "@x402/core/server";
import type { Network } from "@x402/core/types";
import { ExactEvmScheme } from "@x402/evm/exact/server";

const payToAddress = process.env.PAY_TO_ADDRESS as `0x${string}` | undefined;
const facilitatorUrl = process.env.FACILITATOR_URL || "http://localhost:3000";
const port = Number.parseInt(process.env.PORT || "4021", 10);
const usdcAddress = process.env.USDC_ADDRESS as `0x${string}` | undefined;
const network = (process.env.PHAROS_NETWORK || "eip155:688689") as Network;

if (!payToAddress) {
  console.error("PAY_TO_ADDRESS required");
  process.exit(1);
}

if (!usdcAddress) {
  console.error("USDC_ADDRESS required");
  process.exit(1);
}

const facilitatorClient = new HTTPFacilitatorClient({ url: facilitatorUrl });
const resourceServer = new x402ResourceServer(facilitatorClient);
const evmScheme = new ExactEvmScheme();

evmScheme.registerMoneyParser(async (amount: number, requestedNetwork: Network) => {
  if (requestedNetwork !== network) {
    return null;
  }

  return {
    amount: Math.round(amount * 1_000_000).toString(),
    asset: usdcAddress,
    extra: { token: "USDC", name: "USDC", version: "2" },
  };
});

resourceServer.register(network, evmScheme);

const routes: RoutesConfig = {
  "GET /data": {
    accepts: {
      scheme: "exact",
      payTo: payToAddress,
      price: 0.001,
      network,
    },
    description: "Paid data endpoint",
    mimeType: "application/json",
  },
  "GET /api/premium": {
    accepts: {
      scheme: "exact",
      payTo: payToAddress,
      price: 0.005,
      network,
    },
    description: "Premium paid endpoint",
    mimeType: "application/json",
  },
};

const app = express();
app.use(paymentMiddleware(routes, resourceServer));

app.get("/data", (_req, res) => {
  res.json({
    message: "Paid access granted",
    endpoint: "/data",
    network,
    timestamp: Date.now(),
  });
});

app.get("/api/premium", (_req, res) => {
  res.json({
    message: "Premium content unlocked",
    endpoint: "/api/premium",
    network,
    timestamp: Date.now(),
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    network,
    facilitatorUrl,
    usdcAddress,
    payTo: payToAddress,
  });
});

app.listen(port, () => {
  console.log(`Server on http://localhost:${port}`);
  console.log(`Network: ${network}`);
  console.log(`USDC: ${usdcAddress}`);
  console.log(`Facilitator: ${facilitatorUrl}`);
  console.log(`Paying to: ${payToAddress}`);
});
