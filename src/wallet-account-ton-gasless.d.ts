/**
 * @typedef {Object} TonGaslessWalletConfig
 * @property {string | TonClient} [tonCenterUrl] - The url of the ton center api, or a instance of the {@link TonClient} class.
 * @property {string} [tonCenterSecretKey] - The api-key to use to authenticate on the ton center api.
 * @property {string | TonApiClient} [tonApiUrl] - The url of the tonapi.io, or a instance of the {@link TonApiClient} class.
 * @property {string} [tonApiSecretKey] - The api-key to use to authenticate on tonapi.io.
 * @property {Object} paymasterToken - The paymaster token configuration.
 * @property {string} paymasterToken.address - The address of the paymaster token.
 */
export default class WalletAccountTonGasless {
    constructor(seed: any, path: any, config: any);
    _tonApiClient: any;
    _contractAdapter: any;
    /**
     * transfer
     * @param {*} param0
     * @param {*} config
     * @returns
     */
    transfer({ recipient, amount, token, simulate }: any, config: any): Promise<{
        hash: any;
        gasCost: number;
        commission?: undefined;
    } | {
        hash: any;
        commission: number;
        gasCost?: undefined;
    }>;
    /**
     * quoteTransfer
     * @param {*} opts
     * @param {*} config
     * @returns
     */
    quoteTransfer(opts: any, config: any): Promise<{
        hash: any;
        gasCost: number;
        commission?: undefined;
    } | {
        hash: any;
        commission: number;
        gasCost?: undefined;
    }>;
    /**
     * _getRelayAddress
     * @returns
     */
    _getRelayAddress(): Promise<any>;
    /**
     * _sendGaslessTransaction
     * @param {*} gaslessParams
     * @param {*} jettonMasterAddress
     * @returns
     */
    _sendGaslessTransaction(gaslessParams: any, jettonMasterAddress: any): Promise<{
        hash: any;
        commission: number;
    }>;
    /**
     * _getGaslessEstimate
     * @param {*} jettonMasterAddress
     * @param {*} boc
     * @returns
     */
    _getGaslessEstimate(jettonMasterAddress: any, boc: any): Promise<any>;
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
