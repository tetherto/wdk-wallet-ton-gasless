/**
 * @typedef {Object} TonGaslessWalletConfig
 * @property {string | TonClient} [tonCenterUrl] - The url of the ton center api, or a instance of the {@link TonClient} class.
 * @property {string} [tonCenterSecretKey] - The api-key to use to authenticate on the ton center api.
 * @property {string | TonClient} [tonCenterUrl] - The url of the ton center api, or a instance of the {@link TonClient} class.
 * @property {string} [tonCenterSecretKey] - The api-key to use to authenticate on the ton center api.
 * @property {Object} paymasterToken - The paymaster token configuration.
 * @property {string} paymasterToken.address - The address of the paymaster token.
 */
export default class WalletManagerTonGasless {
    constructor(seed: any, config: any);
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
}
export type TonGaslessWalletConfig = {
    /**
     * - The url of the ton center api, or a instance of the {@link TonClient} class.
     */
    tonCenterUrl?: string | TonClient;
    /**
     * - The api-key to use to authenticate on the ton center api.
     */
    tonCenterSecretKey?: string;
    /**
     * - The paymaster token configuration.
     */
    paymasterToken: {
        address: string;
    };
};
