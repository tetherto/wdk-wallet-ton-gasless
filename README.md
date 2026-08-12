# @tetherto/wdk-wallet-ton-gasless

[![npm version](https://img.shields.io/npm/v/%40tetherto%2Fwdk-wallet-ton-gasless?style=flat-square)](https://www.npmjs.com/package/@tetherto/wdk-wallet-ton-gasless)
[![npm downloads](https://img.shields.io/npm/dw/%40tetherto%2Fwdk-wallet-ton-gasless?style=flat-square)](https://www.npmjs.com/package/@tetherto/wdk-wallet-ton-gasless)
[![license](https://img.shields.io/npm/l/%40tetherto%2Fwdk-wallet-ton-gasless?style=flat-square)](https://github.com/tetherto/wdk-wallet-ton-gasless/blob/main/LICENSE)
[![docs](https://img.shields.io/badge/docs-docs.wdk.tether.io-0A66C2?style=flat-square)](https://docs.wdk.tether.io/sdk/wallet-modules/wallet-ton-gasless)

**Note**: This package is currently in beta. Please test thoroughly in development environments before using in production.

Manage TON wallets and relay Jetton transfers through TON API gasless paymaster flows. The package derives TON accounts from BIP-39 seed phrases, reads native TON and Jetton balances, and pays transfer fees with a configured paymaster Jetton instead of native TON.

## About WDK

This module is part of the [**WDK (Wallet Development Kit)**](https://docs.wdk.tether.io/) project, which empowers developers to build secure, non-custodial wallets with unified blockchain access, stateless architecture, and complete user control.

For detailed documentation about the complete WDK ecosystem, visit [docs.wdk.tether.io](https://docs.wdk.tether.io).

## Installation

```bash
npm install @tetherto/wdk-wallet-ton-gasless
```

## Quick Start

> **Existing wallets:** `getAccount(index)` changed its default derivation in `v1.0.0-beta.5`, from `m/44'/607'/0'/0/{index}` to `m/44'/607'/{index}'`. The same seed therefore produces different addresses after upgrading from `v1.0.0-beta.4` or earlier. Use `getAccountByPath()` with the old path to reopen a legacy account; see [Configuration](https://docs.wdk.tether.io/sdk/wallet-modules/wallet-ton-gasless/configuration) for migration details.

Provide a TON Center client for chain queries, a TON API client for gasless estimation and relay, and the Jetton master contract used to pay transfer fees. Add `secretKey` to either client configuration from secure runtime configuration when your provider requires one.

> Gasless operations support Jetton transfers through `transfer()` only. Native `sendTransaction()`, `quoteSendTransaction()`, and `signTransaction()` are not supported.
>
> The mnemonic below is public test data; never use it to hold funds. Keep seed phrases and API keys out of source control. Replace every `EQ...` placeholder with a valid address for the selected network. Before transferring, verify the token, recipient, and paymaster addresses; check the account's paymaster-token balance; and set `transferMaxFee`. Quoted and charged fees use the paymaster Jetton's base units.

```javascript
import WalletManagerTonGasless from '@tetherto/wdk-wallet-ton-gasless'

const seedPhrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

const wallet = new WalletManagerTonGasless(seedPhrase, {
  tonClient: {
    url: 'https://toncenter.com/api/v2/jsonRPC',
  },
  tonApiClient: {
    url: 'https://tonapi.io/v2',
  },
  paymasterToken: {
    address: 'EQ...', // Paymaster Jetton master contract address
  },
  transferMaxFee: 10_000_000n, // Paymaster Jetton base units
})

try {
  const account = await wallet.getAccount(0)
  const paymasterBalance = await account.getPaymasterTokenBalance()
  console.log('Paymaster token balance:', paymasterBalance)

  const transfer = {
    token: 'EQ...', // Jetton master contract address
    recipient: 'EQ...',
    amount: 1_000_000n, // Jetton base units
  }

  const quote = await account.quoteTransfer(transfer)
  console.log('Estimated fee:', quote.fee)

  const result = await account.transfer(transfer)
  console.log('Transaction hash:', result.hash)
} finally {
  wallet.dispose()
}
```

## Key Capabilities

- **BIP-44 Derivation Paths**: Derive TON accounts under `m/44'/607'`
- **Multi-Account Management**: Derive multiple accounts from one seed phrase
- **Gasless Jetton Transfers**: Estimate and relay Jetton transfers through TON API's gasless service
- **Paymaster Fee Controls**: Pay commissions in a configured Jetton and reject transfers above `transferMaxFee`
- **TON and Jetton Balances**: Query native TON, Jetton, and paymaster-token balances
- **Provider Failover**: Supply arrays of TON Center and TON API clients with configurable retries
- **Message Signing**: Sign messages and verify signatures with TON accounts
- **Read-Only Accounts**: Monitor TON wallets from public keys without private-key access
- **Secure Memory Disposal**: Clear private keys from memory when done

## Compatibility

- **TON Mainnet**
- **TON Testnet**
- **TON Center-compatible clients** for chain queries
- **TON API endpoints with gasless support** for fee estimation and transaction relay
- **Node.js and Bare runtimes**

## Documentation

| Topic | Description | Link |
|-------|-------------|------|
| Overview | Module overview and feature summary | [Wallet TON Gasless Overview](https://docs.wdk.tether.io/sdk/wallet-modules/wallet-ton-gasless) |
| Usage | End-to-end integration walkthrough | [Wallet TON Gasless Usage](https://docs.wdk.tether.io/sdk/wallet-modules/wallet-ton-gasless/usage) |
| Configuration | TON clients, paymaster token, failover, and fee limits | [Wallet TON Gasless Configuration](https://docs.wdk.tether.io/sdk/wallet-modules/wallet-ton-gasless/configuration) |
| API Reference | Complete class and type reference | [Wallet TON Gasless API Reference](https://docs.wdk.tether.io/sdk/wallet-modules/wallet-ton-gasless/api-reference) |

## Community

Join the [WDK Discord](https://discord.gg/arYXDhHB2w) to connect with other developers.

## Support

For support, please [open an issue](https://github.com/tetherto/wdk-wallet-ton-gasless/issues) on GitHub or reach out via [email](mailto:wallet-info@tether.io).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
