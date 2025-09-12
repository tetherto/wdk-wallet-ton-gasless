export default class WalletManagerTonGasless extends WalletManager {
    /**
     * Creates a new wallet manager for the ton blockchain that implements gasless features.
     *
     * @param {string | Uint8Array} seed - The wallet's [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) seed phrase.
     * @param {TonGaslessWalletConfig} config - The configuration object.
     */
    constructor(seed: string | Uint8Array, config: TonGaslessWalletConfig);
    /**
     * The ton gasless wallet configuration.
     *
     * @protected
     * @type {TonGaslessWalletConfig}
     */
    protected _config: TonGaslessWalletConfig;
    /**
     * Returns the wallet account at a specific index (see [BIP-44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)).
     *
     * @example
     * // Returns the account with derivation path m/44'/607'/0'/0/1
     * const account = await wallet.getAccount(1);
     * @param {number} [index] - The index of the account to get (default: 0).
     * @returns {Promise<WalletAccountTonGasless>} The account.
     */
    getAccount(index?: number): Promise<WalletAccountTonGasless>;
    /**
     * Returns the wallet account at a specific BIP-44 derivation path.
     *
     * @example
     * // Returns the account with derivation path m/44'/607'/0'/0/1
     * const account = await wallet.getAccountByPath("0'/0/1");
     * @param {string} path - The derivation path (e.g. "0'/0/0").
     * @returns {Promise<WalletAccountTonGasless>} The account.
     */
    getAccountByPath(path: string): Promise<WalletAccountTonGasless>;
    /**
     * Returns the current fee rates.
     *
     * @returns {Promise<FeeRates>} The fee rates (in nanotons).
     */
    getFeeRates(): Promise<FeeRates>;
}
export type FeeRates = import("@wdk/wallet-ton").FeeRates;
export type TonGaslessWalletConfig = import("./wallet-account-ton-gasless.js").TonGaslessWalletConfig;
import WalletManager from '@wdk/wallet';
import WalletAccountTonGasless from './wallet-account-ton-gasless.js';
