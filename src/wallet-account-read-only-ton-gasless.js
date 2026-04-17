// Copyright 2024 Tether Operations Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
'use strict'

import { WalletAccountReadOnly } from '@tetherto/wdk-wallet'

import { WalletAccountReadOnlyTon } from '@tetherto/wdk-wallet-ton'

import FailoverProvider from '@tetherto/wdk-failover-provider'

import { Address, beginCell, internal, toNano, storeMessage } from '@ton/ton'

import { TonApiClient } from '@ton-api/client'

/** @typedef {import('@ton/ton').MessageRelaxed} MessageRelaxed */
/** @typedef {import('@ton/ton').TonClient} TonClient */

/** @typedef {import('@ton-api/client').SignRawParams} SignRawParams */

/** @typedef {import('@tetherto/wdk-wallet-ton').TonTransaction} TonTransaction */
/** @typedef {import('@tetherto/wdk-wallet-ton').TransactionResult} TransactionResult */
/** @typedef {import('@tetherto/wdk-wallet-ton').TransferOptions} TransferOptions */
/** @typedef {import('@tetherto/wdk-wallet-ton').TransferResult} TransferResult */

/** @typedef {import('@tetherto/wdk-wallet-ton').TonTransactionReceipt} TonTransactionReceipt */

/**
 * @typedef {Object} TonClientConfig
 * @property {string} url - The url of the ton center api.
 * @property {string} [secretKey] - If set, uses the api-key to authenticate on the ton center api.
 */

/**
 * @typedef {Object} TonApiClientConfig
 * @property {string} url - The url of the ton api.
 * @property {string} [secretKey] - If set, uses the api-key to authenticate on the ton api.
 */

/**
 * @typedef {Object} TonGaslessWalletConfig
 * @property {TonClientConfig | TonClient | Array<TonClientConfig | TonClient>} tonClient - The ton configuration or ton client {@link TonClient}. It's also possible to provide an array of configs or clientss instead. In such case, connection errors will cause the wallet to automatically fallback on the next client in the list.
 * @property {TonApiClientConfig | TonApiClient | Array<TonApiClientConfig | TonApiClient>} tonApiClient - The ton api configuration or ton api client {@link TonApiClient}. It's also possible to provide an array of configs or api clients instead. In such case, connection errors will cause the wallet to automatically fallback on the next api client in the list.
 * @property {number} [retries] - If set and if 'tonClient' and 'tonApiClient' are lists of configs or clients, the number of additional retry attempts after the initial call fails. Total attempts = `1 + retries`. For example, `retries: 3` with 4 clients will try each client once before throwing. If `retries` exceeds the number of clients, the failover will loop back and retry already-failed clients in round-robin order. Default: 3.
 * @property {Object} paymasterToken - The paymaster token configuration.
 * @property {string} paymasterToken.address - The address of the paymaster token.
 * @property {number | bigint} [transferMaxFee] - The maximum fee amount for transfer operations.
 */

const DUMMY_MESSAGE_VALUE = toNano(0.05)

export default class WalletAccountReadOnlyTonGasless extends WalletAccountReadOnly {
  /**
   * The ton api client.
   *
   * @protected
   * @type {TonApiClient}
   */
  _tonApiClient

  /**
   * Creates a new read-only ton gasless wallet account.
   *
   * @param {string | Uint8Array} publicKey - The account's public key.
   * @param {Omit<TonGaslessWalletConfig, 'transferMaxFee'>} config - The configuration object.
   */
  constructor (publicKey, config) {
    const tonReadOnlyAccount = new WalletAccountReadOnlyTon(publicKey, config)

    super(tonReadOnlyAccount._address)

    /**
     * The read-only ton gasless wallet account configuration.
     *
     * @protected
     * @type {Omit<TonGaslessWalletConfig, 'transferMaxFee'>}
     */
    this._config = config

    const { tonApiClient, retries = 3 } = config

    if (Array.isArray(tonApiClient)) {
      if (!tonApiClient.length) {
        throw new Error("The 'provider' option cannot be set to an empty list.")
      }

      const failoverProvider = new FailoverProvider({ retries })

      for (const entry of tonApiClient) {
        const option = entry instanceof TonApiClient
          ? entry
          : new TonApiClient({ endpoint: entry.url, apiKey: entry.secretKey })
        failoverProvider.addProvider(option)
      }

      this._tonApiClient = failoverProvider.initialize()
    } else {
      this._tonApiClient = tonApiClient instanceof TonApiClient
        ? tonApiClient
        : new TonApiClient({ endpoint: tonApiClient.url, apiKey: tonApiClient.secretKey })
    }

    /** @private */
    this._tonReadOnlyAccount = tonReadOnlyAccount
  }

  /**
   * Returns the account's ton balance.
   *
   * @returns {Promise<bigint>} The ton balance (in nanotons).
   */
  async getBalance () {
    return await this._tonReadOnlyAccount.getBalance()
  }

  /**
   * Returns the account balance for a specific token.
   *
   * @param {string} tokenAddress - The smart contract address of the token.
   * @returns {Promise<bigint>} The token balance (in base unit).
   */
  async getTokenBalance (tokenAddress) {
    return await this._tonReadOnlyAccount.getTokenBalance(tokenAddress)
  }

  /**
   * Returns the account's balance for the paymaster token provided in the wallet account configuration.
   *
   * @returns {Promise<bigint>} The paymaster token balance (in base unit).
   */
  async getPaymasterTokenBalance () {
    const { paymasterToken } = this._config

    return await this.getTokenBalance(paymasterToken.address)
  }

  /**
   * Quotes the costs of a send transaction operation.
   *
   * @param {TonTransaction} tx - The transaction.
   * @returns {Promise<Omit<TransactionResult, 'hash'>>} The transaction's quotes.
   */
  async quoteSendTransaction (tx) {
    throw new Error(
      "Method 'quoteSendTransaction(tx)' not supported on ton gasless."
    )
  }

  /**
   * Quotes the costs of a transfer operation.
   *
   * @param {TransferOptions} options - The transfer's options.
   * @param {Pick<TonGaslessWalletConfig, 'paymasterToken'>} [config] - If set, overrides the 'paymasterToken' options defined in the wallet account configuration.
   * @returns {Promise<Omit<TransferResult, 'hash'>>} The transfer's quotes.
   */
  async quoteTransfer (options, config) {
    const message = await this._getGaslessTokenTransferMessage(options)

    const { commission } = await this._getGaslessTokenTransferRawParams(
      message,
      config ?? this._config
    )

    return { fee: commission }
  }

  /**
   * Verifies a message's signature.
   *
   * @param {string} message - The original message.
   * @param {string} signature - The signature to verify.
   * @returns {Promise<boolean>} True if the signature is valid.
   */
  async verify (message, signature) {
    return await this._tonReadOnlyAccount.verify(message, signature)
  }

  /**
   * Returns a transaction's receipt.
   *
   * @param {string} hash - The transaction's hash.
   * @returns {Promise<TonTransactionReceipt | null>} - The receipt, or null if the transaction has not been included in a block yet.
   */
  async getTransactionReceipt (hash) {
    return await this._tonReadOnlyAccount.getTransactionReceipt(hash)
  }

  /**
   * Creates and returns an internal message to execute the given token transfer.
   *
   * @protected
   * @param {TransferOptions} options - The transfer's options.
   * @returns {Promise<MessageRelaxed>} The internal message.
   */
  async _getGaslessTokenTransferMessage ({ token, recipient, amount }) {
    recipient = Address.parse(recipient)

    const { relayAddress } = await this._tonApiClient.gasless.gaslessConfig()

    const jettonWalletAddress =
      await this._tonReadOnlyAccount._getJettonWalletAddress(token)

    const queryId = this._tonReadOnlyAccount._generateQueryId()

    const body = beginCell()
      .storeUint(0xf8a7ea5, 32)
      .storeUint(queryId, 64)
      .storeCoins(amount)
      .storeAddress(recipient)
      .storeAddress(relayAddress)
      .storeBit(false)
      .storeCoins(1n)
      .storeMaybeRef(null)
      .endCell()

    const message = internal({
      to: jettonWalletAddress,
      value: DUMMY_MESSAGE_VALUE,
      bounce: true,
      body
    })

    return message
  }

  /**
   * Creates and returns the ton api's raw parameters to execute the given message.
   *
   * @protected
   * @param {MessageRelaxed} message - The message.
   * @param {Pick<TonGaslessWalletConfig, 'paymasterToken'>} config - The configuration object.
   * @returns {Promise<SignRawParams>} The ton api's raw parameters.
   */
  async _getGaslessTokenTransferRawParams (message, { paymasterToken }) {
    const wallet = this._tonReadOnlyAccount._wallet

    const rawParams = await this._tonApiClient.gasless.gaslessEstimate(
      Address.parse(paymasterToken.address),
      {
        walletAddress: wallet.address,
        walletPublicKey: Buffer.from(wallet.publicKey).toString('hex'),
        messages: [
          {
            boc: beginCell().storeWritable(storeMessage(message)).endCell()
          }
        ]
      }
    )

    return rawParams
  }
}
