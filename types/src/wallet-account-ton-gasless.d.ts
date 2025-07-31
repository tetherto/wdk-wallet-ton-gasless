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
     * Verifies a message's signature.
     *
     * @param {string} message - The original message.
     * @param {string} signature - The signature to verify.
     * @returns {Promise<boolean>} True if the signature is valid.
     */
    verify(message: string, signature: string): Promise<boolean>;
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
     * Disposes the wallet account, erasing the private key from the memory.
     */
    dispose(): void;
    /** @private */
    private _sendGaslessTokenTransfer;
}
export type IWalletAccount = import("@wdk/wallet").IWalletAccount;
export type KeyPair = import("@wdk/wallet-ton").KeyPair;
export type TonTransaction = import("@wdk/wallet-ton").TonTransaction;
export type TransactionResult = import("@wdk/wallet-ton").TransactionResult;
export type TransferOptions = import("@wdk/wallet-ton").TransferOptions;
export type TransferResult = import("@wdk/wallet-ton").TransferResult;
export type TonGaslessWalletConfig = import("./wallet-account-read-only-ton-gasless.js").TonGaslessWalletConfig;
import WalletAccountReadOnlyTonGasless from './wallet-account-read-only-ton-gasless.js';
