---
title: USDC on Pharos Reference
source: https://docs.pharos.xyz
---

## USDC Basics

USDC uses 6 decimal places. 1 USDC equals 1,000,000 raw units, or 1e6. In an x402 money parser, convert USD amounts to integer raw units with `Math.round(amountUSD * 1e6).toString()`; the result must be an integer string, not a float.

## Testnet Address

The Atlantic Testnet unofficial USDC test token address is `0xE0BE08c77f415F577A1B3A9aD7a1Df1479564ec8` on chain 688689. This is a test token deployed by the Pharos team for SDK testing only and is not for production use.

## Mainnet USDC

Mainnet USDC was deployed to Pharos through the Circle partnership in April 2026. The official Pacific Ocean Mainnet USDC address must be retrieved from Pharos docs before any production deployment. Query: `GET https://docs.pharos.xyz/developer-guide/x402.md?ask=What+is+the+USDC+contract+address+on+Pacific+Mainnet+chain+1672`

## CCTP

Circle Cross-Chain Transfer Protocol deployed to Pharos mainnet simultaneously with USDC. CCTP enables bridging USDC from 20+ chains to Pharos without wrapped tokens.

## Checking Balance

Use viem to read a USDC balance:

```typescript
await walletClient.readContract({
  address: USDC_ADDRESS,
  abi: [{ name: "balanceOf", type: "function", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] }],
  functionName: "balanceOf",
  args: [walletAddress],
})
```

## Getting Testnet USDC

Visit https://testnet.pharosnetwork.xyz and use the faucet to obtain testnet USDC and testnet PHRS for gas.

## Important

Never assume the testnet USDC address is the same as mainnet. Always verify before production deployment.
