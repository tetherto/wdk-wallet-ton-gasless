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
import { ContractAdapter } from '@ton-api/ton-adapter'
import { TonApiClient } from '@ton-api/client'
import { Address, beginCell, internal, SendMode, external, toNano, storeMessage } from '@ton/core'

/** @typedef {import('@ton-api/client').TonApiClient} TonApiClient */

/** @typedef {import('@ton/ton').TonClient} TonClient */

/** @typedef {import('@ton/ton').OpenedContract} OpenedContract */

/** @typedef {import('@ton/ton').WalletContractV5R1} WalletContractV5R1 */

/** @typedef {import('@wdk/wallet-ton').TonWalletConfig} TonWalletConfig */

/** @typedef {import('@wdk/wallet-ton').TonTransaction} TonTransaction */

/** @typedef {import('@wdk/wallet').TransferOptions} TransferOptions */

/** @typedef {import('@wdk/wallet').TransferResult} TransferResult */

/**
 * @typedef {Object} TonApiClientConfig
 * @property {string} url - The url for tonapi.io.
 * @property {string} [secretKey] - If set, uses the api-key to authenticate on the tonapi.io.
 */

/**
 * @typedef {Object} TonGaslessWalletConfig
 * @extends TonWalletConfig
 * @property {TonApiClientConfig | TonApiClient} [tonApiClient] - The ton api client configuration, or an instance of the {@link TonApiClient} class.
 * @property {Object} paymasterToken - The paymaster token configuration.
 * @property {string} paymasterToken.address - The address of the paymaster token.
 */

const DUMMY_MESSAGE_VALUE = toNano(0.05)

export default class WalletAccountTonGasless extends WalletAccountTon {
  /**
   * @param {string | Uint8Array} seed - The wallet's [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) seed phrase.
   * @param {string} path - The BIP-44 derivation path (e.g. "0'/0/0").
   * @param {TonGaslessWalletConfig} [config] - The configuration object.
   */
  constructor (seed, path, config) {
    super(seed, path, config)

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

      /**
       * The contract adapter for ton api client.
       *
       * @protected
       * @type {OpenedContract<WalletContractV5R1> | undefined}
       */
      this._contractAdapter = new ContractAdapter(this._tonApiClient)
    }
  }

  /**
   * Creates a gasless transfer of a token to another address.
   *
   * @param {TransferOptions} options - The transfer's options.
   * @param {Pick<TonGaslessWalletConfig, 'paymasterToken' | 'transferMaxFee'>} [config] - If set, overrides the ‘paymasterToken’ and ‘transferMaxFee’ options defined in the wallet account configuration.
   * @returns {Promise<TransferResult>} The transfer's result.
   */
  async transfer ({ recipient, amount, token }, config) {
    const { paymasterToken, transferMaxFee } = config ?? this._config
    const { internalMessage, messageToEstimate } = await this._getGaslessTokenTransfer({ recipient, amount, token })
    const gaslessParams = await this._getGaslessEstimate(
      Address.parse(paymasterToken.address),
      messageToEstimate
    )

    const gasCostInPaymasterToken = Number(gaslessParams.commission)

    if (transferMaxFee !== undefined && gasCostInPaymasterToken >= transferMaxFee) {
      throw new Error('The transfer operation exceeds the transfer max fee.')
    }

    await this._sendGaslessTransaction(gaslessParams, token)

    return {
      hash: this._getHash(internalMessage).toString('hex'),
      fee: gasCostInPaymasterToken
    }
  }

  /**
   * Quotes the costs of a gasless transfer operation.
   *
   * @param {TransferOptions} options - The transfer's options.
   * @param {Pick<TonGaslessWalletConfig, 'paymasterToken' | 'transferMaxFee'>} [config] - If set, overrides the ‘paymasterToken’ and ‘transferMaxFee’ options defined in the wallet account configuration.
   * @returns {Promise<Omit<TransferResult, 'hash'>>} The transfer's quotes.
   */
  async quoteTransfer (opts, config) {
    const { paymasterToken } = config ?? this._config
    const { messageToEstimate } = await this._getGaslessTokenTransfer(opts)
    const gaslessParams = await this._getGaslessEstimate(
      Address.parse(paymasterToken.address),
      messageToEstimate
    )

    return { fee: Number(gaslessParams.commission) }
  }

  /** @private */
  async _getGaslessTokenTransfer ({ recipient, amount, token }) {
    const destAddress = Address.parse(recipient)
    const jettonWallet = await this._getJettonWalletAddress(token)
    const relayerAddress = await this._getRelayAddress()

    const jettonTransferPayload = beginCell()
      .storeUint(0xf8a7ea5, 32)
      .storeUint(0, 64)
      .storeCoins(amount)
      .storeAddress(destAddress)
      .storeAddress(relayerAddress)
      .storeBit(false)
      .storeCoins(1n)
      .storeMaybeRef(undefined)
      .endCell()

    const internalMessage = internal({
      to: jettonWallet,
      bounce: true,
      value: DUMMY_MESSAGE_VALUE,
      body: jettonTransferPayload
    })

    const messageToEstimate = beginCell()
      .storeWritable(
        storeMessage(
          internalMessage
        )
      )
      .endCell()

    return { internalMessage, messageToEstimate }
  }

  /** @private */
  async _getRelayAddress () {
    const gaslessConfig = await this._tonApiClient.gasless.gaslessConfig()

    return gaslessConfig.relayAddress
  }

  /** @private */
  async _sendGaslessTransaction (gaslessParams, tokenAddress) {
    const jettonMasterBalance = await this.getTokenBalance(tokenAddress)

    if (jettonMasterBalance < Number(gaslessParams.commission)) {
      throw new Error('Not enough jetton master balance.')
    }

    const contract = this._tonClient.open(this._wallet)
    const seqno = await contract.getSeqno()

    const transfer = this._wallet.createTransfer({
      seqno,
      authType: 'internal',
      timeout: Math.ceil(Date.now() / 1000) + 60,
      secretKey: this.keyPair.privateKey,
      sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
      messages: gaslessParams.messages.map(message =>
        internal({
          to: message.address,
          value: BigInt(message.amount),
          body: message.payload
        })
      )
    })

    const message = beginCell()
      .storeWritable(
        storeMessage(
          external({
            init: seqno === 0 ? contract.init : undefined,
            to: contract.address,
            body: transfer
          })
        )
      )
      .endCell()

    await this._tonApiClient.gasless.gaslessSend({
      walletPublicKey: Buffer.from(this.keyPair.publicKey).toString('hex'),
      boc: message
    })

    return {
      hash: null,
      commission: Number(gaslessParams.commission)
    }
  }

  /** @private */
  async _getGaslessEstimate (jettonMasterAddress, boc) {
    return await this._tonApiClient.gasless.gaslessEstimate(
      jettonMasterAddress,
      {
        walletAddress: this._wallet.address,
        walletPublicKey: Buffer.from(this._wallet.publicKey).toString('hex'),
        messages: [{ boc }]
      }
    )
  }

  /** @private */
  async sendTransaction (tx, config) {
    throw new Error('Unsupported Operation')
  }

  /** @private */
  async quoteSendTransaction () {
    throw new Error('Unsupported Operation')
  }
}
