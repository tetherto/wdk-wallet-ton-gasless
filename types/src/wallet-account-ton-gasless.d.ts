export default class WalletAccountTonGasless extends WalletAccountTon {
    /**
     * Creates a new ton gasless wallet account.
     *
     * @param {string | Uint8Array} seed - The wallet's [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) seed phrase.
     * @param {string} path - The BIP-44 derivation path (e.g. "0'/0/0").
     * @param {TonGaslessWalletConfig} config - The configuration object.
     */
    constructor(seed: string | Uint8Array, path: string, config: TonGaslessWalletConfig);
    /**
     * The ton api client.
     *
     * @protected
     * @type {TonApiClient | undefined}
     */
    protected _tonApiClient: TonApiClient | undefined;
    /**
     * Returns the account's balance for the paymaster token defined in the wallet account configuration.
     *
     * @returns {Promise<number>} The paymaster token balance (in base unit).
     */
    getPaymasterTokenBalance(): Promise<number>;
    /**
     * Transfers a token to another address.
     *
     * @param {TransferOptions} options - The transfer's options.
     * @param {Pick<TonGaslessWalletConfig, 'paymasterToken' | 'transferMaxFee'>} [config] - If set, overrides the 'paymasterToken' and 'transferMaxFee' options defined in the wallet account configuration.
     * @returns {Promise<TransferResult>} The transfer's result.
     */
    transfer(options: TransferOptions, config?: Pick<TonGaslessWalletConfig, "paymasterToken" | "transferMaxFee">): Promise<TransferResult>;
    /**
     * Quotes the costs of a transfer operation.
     *
     * @see {@link transfer}
     * @param {TransferOptions} options - The transfer's options.
     * @param {Pick<TonGaslessWalletConfig, 'paymasterToken' | 'transferMaxFee'>} [config] - If set, overrides the 'paymasterToken' and 'transferMaxFee' options defined in the wallet account configuration.
     * @returns {Promise<Omit<TransferResult, 'hash'>>} The transfer's quotes.
     */
    quoteTransfer(options: TransferOptions, config?: Pick<TonGaslessWalletConfig, "paymasterToken" | "transferMaxFee">): Promise<Omit<TransferResult, "hash">>;
    /** @private */
    private _getGaslessTokenTransfer;
    /** @private */
    private _sendGaslessTokenTransfer;
}
export type TonClient = import("@ton/ton").TonClient;
export type TransferOptions = import("@wdk/wallet").TransferOptions;
export type TransferResult = import("@wdk/wallet").TransferResult;
export type TonClientConfig = {
    /**
     * - The url of the ton center api.
     */
    url: string;
    /**
     * - If set, uses the api-key to authenticate on the ton center api.
     */
    secretKey?: string;
};
export type TonApiClientConfig = {
    /**
     * - The url of the ton api.
     */
    url: string;
    /**
     * - If set, uses the api-key to authenticate on the ton api.
     */
    secretKey?: string;
};
export type TonGaslessWalletConfig = {
    /**
     * - The ton client configuration, or an instance of the {@link TonClient} class.
     */
    tonClient: TonClientConfig | TonClient;
    /**
     * - The ton api client configuration, or an instance of the {@link TonApiClient} class.
     */
    tonApiClient: TonApiClientConfig | TonApiClient;
    /**
     * - The paymaster token configuration.
     */
    paymasterToken: {
        address: string;
    };
    /**
     * - The maximum fee amount for transfer operations.
     */
    transferMaxFee?: number;
};
import { WalletAccountTon } from '@wdk/wallet-ton';
import { TonApiClient } from '@ton-api/client';
