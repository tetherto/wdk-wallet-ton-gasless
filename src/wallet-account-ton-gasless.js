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

import { WalletAccountTon } from '@wdk/wallet-ton'

import { Address, beginCell, internal, SendMode, external, toNano, storeMessage } from '@ton/core'

import { TonApiClient } from '@ton-api/client'

/** @typedef {import('@ton/ton').TonClient} TonClient */

/** @typedef {import('@wdk/wallet').TransferOptions} TransferOptions */
/** @typedef {import('@wdk/wallet').TransferResult} TransferResult */

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

export default class WalletAccountTonGasless extends WalletAccountTon {
  /**
   * Creates a new ton gasless wallet account.
   * 
   * @param {string | Uint8Array} seed - The wallet's [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) seed phrase.
   * @param {string} path - The BIP-44 derivation path (e.g. "0'/0/0").
   * @param {TonGaslessWalletConfig} config - The configuration object.
   */
  constructor (seed, path, config) {
    super(seed, path, config)

    /**
     * The ton gasless wallet account configuration.
     *
     * @protected
     * @type {TonGaslessWalletConfig}
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
  }

  /**
   * Returns the account's balance for the paymaster token defined in the wallet account configuration.
   *
   * @returns {Promise<number>} The paymaster token balance (in base unit).
   */
  async getPaymasterTokenBalance () {
    const { paymasterToken } = this._config

    return await this.getTokenBalance(paymasterToken.address)
  }

  async sendTransaction (tx) {
    throw new Error("Method 'sendTransaction(tx)' not supported on ton gasless.")
  }

  async quoteSendTransaction (tx) {
    throw new Error("Method 'quoteSendTransaction(tx)' not supported on ton gasless.")
  }

  /**
   * Transfers a token to another address.
   *
   * @param {TransferOptions} options - The transfer's options.
   * @param {Pick<TonGaslessWalletConfig, 'paymasterToken' | 'transferMaxFee'>} [config] - If set, overrides the 'paymasterToken' and 'transferMaxFee' options defined in the wallet account configuration.
   * @returns {Promise<TransferResult>} The transfer's result.
   */
  async transfer (options, config) {
    const { paymasterToken, transferMaxFee } = config ?? this._config

    const { rawParams, hash } = await this._getGaslessTokenTransfer(options, { paymasterToken })

    const fee = Number(rawParams.commission)

    if (transferMaxFee !== undefined && fee >= transferMaxFee) {
      throw new Error('The transfer operation exceeds the transfer max fee.')
    }

    await this._sendGaslessTokenTransfer(rawParams)

    return { hash, fee }
  }

  /**
   * Quotes the costs of a transfer operation.
   *
   * @see {@link transfer}
   * @param {TransferOptions} options - The transfer's options.
   * @param {Pick<TonGaslessWalletConfig, 'paymasterToken' | 'transferMaxFee'>} [config] - If set, overrides the 'paymasterToken' and 'transferMaxFee' options defined in the wallet account configuration.
   * @returns {Promise<Omit<TransferResult, 'hash'>>} The transfer's quotes.
   */
  async quoteTransfer (options, config) {
    const { rawParams } = await this._getGaslessTokenTransfer(options, config ?? this._config)

    const fee = Number(rawParams.commission)

    return { fee }
  }

  /** @private */
  async _getGaslessTokenTransfer ({ token, recipient, amount }, { paymasterToken }) {
    recipient = Address.parse(recipient)

    const { relayAddress } = await this._tonApiClient.gasless.gaslessConfig()

    const jettonWalletAddress = await this._getJettonWalletAddress(token)

    const body = beginCell()
      .storeUint(0xf8a7ea5, 32)
      .storeUint(0, 64)
      .storeCoins(amount)
      .storeAddress(recipient)
      .storeAddress(relayAddress)
      .storeBit(false)
      .storeCoins(1n)
      .storeMaybeRef(undefined)
      .endCell()

    const message = internal({
      to: jettonWalletAddress,
      value: DUMMY_MESSAGE_VALUE,
      bounce: true,
      body
    })

    const rawParams = await this._tonApiClient.gasless.gaslessEstimate(
      Address.parse(paymasterToken.address),
      {
        walletAddress: this._wallet.address,
        walletPublicKey: Buffer.from(this._wallet.publicKey).toString('hex'),
        messages: [{
          boc: beginCell()
            .storeWritable(
              storeMessage(message)
            )
            .endCell()
        }]
      }
    )

    const hash = this._getHash(message).toString('hex')

    return { rawParams, hash }
  }

  /** @private */
  async _sendGaslessTokenTransfer (rawParams) {
    const seqno = await this._contract.getSeqno()

    const transfer = this._contract.createTransfer({
      seqno,
      authType: 'internal',
      secretKey: this.keyPair.privateKey,
      sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
      timeout: Math.ceil(Date.now() / 1_000) + 2 * 60,
      messages: rawParams.messages.map(message =>
        internal({
          to: message.address,
          value: BigInt(message.amount),
          body: message.payload
        })
      )
    })

    const boc = beginCell()
      .storeWritable(
        storeMessage(
          external({
            init: seqno === 0 ? this._contract.init : undefined,
            to: this._contract.address,
            body: transfer
          })
        )
      )
      .endCell()

    await this._tonApiClient.gasless.gaslessSend({
      walletPublicKey: Buffer.from(this._wallet.publicKey).toString('hex'),
      boc
    })
  }
}
