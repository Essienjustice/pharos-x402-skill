import dotenv from "dotenv";
import express from "express";
import { privateKeyToAccount } from "viem/accounts";
import { createWalletClient, defineChain, http, publicActions } from "viem";
import { x402Facilitator } from "@x402/core/facilitator";
import { toFacilitatorEvmSigner } from "@x402/evm";
import { ExactEvmScheme } from "@x402/evm/exact/facilitator";
dotenv.config();

if (!process.env.EVM_PRIVATE_KEY) { console.error("EVM_PRIVATE_KEY required"); process.exit(1); }

type NetworkId = `${string}:${string}`;

const configuredNetwork = process.env.PHAROS_NETWORK || "eip155:688689";
const isMainnet = configuredNetwork === "eip155:1672";
const pharos = isMainnet
  ? defineChain({
      id: 1672,
      name: "Pharos Pacific Ocean Mainnet",
      nativeCurrency: { name: "PROS", symbol: "PROS", decimals: 18 },
      rpcUrls: { default: { http: ["https://rpc.pharos.xyz"] } },
      blockExplorers: { default: { name: "PharosScan", url: "https://pharosscan.xyz" } },
      testnet: false,
    })
  : defineChain({
      id: 688_689,
      name: "Pharos Atlantic Testnet",
      nativeCurrency: { name: "PHRS", symbol: "PHRS", decimals: 18 },
      rpcUrls: { default: { http: ["https://atlantic.dplabs-internal.com"] } },
      blockExplorers: { default: { name: "PharosScan", url: "https://atlantic.pharosscan.xyz" } },
      testnet: true,
    });
const NETWORK_ID: NetworkId = isMainnet ? "eip155:1672" : "eip155:688689";

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
