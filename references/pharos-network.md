---
title: Pharos Network Reference
updated: 2026-06
source: https://docs.pharos.xyz
query_api: "GET https://docs.pharos.xyz/{page}.md?ask={question}"
---

## What Pharos Is

Pharos Network is a full-stack parallel Layer 1 blockchain built for RealFi, or Real-World Asset Finance. It was created by former Ant Group executives and is designed for high-throughput, compliant, EVM-compatible financial applications. Its modular architecture includes L1-Base for data availability and hardware acceleration, L1-Core for high-throughput globally distributed nodes, and L1-Extension for SPNs, or Special Processing Networks, that support custom execution environments.

## Performance

Pharos has demonstrated 30,000 TPS, sub-second finality, and a 0.5-second block time on testnet. Its execution layer uses a hybrid parallel execution model combining DAG-based scheduling and Block-STM V1 to increase throughput while preserving deterministic transaction ordering and settlement semantics.

## Network Table

| Property | Atlantic Testnet | Pacific Ocean Mainnet |
|---|---|---|
| Chain ID | 688689 | 1672 |
| EIP ID | eip155:688689 | eip155:1672 |
| Native token | PHRS | PROS |
| RPC | https://atlantic.dplabs-internal.com | https://rpc.pharos.xyz |
| WSS | wss://atlantic.dplabs-internal.com | (see docs.pharos.xyz) |
| Explorer | https://atlantic.pharosscan.xyz | https://pharosscan.xyz |
| testnet flag | true | false |

## USDC

Circle partnership support for Pharos was announced in March 2026, with USDC and CCTP deployed to Pharos mainnet in April 2026. The Atlantic Testnet unofficial USDC test token is `0xE0BE08c77f415F577A1B3A9aD7a1Df1479564ec8`; it is not for production use. The Pacific Ocean Mainnet USDC address must be fetched from https://docs.pharos.xyz before deployment.

## Why Pharos For x402

Pharos is a strong x402 settlement environment because ultra-low fees make very small per-request payments practical, instant finality removes confirmation waits from HTTP request flows, and EVM compatibility allows existing x402, viem, and wallet tooling to work without a new execution stack. Pharos also supports a ZK-KYC/AML compliance module for institutional use cases, and x402 payment requirements can target any ERC-20 token, including USDC and other RealFi assets.

## Faucet And Onboarding

Use https://testnet.pharosnetwork.xyz to obtain testnet PHRS and test tokens for Atlantic Testnet development. Use only test funds and burner wallets during local x402 testing.

## Dynamic Docs Query

Use `GET https://docs.pharos.xyz/getting-started/network.md?ask=<question>` for the latest network values before production deployment.
