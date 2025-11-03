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

import { WalletAccountTon } from '@tetherto/wdk-wallet-ton'

import { beginCell, internal, SendMode, external, storeMessage } from '@ton/ton'

import WalletAccountReadOnlyTonGasless from './wallet-account-read-only-ton-gasless.js'

/** @typedef {import('@tetherto/wdk-wallet').IWalletAccount} IWalletAccount */

/** @typedef {import('@tetherto/wdk-wallet-ton').KeyPair} KeyPair */

/** @typedef {import('@tetherto/wdk-wallet-ton').TonTransaction} TonTransaction */
/** @typedef {import('@tetherto/wdk-wallet-ton').TransactionResult} TransactionResult */
/** @typedef {import('@tetherto/wdk-wallet-ton').TransferOptions} TransferOptions */
/** @typedef {import('@tetherto/wdk-wallet-ton').TransferResult} TransferResult */

/** @typedef {import('./wallet-account-read-only-ton-gasless.js').TonGaslessWalletConfig} TonGaslessWalletConfig */

/** @implements {IWalletAccount} */
export default class WalletAccountTonGasless extends WalletAccountReadOnlyTonGasless {
  /**
   * Creates a new ton gasless wallet account.
   *
   * @param {string | Uint8Array} seed - The wallet's [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) seed phrase.
   * @param {string} path - The BIP-44 derivation path (e.g. "0'/0/0").
   * @param {TonGaslessWalletConfig} config - The configuration object.
   */
  constructor (seed, path, config) {
    const tonAccount = new WalletAccountTon(seed, path, config)

    super(tonAccount.keyPair.publicKey, config)

    /**
     * The ton gasless wallet account configuration.
     *
     * @protected
     * @type {TonGaslessWalletConfig}
     */
    this._config = config

    /** @private */
    this._tonAccount = tonAccount
  }

  /**
   * The derivation path's index of this account.
   *
   * @type {number}
   */
  get index () {
    return this._tonAccount.index
  }

  /**
   * The derivation path of this account (see [BIP-44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)).
   *
   * @type {string}
   */
  get path () {
    return this._tonAccount.path
  }

  /**
   * The account's key pair.
   *
   * @type {KeyPair}
   */
  get keyPair () {
    return this._tonAccount.keyPair
  }

  /**
   * Signs a message.
   *
   * @param {string} message - The message to sign.
   * @returns {Promise<string>} The message's signature.
   */
  async sign (message) {
    return await this._tonAccount.sign(message)
  }

  /**
   * Verifies a message's signature.
   *
   * @param {string} message - The original message.
   * @param {string} signature - The signature to verify.
   * @returns {Promise<boolean>} True if the signature is valid.
   */
  async verify (message, signature) {
    return await this._tonAccount.verify(message, signature)
  }

  /**
   * Sends a transaction.
   *
   * @param {TonTransaction} tx -  The transaction.
   * @returns {Promise<TransactionResult>} The transaction's result.
   */
  async sendTransaction (tx) {
    throw new Error("Method 'sendTransaction(tx)' not supported on ton gasless.")
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

    const message = await this._getGaslessTokenTransferMessage(options)
    const rawParams = await this._getGaslessTokenTransferRawParams(message, { paymasterToken })
    const fee = rawParams.commission

    if (transferMaxFee !== undefined && fee >= transferMaxFee) {
      throw new Error('The transfer operation exceeds the transfer max fee.')
    }

    const hash = await this._sendGaslessTokenTransfer(rawParams)

    return {
      hash,
      fee
    }
  }

  /**
   * Returns a read-only copy of the account.
   *
   * @returns {Promise<WalletAccountReadOnlyTonGasless>} The read-only account.
   */
  async toReadOnlyAccount () {
    const readOnlyAccount = new WalletAccountReadOnlyTonGasless(this.keyPair.publicKey, this._config)

    return readOnlyAccount
  }

  /**
   * Disposes the wallet account, erasing the private key from the memory.
   */
  dispose () {
    this._tonAccount.dispose()
  }

  /** @private */
  async _sendGaslessTokenTransfer (rawParams) {
    const contract = this._tonAccount._contract

    const seqno = await contract.getSeqno()

    const transfer = contract.createTransfer({
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
            init: seqno === 0 ? contract.init : undefined,
            to: contract.address,
            body: transfer
          })
        )
      )
      .endCell()

    await this._tonApiClient.gasless.gaslessSend({
      walletPublicKey: Buffer.from(this.keyPair.publicKey).toString('hex'),
      boc
    })

    return transfer.hash().toString('hex')
  }
}
