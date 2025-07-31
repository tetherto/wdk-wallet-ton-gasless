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

import { AbstractWalletAccountReadOnly } from '@wdk/wallet'

import { WalletAccountReadOnlyTon } from '@wdk/wallet-ton'

import { Address, beginCell, internal, toNano, TonClient, storeMessage } from '@ton/ton'

import { TonApiClient } from '@ton-api/client'

/** @typedef {import('@ton/ton').MessageRelaxed} MessageRelaxed */

/** @typedef {import('@ton-api/client').SignRawParams} SignRawParams */

/** @typedef {import('@wdk/wallet-ton').TonTransaction} TonTransaction */
/** @typedef {import('@wdk/wallet-ton').TransactionResult} TransactionResult */
/** @typedef {import('@wdk/wallet-ton').TransferOptions} TransferOptions */
/** @typedef {import('@wdk/wallet-ton').TransferResult} TransferResult */

/** @typedef {import('@wdk/wallet-ton').TonTransactionReceipt} TonTransactionReceipt */

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
 * @property {TonClientConfig | TonClient} tonClient - The ton client configuration, or an instance of the {@link TonClient} class.
 * @property {TonApiClientConfig | TonApiClient} tonApiClient - The ton api client configuration, or an instance of the {@link TonApiClient} class.
 * @property {Object} paymasterToken - The paymaster token configuration.
 * @property {string} paymasterToken.address - The address of the paymaster token.
 * @property {number} [transferMaxFee] - The maximum fee amount for transfer operations.
 */

const DUMMY_MESSAGE_VALUE = toNano(0.05)

export default class WalletAccountReadOnlyTonGasless extends AbstractWalletAccountReadOnly {
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

    if (config.tonApiClient) {
      const { tonApiClient } = config

      /**
       * The ton api client.
       *
       * @protected
       * @type {TonApiClient | undefined}
       */
      this._tonApiClient = tonApiClient instanceof TonApiClient
        ? tonApiClient
        : new TonApiClient({ baseUrl: tonApiClient.url, apiKey: tonApiClient.secretKey })
    }

    /** @private */
    this._tonReadOnlyAccount = tonReadOnlyAccount
  }

  /**
   * Returns the account's ton balance.
   *
   * @returns {Promise<number>} The ton balance (in nanotons).
   */
  async getBalance () {
    return await this._tonReadOnlyAccount.getBalance()
  }

  /**
   * Returns the account balance for a specific token.
   *
   * @param {string} tokenAddress - The smart contract address of the token.
   * @returns {Promise<number>} The token balance (in base unit).
   */
  async getTokenBalance (tokenAddress) {
    return await this._tonReadOnlyAccount.getTokenBalance(tokenAddress)
  }

  /**
   * Returns the account's balance for the paymaster token provided in the wallet account configuration.
   *
   * @returns {Promise<number>} The paymaster token balance (in base unit).
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
    throw new Error("Method 'quoteSendTransaction(tx)' not supported on ton gasless.")
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

    const { commission } = await this._getGaslessTokenTransferRawParams(message, config ?? this._config)

    return { fee: Number(commission) }
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

    const jettonWalletAddress = await this._tonReadOnlyAccount._getJettonWalletAddress(token)

    const body = beginCell()
      .storeUint(0xf8a7ea5, 32)
      .storeUint(0, 64)
      .storeCoins(amount)
      .storeAddress(recipient)
      .storeAddress(relayAddress)
      .storeBit(false)
      .storeCoins(1n)
      .storeMaybeRef()
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
        messages: [{
          boc: beginCell()
            .storeWritable(
              storeMessage(message)
            )
            .endCell()
        }]
      }
    )

    return rawParams
  }
}
