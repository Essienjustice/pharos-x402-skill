---
title: x402 Protocol Reference
source: https://x402.org | https://docs.pharos.xyz/developer-guide/x402.md
---

## What x402 Is

x402 reactivates the HTTP 402 "Payment Required" status code for crypto micro-payments. It is chain-agnostic: the `network` field in the `accepts` object selects the settlement chain. HTTP 402 was originally reserved in HTTP/1.1 and is now used by x402 for trustless pay-per-request APIs.

## Four-Step Flow

Step 1: The client sends `GET /resource`. The server returns HTTP 402 with a `PAYMENT-REQUIRED` header containing a base64-encoded PaymentRequired object with `scheme`, `network`, `payTo`, `price`, and `asset`.

Step 2: The client parses PaymentRequired, constructs a PaymentPayload, signs with EIP-3009 `transferWithAuthorization`, attaches the signed payload as the `PAYMENT-SIGNATURE` header, and re-sends the request.

Step 3: The server forwards the payment payload and requirements to the facilitator at `POST /verify`. The facilitator verifies the signature off-chain and returns a VerificationResponse.

Step 4: If verified, the server calls the facilitator at `POST /settle`. The facilitator broadcasts the transaction on-chain and returns `{tx_hash}`. The server sends HTTP 200 with the protected resource and a `PAYMENT-RESPONSE` header containing a base64-encoded settlement response with `tx_hash`, `network`, and `payer`.

## Facilitator Endpoints

Facilitators expose `POST /verify` for off-chain payment validation, `POST /settle` for on-chain settlement, and `GET /supported` for discovering supported schemes and networks.

## ExactEvmScheme

ExactEvmScheme uses EIP-3009 `transferWithAuthorization`: the payer signs an off-chain authorization, and the facilitator performs on-chain settlement. The user does not need to initiate a wallet transaction directly for each paid request.

## Network Field Format

The `network` field uses CAIP-2 EIP-155 format: `eip155:{chainId}`. Examples include `eip155:1672` for Pharos Pacific Ocean Mainnet, `eip155:688689` for Pharos Atlantic Testnet, and `eip155:8453` for Base.

## Dynamic Docs Query

Use `GET https://docs.pharos.xyz/developer-guide/x402.md?ask=<question>` for current Pharos x402 details.
