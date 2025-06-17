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
import WalletAccountTonGasless from './wallet-account-ton-gasless.js';
