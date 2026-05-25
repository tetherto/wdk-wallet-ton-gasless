/** @implements {IWalletAccount} */
export default class WalletAccountTonGasless extends WalletAccountReadOnlyTonGasless implements IWalletAccount {
    /**
     * Creates a new ton gasless wallet account.
     *
     * @param {string | Uint8Array} seed - The wallet's [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) seed phrase.
     * @param {string} path - The BIP-44 derivation path (e.g. "0'/0/0").
     * @param {TonGaslessWalletConfig} config - The configuration object.
     */
    constructor(seed: string | Uint8Array, path: string, config: TonGaslessWalletConfig);
    /**
     * The ton gasless wallet account configuration.
     *
     * @protected
     * @type {TonGaslessWalletConfig}
     */
    protected _config: TonGaslessWalletConfig;
    /** @private */
    private _tonAccount;
    /**
     * The derivation path's index of this account.
     *
     * @type {number}
     */
    get index(): number;
    /**
     * The derivation path of this account (see [BIP-44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)).
     *
     * @type {string}
     */
    get path(): string;
    /**
     * The account's key pair.
     *
     * The uint8 arrays are bound to the wallet account, so any external change will reflect to the internal representation. For this reason,
     * it's strongly recommended to treat the key pair as a read-only view of the keys. While it's still technically possible to alter their
     * content, client code should never do so.
     *
     * @type {KeyPair}
     */
    get keyPair(): KeyPair;
    /**
     * Signs a message.
     *
     * @param {string} message - The message to sign.
     * @returns {Promise<string>} The message's signature.
     */
    sign(message: string): Promise<string>;
    /**
     * Signs a transaction.
     *
     * Not supported on ton gasless: this module only supports gasless token transfers via
     * the `transfer` method, which relays a signed internal message through the gasless provider.
     *
     * @param {TonTransaction} tx - The transaction.
     * @returns {Promise<never>} Never resolves; always throws.
     */
    signTransaction(tx: TonTransaction): Promise<never>;
    /**
     * Sends a transaction.
     *
     * @param {TonTransaction} tx -  The transaction.
     * @returns {Promise<TransactionResult>} The transaction's result.
     */
    sendTransaction(tx: TonTransaction): Promise<TransactionResult>;
    /**
     * Transfers a token to another address.
     *
     * @param {TransferOptions} options - The transfer's options.
     * @param {Pick<TonGaslessWalletConfig, 'paymasterToken' | 'transferMaxFee'>} [config] - If set, overrides the 'paymasterToken' and 'transferMaxFee' options defined in the wallet account configuration.
     * @returns {Promise<TransferResult>} The transfer's result.
     */
    transfer(options: TransferOptions, config?: Pick<TonGaslessWalletConfig, "paymasterToken" | "transferMaxFee">): Promise<TransferResult>;
    /**
     * Returns a read-only copy of the account.
     *
     * @returns {Promise<WalletAccountReadOnlyTonGasless>} The read-only account.
     */
    toReadOnlyAccount(): Promise<WalletAccountReadOnlyTonGasless>;
    /**
     * Disposes the wallet account, erasing the private key from the memory.
     */
    dispose(): void;
    /** @private */
    private _sendGaslessTokenTransfer;
}
export type IWalletAccount = import("@tetherto/wdk-wallet").IWalletAccount;
export type KeyPair = import("@tetherto/wdk-wallet-ton").KeyPair;
export type TonTransaction = import("@tetherto/wdk-wallet-ton").TonTransaction;
export type TransactionResult = import("@tetherto/wdk-wallet-ton").TransactionResult;
export type TransferOptions = import("@tetherto/wdk-wallet-ton").TransferOptions;
export type TransferResult = import("@tetherto/wdk-wallet-ton").TransferResult;
export type TonGaslessWalletConfig = import("./wallet-account-read-only-ton-gasless.js").TonGaslessWalletConfig;
import WalletAccountReadOnlyTonGasless from './wallet-account-read-only-ton-gasless.js';
