# @tetherto/wdk-wallet-ton-gasless

**Note**: This package is currently in beta. Please test thoroughly in development environments before using in production.

A simple and secure package to manage gasless transactions on the TON blockchain. This package provides a clean API for creating, managing, and interacting with TON wallets using BIP-39 seed phrases and TON-specific derivation paths, with support for gasless transactions through a paymaster system.

## 🔍 About WDK

This module is part of the [**WDK (Wallet Development Kit)**](https://wallet.tether.io/) project, which empowers developers to build secure, non-custodial wallets with unified blockchain access, stateless architecture, and complete user control. 

For detailed documentation about the complete WDK ecosystem, visit [docs.wallet.tether.io](https://docs.wallet.tether.io).

## 🌟 Features

- **TON Derivation Paths**: Support for BIP-44 standard derivation paths for TON (m/44'/607')
- **Multi-Account Management**: Create and manage multiple accounts from a single seed phrase
- **Gasless Transactions**: Execute transactions without requiring TON for gas fees
- **Paymaster Integration**: Built-in support for paymaster-based fee delegation
- **Jetton Support**: Query native TON and Jetton token balances using smart contract interactions
- **Message Signing**: Sign and verify messages using TON cryptography

## ⬇️ Installation

To install the `@tetherto/wdk-wallet-ton-gasless` package, follow these instructions:

You can install it using npm:

```bash
npm install @tetherto/wdk-wallet-ton-gasless
```

## 🚀 Quick Start

### Importing from `@tetherto/wdk-wallet-ton-gasless`

### Creating a New Wallet

```javascript
import WalletManagerTonGasless, { 
  WalletAccountTonGasless, 
  WalletAccountReadOnlyTonGasless 
} from '@tetherto/wdk-wallet-ton-gasless'

// Use a BIP-39 seed phrase (replace with your own secure phrase)
const seedPhrase = 'test only example nut use this real life secret phrase must random'

// Create wallet manager with TON client config
const wallet = new WalletManagerTonGasless(seedPhrase, {
  tonClient: {
    url: 'https://toncenter.com/api/v3',
    secretKey: 'your-api-key' // Optional
  },
  tonApiClient: {
    url: 'https://tonapi.io/v3',
    secretKey: 'your-ton-api-key' // Optional
  },
  paymasterToken: {
    address: 'EQ...' // Paymaster token contract address
  },
  transferMaxFee: 1000000000n // Optional: Maximum fee in nanotons
})

// Get a full access account
const account = await wallet.getAccount(0)

// Convert to a read-only account
const readOnlyAccount = await account.toReadOnlyAccount()
```

### Managing Multiple Accounts

```javascript
import WalletManagerTonGasless from '@tetherto/wdk-wallet-ton-gasless'

// Assume wallet is already created
// Get the first account (index 0)
const account = await wallet.getAccount(0)
const address = await account.getAddress()
console.log('Account 0 address:', address)

// Get the second account (index 1)
const account1 = await wallet.getAccount(1)
const address1 = await account1.getAddress()
console.log('Account 1 address:', address1)

// Get account by custom derivation path
// Full path will be m/44'/607'/0'/0/5
const customAccount = await wallet.getAccountByPath("0'/0/5")
const customAddress = await customAccount.getAddress()
console.log('Custom account address:', customAddress)

// Note: All addresses are TON addresses (EQ... or UQ...)
// All accounts inherit the provider configuration from the wallet manager
```

### Checking Balances

#### Owned Account

For accounts where you have the seed phrase and full access:

```javascript
import WalletManagerTonGasless from '@tetherto/wdk-wallet-ton-gasless'

// Assume wallet and account are already created
// Get native TON balance (in nanotons)
const balance = await account.getBalance()
console.log('Native TON balance:', balance, 'nanotons') // 1 TON = 1000000000 nanotons

// Get Jetton token balance
const jettonContract = 'EQ...'; // Jetton contract address
const jettonBalance = await account.getTokenBalance(jettonContract);
console.log('Jetton balance:', jettonBalance);

// Get paymaster token balance (important for gasless operations)
const paymasterBalance = await account.getPaymasterTokenBalance();
console.log('Paymaster token balance:', paymasterBalance);

// Note: TON client is required for balance checks
// Make sure wallet was created with a tonClient configuration
```

#### Read-Only Account

For addresses where you don't have the seed phrase:

```javascript
import { WalletAccountReadOnlyTonGasless } from '@tetherto/wdk-wallet-ton-gasless'

// Create a read-only account with public key
const publicKey = '...'; // Replace with the actual public key

const readOnlyAccount = new WalletAccountReadOnlyTonGasless(publicKey, {
  tonClient: {
    url: 'https://toncenter.com/api/v3',
    secretKey: 'your-api-key' // Optional
  },
  tonApiClient: {
    url: 'https://tonapi.io/v3',
    secretKey: 'your-ton-api-key' // Optional
  },
  paymasterToken: {
    address: 'EQ...' // Paymaster token contract address
  }
})

// Check native TON balance
const balance = await readOnlyAccount.getBalance()
console.log('Native balance:', balance, 'nanotons')

// Check paymaster token balance
const paymasterBalance = await readOnlyAccount.getPaymasterTokenBalance()
console.log('Paymaster token balance:', paymasterBalance)

// Check any other Jetton token balance
const tokenBalance = await readOnlyAccount.getTokenBalance('EQ...')
console.log('Token balance:', tokenBalance)

// Note: Jetton balance checks use the standard Jetton wallet interface
// Make sure the contract address is correct and implements the Jetton standard
```

### Sending Transactions

⚠️ **Important Note**: Direct transaction sending using `sendTransaction()` is not supported in `WalletAccountTonGasless`. This is a gasless implementation that handles transactions through a gasless provider instead of direct blockchain transactions.

For sending tokens, please use the `transfer()` method instead.

### Token Transfers (Gasless)

Transfer Jetton tokens and estimate fees using `WalletAccountTonGasless`. Uses paymaster for gasless operations.

```javascript
// Transfer Jetton tokens using gasless transactions
const transferResult = await account.transfer({
  token: 'EQ...',      // Jetton contract address
  recipient: 'EQ...',  // Recipient's TON address
  amount: 1000000000n      // Amount in Jetton's base units (use BigInt for large numbers)
}, {
  paymasterToken: {    // Optional: override default paymaster token
    address: 'EQ...'
  },
  transferMaxFee: 1000000000n // Optional: maximum allowed fee
});
console.log('Transfer hash:', transferResult.hash);
console.log('Transfer fee:', transferResult.fee, 'nanotons');

// Quote token transfer fee
const transferQuote = await account.quoteTransfer({
  token: 'EQ...',      // Jetton contract address
  recipient: 'EQ...',  // Recipient's TON address
  amount: 1000000000n      // Amount in Jetton's base units
})
console.log('Transfer fee estimate:', transferQuote.fee, 'nanotons')

// Note: Gas fees are paid by the paymaster token
// Ensure sufficient paymaster token balance before transfers
```

### Message Signing and Verification

Sign and verify messages using `WalletAccountTonGasless`.

```javascript
// Sign a message
const message = 'Hello, TON!'
const signature = await account.sign(message)
console.log('Signature:', signature)

// Verify a signature
const isValid = await account.verify(message, signature)
console.log('Signature valid:', isValid)
```

### Fee Management

Retrieve current fee rates using `WalletManagerTonGasless`.

```javascript
// Get current fee rates
const feeRates = await wallet.getFeeRates();
console.log('Normal fee rate:', feeRates.normal, 'nanotons');
console.log('Fast fee rate:', feeRates.fast, 'nanotons');
```

### Memory Management

Clear sensitive data from memory using `dispose` methods in `WalletAccountTonGasless` and `WalletManagerTonGasless`.

```javascript
// Dispose wallet accounts to clear private keys from memory
account.dispose()

// Dispose entire wallet manager
wallet.dispose()
```

## 📚 API Reference

### Table of Contents

| Class | Description | Methods |
|-------|-------------|---------|
| [WalletManagerTonGasless](#walletmanagertongasless) | Main class for managing TON wallets with gasless features. Extends `WalletManager` from `@tetherto/wdk-wallet`. | [Constructor](#constructor), [Methods](#methods) |
| [WalletAccountTonGasless](#walletaccounttongasless) | Individual TON wallet account with gasless features. Extends `WalletAccountReadOnlyTonGasless` and implements `IWalletAccount` from `@tetherto/wdk-wallet`. | [Constructor](#constructor-1), [Methods](#methods-1), [Properties](#properties) |
| [WalletAccountReadOnlyTonGasless](#walletaccountreadonlytongasless) | Read-only TON wallet account with gasless features. Extends `WalletAccountReadOnly` from `@tetherto/wdk-wallet`. | [Constructor](#constructor-2), [Methods](#methods-2) |

### WalletManagerTonGasless

The main class for managing TON wallets with gasless features.  
Extends `WalletManager` from `@tetherto/wdk-wallet`.

#### Constructor

```javascript
new WalletManagerTonGasless(seed, config)
```

**Parameters:**
- `seed` (string | Uint8Array): BIP-39 mnemonic seed phrase or seed bytes
- `config` (object, optional): Configuration object
  - `tonClient` (object | TonClient): TON client configuration or instance
    - `url` (string): TON Center API URL (e.g., 'https://toncenter.com/api/v3')
    - `secretKey` (string, optional): API key for TON Center
  - `tonApiClient` (object | TonApiClient): TON API client configuration or instance
    - `url` (string): TON API URL (e.g., 'https://tonapi.io/v3')
    - `secretKey` (string, optional): API key for TON API
  - `paymasterToken` (object): Paymaster token configuration
    - `address` (string): The address of the paymaster token
  - `transferMaxFee` (number | bigint, optional): Maximum fee amount for transfer operations (in nanotons)

**Example:**
```javascript
const wallet = new WalletManagerTonGasless(seedPhrase, {
  tonClient: {
    url: 'https://toncenter.com/api/v3',
    secretKey: 'your-api-key'
  },
  tonApiClient: {
    url: 'https://tonapi.io/v3',
    secretKey: 'your-ton-api-key'
  },
  paymasterToken: {
    address: 'EQ...'
  },
  transferMaxFee: '1000000000' // Maximum fee in nanotons
})
```

#### Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `getAccount(index)` | Returns a wallet account at the specified index | `Promise<WalletAccountTonGasless>` |
| `getAccountByPath(path)` | Returns a wallet account at the specified BIP-44 derivation path | `Promise<WalletAccountTonGasless>` |
| `getFeeRates()` | Returns current fee rates for transactions | `Promise<{normal: bigint, fast: bigint}>` |
| `dispose()` | Disposes all wallet accounts, clearing private keys from memory | `void` |

##### `getAccount(index)`
Returns a gasless TON wallet account at the specified index using BIP-44 derivation path m/44'/607'.

**Parameters:**
- `index` (number, optional): The index of the account to get (default: 0)

**Returns:** `Promise<WalletAccountTonGasless>` - The gasless TON wallet account

**Example:**
```javascript
const account = await wallet.getAccount(0)
const address = await account.getAddress()
console.log('Gasless TON account address:', address)
```

##### `getAccountByPath(path)`
Returns a gasless TON wallet account at the specified BIP-44 derivation path.

**Parameters:**
- `path` (string): The derivation path (e.g., "0'/0/0", "1'/0/5")

**Returns:** `Promise<WalletAccountTonGasless>` - The gasless TON wallet account

**Example:**
```javascript
const account = await wallet.getAccountByPath("0'/0/1")
const address = await account.getAddress()
console.log('Custom path gasless address:', address)
```

##### `getFeeRates()`
Returns current fee rates for TON transactions (used by paymaster for gasless operations).

**Returns:** `Promise<{normal: bigint, fast: bigint}>` - Object containing fee rates in nanotons
- `normal`: Standard fee rate for normal confirmation speed
- `fast`: Higher fee rate for faster confirmation

**Example:**
```javascript
const feeRates = await wallet.getFeeRates()
console.log('Normal fee rate:', feeRates.normal, 'nanotons')
console.log('Fast fee rate:', feeRates.fast, 'nanotons')

// Note: These fees are typically covered by the paymaster in gasless transactions
```

##### `dispose()`
Disposes all gasless TON wallet accounts and clears sensitive data from memory.

**Returns:** `void`

**Example:**
```javascript
wallet.dispose()
// All gasless accounts and private keys are now securely wiped from memory
```

### WalletAccountTonGasless

Represents an individual wallet account with gasless features. Implements `IWalletAccount` from `@tetherto/wdk-wallet`.

#### Constructor

```javascript
new WalletAccountTonGasless(seed, path, config)
```

**Parameters:**
- `seed` (string | Uint8Array): BIP-39 mnemonic seed phrase or seed bytes
- `path` (string): BIP-44 derivation path (e.g., "0'/0/0")
- `config` (object, optional): Configuration object
  - `tonClient` (object | TonClient): TON client configuration or instance
    - `url` (string): TON Center API URL
    - `secretKey` (string, optional): API key for TON Center
  - `tonApiClient` (object | TonApiClient): TON API client configuration or instance
    - `url` (string): TON API URL
    - `secretKey` (string, optional): API key for TON API
  - `paymasterToken` (object): Paymaster token configuration
    - `address` (string): The address of the paymaster token
  - `transferMaxFee` (number | bigint, optional): Maximum fee amount for transfer operations (in nanotons)

#### Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `getAddress()` | Returns the account's TON address | `Promise<string>` |
| `sign(message)` | Signs a message using the account's private key | `Promise<string>` |
| `verify(message, signature)` | Verifies a message signature | `Promise<boolean>` |
| `transfer(options, config?)` | Transfers tokens using gasless transactions | `Promise<{hash: string, fee: bigint}>` |
| `quoteTransfer(options, config?)` | Estimates the fee for a token transfer | `Promise<{fee: bigint}>` |
| `getBalance()` | Returns the native TON balance (in nanotons) | `Promise<bigint>` |
| `getTokenBalance(tokenAddress)` | Returns the balance of a specific token | `Promise<bigint>` |
| `getPaymasterTokenBalance()` | Returns the balance of the paymaster token | `Promise<bigint>` |
| `dispose()` | Disposes the wallet account, clearing private keys from memory | `void` |

##### `getAddress()`
Returns the account's TON address.

**Returns:** `Promise<string>` - The TON address

**Example:**
```javascript
const address = await account.getAddress()
console.log('Gasless TON address:', address) // EQBvW8Z5...
```

##### `sign(message)`
Signs a message using the account's private key.

**Parameters:**
- `message` (string): Message to sign

**Returns:** `Promise<string>` - Signature as hex string

**Example:**
```javascript
const signature = await account.sign('Hello TON Gasless!')
console.log('Signature:', signature)
```

##### `verify(message, signature)`
Verifies a message signature using the account's public key.

**Parameters:**
- `message` (string): Original message
- `signature` (string): Signature as hex string

**Returns:** `Promise<boolean>` - True if signature is valid

**Example:**
```javascript
const isValid = await account.verify('Hello TON Gasless!', signature)
console.log('Signature valid:', isValid)
```

##### `transfer(options, config?)`
Transfers tokens using gasless transactions where the paymaster covers transaction fees.

**Parameters:**
- `options` (object): Transfer options
  - `token` (string): Token contract address (e.g., 'EQ...')
  - `recipient` (string): Recipient TON address (e.g., 'EQ...')
  - `amount` (number | bigint): Amount in token's base units
- `config` (object, optional): Override configuration
  - `paymasterToken` (object, optional): Override default paymaster token
    - `address` (string): Paymaster token address
  - `transferMaxFee` (number | bigint, optional): Override maximum fee

**Returns:** `Promise<{hash: string, fee: bigint}>` - Object containing hash and fee (typically 0 or covered by paymaster)

**Example:**
```javascript
const result = await account.transfer({
  token: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', // USDT Jetton
  recipient: 'EQBvW8Z5huBkMJYdnfAEM5JqTNkuWX3diqYENkWsIL0XggGG',
  amount: 1000000n // 1 USDT (6 decimals)
})
console.log('Gasless transfer hash:', result.hash)
console.log('Fee (covered by paymaster):', result.fee, 'nanotons')
```

##### `quoteTransfer(options, config?)`
Estimates the fee for a token transfer (typically covered by paymaster in gasless operations).

**Parameters:**
- `options` (object): Same as transfer parameters
  - `token` (string): Token contract address
  - `recipient` (string): Recipient TON address
  - `amount` (number | bigint): Amount in token's base units
- `config` (object, optional): Same as transfer configuration
  - `paymasterToken` (object, optional): Override default paymaster token
  - `transferMaxFee` (number | bigint, optional): Override maximum fee

**Returns:** `Promise<{fee: bigint}>` - Object containing estimated fee (typically 0 or covered by paymaster)

**Example:**
```javascript
const quote = await account.quoteTransfer({
  token: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', // USDT Jetton
  recipient: 'EQBvW8Z5huBkMJYdnfAEM5JqTNkuWX3diqYENkWsIL0XggGG',
  amount: 1000000n // 1 USDT (6 decimals)
})
console.log('Estimated fee (paymaster will cover):', quote.fee, 'nanotons')
```

##### `getBalance()`
Returns the account's native TON balance in nanotons.

**Returns:** `Promise<bigint>` - Balance in nanotons

**Example:**
```javascript
const balance = await account.getBalance()
console.log('TON balance:', balance, 'nanotons')
console.log('Balance in TON:', Number(balance) / 1e9)
```

##### `getTokenBalance(tokenAddress)`
Returns the balance of a specific token (Jetton).

**Parameters:**
- `tokenAddress` (string): The token contract address

**Returns:** `Promise<bigint>` - Token balance in token's smallest unit

**Example:**
```javascript
// Get USDT Jetton balance (6 decimals)
const usdtBalance = await account.getTokenBalance('EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs')
console.log('USDT balance:', Number(usdtBalance) / 1e6)
```

##### `getPaymasterTokenBalance()`
Returns the balance of the paymaster token used for gasless operations.

**Returns:** `Promise<bigint>` - Paymaster token balance in token's smallest unit

**Example:**
```javascript
const paymasterBalance = await account.getPaymasterTokenBalance()
console.log('Paymaster token balance:', paymasterBalance)
// This balance is used to cover transaction fees in gasless operations
```

##### `dispose()`
Disposes the wallet account, securely erasing the private key from memory.

**Returns:** `void`

**Example:**
```javascript
account.dispose()
// Private key is now securely wiped from memory
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `index` | `number` | The derivation path's index of this account |
| `path` | `string` | The full derivation path of this account |
| `keyPair` | `object` | The account's key pair (⚠️ Contains sensitive data) |

⚠️ **Security Note**: The `keyPair` property contains sensitive cryptographic material. Never log, display, or expose the private key.

### WalletAccountReadOnlyTonGasless

Represents a read-only wallet account with gasless features.

#### Constructor

```javascript
new WalletAccountReadOnlyTonGasless(publicKey, config)
```

**Parameters:**
- `publicKey` (string | Uint8Array): The account's public key
- `config` (object, optional): Configuration object
  - `tonClient` (object | TonClient): TON client configuration or instance
    - `url` (string): TON Center API URL
    - `secretKey` (string, optional): API key for TON Center
  - `tonApiClient` (object | TonApiClient): TON API client configuration or instance
    - `url` (string): TON API URL
    - `secretKey` (string, optional): API key for TON API
  - `paymasterToken` (object): Paymaster token configuration
    - `address` (string): The address of the paymaster token

#### Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `getBalance()` | Returns the native TON balance (in nanotons) | `Promise<bigint>` |
| `getTokenBalance(tokenAddress)` | Returns the balance of a specific token | `Promise<bigint>` |
| `getPaymasterTokenBalance()` | Returns the balance of the paymaster token | `Promise<bigint>` |
| `quoteTransfer(options, config?)` | Estimates the fee for a token transfer | `Promise<{fee: bigint}>` |

##### `getBalance()`
Returns the account's native TON balance in nanotons.

**Returns:** `Promise<bigint>` - Balance in nanotons

**Example:**
```javascript
const balance = await readOnlyAccount.getBalance()
console.log('TON balance:', balance, 'nanotons')
console.log('Balance in TON:', Number(balance) / 1e9)
```

##### `getTokenBalance(tokenAddress)`
Returns the balance of a specific token (Jetton).

**Parameters:**
- `tokenAddress` (string): The token contract address

**Returns:** `Promise<bigint>` - Token balance in token's smallest unit

**Example:**
```javascript
// Get USDT Jetton balance (6 decimals)
const usdtBalance = await readOnlyAccount.getTokenBalance('EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs')
console.log('USDT balance:', Number(usdtBalance) / 1e6)
```

##### `getPaymasterTokenBalance()`
Returns the balance of the paymaster token used for gasless operations.

**Returns:** `Promise<bigint>` - Paymaster token balance in token's smallest unit

**Example:**
```javascript
const paymasterBalance = await readOnlyAccount.getPaymasterTokenBalance()
console.log('Paymaster token balance:', paymasterBalance)
// This balance indicates how much the account can use for gasless transactions
```

##### `quoteTransfer(options, config?)`
Estimates the fee for a token transfer (typically covered by paymaster in gasless operations).

**Parameters:**
- `options` (object): Transfer options
  - `token` (string): Token contract address
  - `recipient` (string): Recipient TON address
  - `amount` (number | bigint): Amount in token's base units
- `config` (object, optional): Override configuration
  - `paymasterToken` (object, optional): Override default paymaster token
    - `address` (string): Paymaster token address
  - `transferMaxFee` (number | bigint, optional): Override maximum fee

**Returns:** `Promise<{fee: bigint}>` - Object containing estimated fee (typically 0 or covered by paymaster)

**Example:**
```javascript
const quote = await readOnlyAccount.quoteTransfer({
  token: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', // USDT Jetton
  recipient: 'EQBvW8Z5huBkMJYdnfAEM5JqTNkuWX3diqYENkWsIL0XggGG',
  amount: 1000000n // 1 USDT (6 decimals)
})
console.log('Estimated fee (paymaster will cover):', quote.fee, 'nanotons')
console.log('Estimated fee in TON:', Number(quote.fee) / 1e9)
```

## 🌐 Supported Networks

This package works with the TON blockchain, including:

- **TON Mainnet**
- **TON Testnet**

## 🔒 Security Considerations

- **Seed Phrase Security**: Always store your seed phrase securely and never share it
- **Private Key Management**: The package handles private keys internally with memory safety features using sodium-universal
- **Provider Security**: Use trusted TON Center and TON API endpoints
- **Transaction Validation**: Always validate transaction details before signing
- **Memory Cleanup**: Use the `dispose()` method to clear private keys from memory when done
- **Fee Limits**: Set `transferMaxFee` in config to prevent excessive transaction fees
- **Address Validation**: Be careful with bounceable vs non-bounceable addresses
- **Paymaster Token**: Ensure sufficient paymaster token balance for gasless operations
- **API Keys**: Securely manage both TON Center and TON API keys
- **Gasless Provider**: Validate gasless provider configuration and token allowances

## 🛠️ Development

### Building

```bash
# Install dependencies
npm install

# Build TypeScript definitions
npm run build:types

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📜 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🆘 Support

For support, please open an issue on the GitHub repository.

---