export default class WalletAccountTonGasless {
    /**
     * @param {string | Uint8Array} seed - The wallet's [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) seed phrase.
     * @param {string} path - The BIP-44 derivation path (e.g. "0'/0/0").
     * @param {TonGaslessWalletConfig} [config] - The configuration object.
     */
    constructor(seed: string | Uint8Array, path: string, config?: TonGaslessWalletConfig);
    /**
     * The ton api client.
     *
     * @type {TonApiClient}
     * @protected
     */
    protected _tonApiClient: TonApiClient;
    /**
     * The contract adapter for ton api.
     *
     * @protected
     * @type {ContractAdapter}
     */
    protected _contractAdapter: ContractAdapter;
    /**
     * Creates a gasless transfer of a token to another address.
     *
     * @param {TransferOptions} options - The transfer's options.
     * @param {TransferConfig} config - The transfer's configuration.
     * @returns {Promise<TransferResult>} The transfer's result.
     */
    transfer({ recipient, amount, token }: TransferOptions, config: TransferConfig): Promise<TransferResult>;
    /**
     * Quotes the costs of a gasless transfer operation.
     *
     * @param {TransferOptions} options - The transfer's options.
     * @param {TransferConfig} config - The transfer's configuration.
     * @returns {Promise<Omit<TransferResult, 'hash'>>} The transfer's quotes.
     */
    quoteTransfer(opts: any, config: TransferConfig): Promise<Omit<TransferResult, "hash">>;
    /** @private */
    private _buildGaslessTransfer;
    /** @private */
    private _getRelayAddress;
    /** @private */
    private _sendGaslessTransaction;
    /** @private */
    private _getGaslessEstimate;
}
export type TonClient = any;
export type TransferOptions = any;
export type TransferResult = any;
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
     * - The url of the tonapi.io, or a instance of the {@link TonApiClient} class.
     */
    tonApiUrl?: string | TonApiClient;
    /**
     * - The api-key to use to authenticate on tonapi.io.
     */
    tonApiSecretKey?: string;
    /**
     * - The paymaster token configuration.
     */
    paymasterToken: {
        address: string;
    };
};
export type TransferConfig = {
    /**
     * - The maximum allowed transfer fee.
     */
    transferMaxFee: number;
    /**
     * - The paymaster token configuration.
     */
    paymasterToken: {
        address: string;
    };
};
