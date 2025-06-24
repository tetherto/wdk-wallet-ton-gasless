/** @typedef {import('./wallet-account-ton-gasless.js').TonGaslessWalletConfig} TonGaslessWalletConfig */
export default class WalletManagerTonGasless {
    /**
     * Creates a new gasless wallet manager for the ton blockchain.
     *
     * @param {string | Uint8Array} seed - The wallet's [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) seed phrase.
     * @param {TonGaslessWalletConfig} [config] - The configuration object.
     */
    constructor(seed: string | Uint8Array, config?: TonGaslessWalletConfig);
    /**
     * The ton gasless wallet configuration.
     *
     * @protected
     * @type {TonGaslessWalletConfig}
     */
    protected _config: TonGaslessWalletConfig;
    /**
     * Returns the gasless wallet account at a specific index (see [BIP-44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)).
     *
     * @example
     * // Returns the account with derivation path m/44'/607'/0'/0/1
     * const account = await wallet.getAccount(1);
     * @param {number} [index] - The index of the account to get (default: 0).
     * @returns {Promise<WalletAccountTonGasless>} The gasless account.
     */
    getAccount(index?: number): Promise<WalletAccountTonGasless>;
    /**
     * Returns the gasless wallet account at a specific BIP-44 derivation path.
     *
     * @example
     * // Returns the account with derivation path m/44'/607'/0'/0/1
     * const account = await wallet.getAccountByPath("0'/0/1");
     * @param {string} path - The derivation path (e.g. "0'/0/0").
     * @returns {Promise<WalletAccountTonGasless>} The gasless account.
     */
    getAccountByPath(path: string): Promise<WalletAccountTonGasless>;
}
export type TonGaslessWalletConfig = import("./wallet-account-ton-gasless.js").TonGaslessWalletConfig;
import WalletAccountTonGasless from './wallet-account-ton-gasless.js';
