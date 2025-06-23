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
     * @protected
     * @type {TonApiClient | undefined}
     */
    protected _tonApiClient: TonApiClient | undefined;
    /**
     * The contract adapter for ton api client.
     *
     * @protected
     * @type {OpenedContract<WalletContractV5R1> | undefined}
     */
    protected _contractAdapter: OpenedContract<WalletContractV5R1> | undefined;
    /**
     * Creates a gasless transfer of a token to another address.
     *
     * @param {TransferOptions} options - The transfer's options.
     * @param {Pick<TonGaslessWalletConfig, 'paymasterToken' | 'transferMaxFee'>} [config] - If set, overrides the ‘paymasterToken’ and ‘transferMaxFee’ options defined in the wallet account configuration.
     * @returns {Promise<TransferResult>} The transfer's result.
     */
    transfer({ recipient, amount, token }: TransferOptions, config?: Pick<TonGaslessWalletConfig, "paymasterToken" | "transferMaxFee">): Promise<TransferResult>;
    /**
     * Quotes the costs of a gasless transfer operation.
     *
     * @param {TransferOptions} options - The transfer's options.
     * @param {Pick<TonGaslessWalletConfig, 'paymasterToken' | 'transferMaxFee'>} [config] - If set, overrides the ‘paymasterToken’ and ‘transferMaxFee’ options defined in the wallet account configuration.
     * @returns {Promise<Omit<TransferResult, 'hash'>>} The transfer's quotes.
     */
    quoteTransfer(opts: any, config?: Pick<TonGaslessWalletConfig, "paymasterToken" | "transferMaxFee">): Promise<Omit<TransferResult, "hash">>;
    /** @private */
    private _getGaslessTokenTransfer;
    /** @private */
    private _getRelayAddress;
    /** @private */
    private _sendGaslessTransaction;
    /** @private */
    private _getGaslessEstimate;
    /** @private */
    private sendTransaction;
    /** @private */
    private quoteSendTransaction;
}
export type TonApiClient = import("@ton-api/client").TonApiClient;
export type TonClient = any;
export type OpenedContract = any;
export type WalletContractV5R1 = any;
export type TonWalletConfig = import("@wdk/wallet-ton").TonWalletConfig;
export type TonTransaction = import("@wdk/wallet-ton").TonTransaction;
export type TransferOptions = import("@wdk/wallet").TransferOptions;
export type TransferResult = import("@wdk/wallet").TransferResult;
export type TonApiClientConfig = {
    /**
     * - The url for tonapi.io.
     */
    url: string;
    /**
     * - If set, uses the api-key to authenticate on the tonapi.io.
     */
    secretKey?: string;
};
export type TonGaslessWalletConfig = any;
import { TonApiClient } from '@ton-api/client';
