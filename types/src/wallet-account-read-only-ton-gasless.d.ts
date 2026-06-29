export default class WalletAccountReadOnlyTonGasless extends WalletAccountReadOnly {
    /**
     * Creates a new read-only ton gasless wallet account.
     *
     * @param {string | Uint8Array} publicKey - The account's public key.
     * @param {Omit<TonGaslessWalletConfig, 'transferMaxFee' | 'transactionMaxFee'>} config - The configuration object.
     */
    constructor(publicKey: string | Uint8Array, config: Omit<TonGaslessWalletConfig, "transferMaxFee" | "transactionMaxFee">);
    /**
     * The read-only ton gasless wallet account configuration.
     *
     * @protected
     * @type {Omit<TonGaslessWalletConfig, 'transferMaxFee' | 'transactionMaxFee'>}
     */
    protected _config: Omit<TonGaslessWalletConfig, "transferMaxFee" | "transactionMaxFee">;
    /**
     * The ton api client.
     *
     * @protected
     * @type {TonApiClient}
     */
    protected _tonApiClient: TonApiClient;
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
     * Verifies a message's signature.
     *
     * @param {string} message - The original message.
     * @param {string} signature - The signature to verify.
     * @returns {Promise<boolean>} True if the signature is valid.
     */
    verify(message: string, signature: string): Promise<boolean>;
    /**
     * Returns a transaction's receipt.
     *
     * @param {string} hash - The transaction's hash.
     * @returns {Promise<TonTransactionReceipt | null>} - The receipt, or null if the transaction has not been included in a block yet.
     */
    getTransactionReceipt(hash: string): Promise<TonTransactionReceipt | null>;
    
    /**
     * Creates a TON API client whose internal API calls fail over across configured clients.
     *
     * @protected
     * @param {Array<TonApiClientConfig | TonApiClient>} tonApiClients - TON API client configs or clients.
     * @param {number} retries - The number of failover retries.
     * @returns {TonApiClient} The TON API client with a failover API.
     */
    protected static _createTonApiClientWithFailover (tonApiClients: Array<TonApiClientConfig | TonApiClient>, retries: number): TonApiClient;
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
export type TonTransaction = import("@tetherto/wdk-wallet-ton").TonTransaction;
export type TransactionResult = import("@tetherto/wdk-wallet-ton").TransactionResult;
export type TransferOptions = import("@tetherto/wdk-wallet-ton").TransferOptions;
export type TransferResult = import("@tetherto/wdk-wallet-ton").TransferResult;
export type TonTransactionReceipt = import("@tetherto/wdk-wallet-ton").TonTransactionReceipt;
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
     * - The ton configuration or ton client {@link TonClient}. It's also possible to provide an array of configs or clients instead. In such case, connection errors will cause the wallet to automatically fallback on the next client in the list.
     */
    tonClient: TonClientConfig | TonClient | Array<TonClientConfig | TonClient>;
    /**
     * - The ton api configuration or ton api client {@link TonApiClient}. It's also possible to provide an array of configs or api clients instead. In such case, connection errors will cause the wallet to automatically fallback on the next api client in the list.
     */
    tonApiClient: TonApiClientConfig | TonApiClient | Array<TonApiClientConfig | TonApiClient>;
    /**
     * - If set and if 'tonClient' and 'tonApiClient' are lists of configs or clients, the number of additional retry attempts after the initial call fails. Total attempts = `1 + retries`. For example, `retries: 3` with 4 clients will try each client once before throwing. If `retries` exceeds the number of clients, the failover will loop back and retry already-failed clients in round-robin order. Default: 3.
     */
    retries?: number;
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
    /**
     * - The maximum fee amount for sendTransaction and signTransaction operations.
     */
    transactionMaxFee?: number | bigint;
};
import { WalletAccountReadOnly } from '@tetherto/wdk-wallet';
import { TonApiClient } from '@ton-api/client';
import { TonClient } from '@ton/ton';
