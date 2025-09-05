export default class WalletAccountReadOnlyTonGasless extends WalletAccountReadOnly {
    /**
     * Creates a new read-only ton gasless wallet account.
     *
     * @param {string | Uint8Array} publicKey - The account's public key.
     * @param {Omit<TonGaslessWalletConfig, 'transferMaxFee'>} config - The configuration object.
     */
    constructor(publicKey: string | Uint8Array, config: Omit<TonGaslessWalletConfig, "transferMaxFee">);
    /**
     * The read-only ton gasless wallet account configuration.
     *
     * @protected
     * @type {Omit<TonGaslessWalletConfig, 'transferMaxFee'>}
     */
    protected _config: Omit<TonGaslessWalletConfig, "transferMaxFee">;
    /**
     * The ton api client.
     *
     * @protected
     * @type {TonApiClient | undefined}
     */
    protected _tonApiClient: TonApiClient | undefined;
    /** @private */
    private _tonReadOnlyAccount;
    /**
     * Returns the account's ton balance.
     *
     * @returns {Promise<bigint>} The ton balance (in nanotons).
     */
    getBalance(): Promise<bigint>;
    /**
     * Returns the account balance for a specific token.
     *
     * @param {string} tokenAddress - The smart contract address of the token.
     * @returns {Promise<bigint>} The token balance (in base unit).
     */
    getTokenBalance(tokenAddress: string): Promise<bigint>;
    /**
     * Returns the account's balance for the paymaster token provided in the wallet account configuration.
     *
     * @returns {Promise<bigint>} The paymaster token balance (in base unit).
     */
    getPaymasterTokenBalance(): Promise<bigint>;
    /**
     * Quotes the costs of a send transaction operation.
     *
     * @param {TonTransaction} tx - The transaction.
     * @returns {Promise<Omit<TransactionResult, 'hash'>>} The transaction's quotes.
     */
    quoteSendTransaction(tx: TonTransaction): Promise<Omit<TransactionResult, "hash">>;
    /**
     * Quotes the costs of a transfer operation.
     *
     * @param {TransferOptions} options - The transfer's options.
     * @param {Pick<TonGaslessWalletConfig, 'paymasterToken'>} [config] - If set, overrides the 'paymasterToken' options defined in the wallet account configuration.
     * @returns {Promise<Omit<TransferResult, 'hash'>>} The transfer's quotes.
     */
    quoteTransfer(options: TransferOptions, config?: Pick<TonGaslessWalletConfig, "paymasterToken">): Promise<Omit<TransferResult, "hash">>;
    /**
     * Returns a transaction's receipt.
     *
     * @param {string} hash - The transaction's hash.
     * @returns {Promise<TonTransactionReceipt | null>} - The receipt, or null if the transaction has not been included in a block yet.
     */
    getTransactionReceipt(hash: string): Promise<TonTransactionReceipt | null>;
    /**
     * Creates and returns an internal message to execute the given token transfer.
     *
     * @protected
     * @param {TransferOptions} options - The transfer's options.
     * @returns {Promise<MessageRelaxed>} The internal message.
     */
    protected _getGaslessTokenTransferMessage({ token, recipient, amount }: TransferOptions): Promise<MessageRelaxed>;
    /**
     * Creates and returns the ton api's raw parameters to execute the given message.
     *
     * @protected
     * @param {MessageRelaxed} message - The message.
     * @param {Pick<TonGaslessWalletConfig, 'paymasterToken'>} config - The configuration object.
     * @returns {Promise<SignRawParams>} The ton api's raw parameters.
     */
    protected _getGaslessTokenTransferRawParams(message: MessageRelaxed, { paymasterToken }: Pick<TonGaslessWalletConfig, "paymasterToken">): Promise<SignRawParams>;
}
export type MessageRelaxed = import("@ton/ton").MessageRelaxed;
export type SignRawParams = import("@ton-api/client").SignRawParams;
export type TonTransaction = import("@wdk/wallet-ton").TonTransaction;
export type TransactionResult = import("@wdk/wallet-ton").TransactionResult;
export type TransferOptions = import("@wdk/wallet-ton").TransferOptions;
export type TransferResult = import("@wdk/wallet-ton").TransferResult;
export type TonTransactionReceipt = import("@wdk/wallet-ton").TonTransactionReceipt;
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
    transferMaxFee?: number | bigint;
};
import { WalletAccountReadOnly } from '@wdk/wallet';
import { TonApiClient } from '@ton-api/client';
import { TonClient } from '@ton/ton';
