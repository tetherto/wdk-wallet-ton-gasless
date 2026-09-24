export default class WalletManagerTonGasless extends WalletManager {
    /**
     * Creates a new wallet manager for the ton blockchain that implements gasless features.
     *
     * @param {string | Uint8Array} seed - A [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) mnemonic seed phrase, or a raw BIP-32 master seed (16-64 bytes).
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
     * The ton client. Shared with every account this manager creates, so two accounts never
     * open two clients for the same endpoint.
     *
     * @protected
     * @type {TonClient}
     */
    protected _tonClient: TonClient;
    /**
     * The ton api client. Shared with every account this manager creates.
     *
     * @protected
     * @type {TonApiClient}
     */
    protected _tonApiClient: TonApiClient;
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
     * Builds the account config, injecting the manager's shared clients so accounts reuse them
     * instead of opening their own.
     *
     * @private
     * @returns {TonGaslessWalletConfig} The account configuration.
     */
    private _accountConfig;
    /**
     * Returns the current fee rates.
     *
     * @returns {Promise<FeeRates>} The fee rates (in nanotons).
     */
    getFeeRates(): Promise<FeeRates>;
}
export type TonClient = import("@ton/ton").TonClient;
export type TonApiClient = import("@ton-api/client").TonApiClient;
export type FeeRates = import("@tetherto/wdk-wallet-ton").FeeRates;
export type TonGaslessWalletConfig = import("./wallet-account-ton-gasless.js").TonGaslessWalletConfig;
import WalletManager from '@tetherto/wdk-wallet';
import WalletAccountTonGasless from './wallet-account-ton-gasless.js';
