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
/** @typedef {import('@tetherto/wdk-wallet-ton').TonTransactionDetails} TonTransactionDetails */

/** @typedef {import('@tetherto/wdk-wallet').TransactionReceipt} TransactionReceipt */
/** @typedef {import('@tetherto/wdk-wallet').WaitForTransactionOptions} WaitForTransactionOptions */

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
 * @property {TonClientConfig | TonClient | Array<TonClientConfig | TonClient>} tonClient - The ton configuration or ton client {@link TonClient}. It's also possible to provide an array of configs or clients instead. In such case, connection errors will cause the wallet to automatically fallback on the next client in the list.
 * @property {TonApiClientConfig | TonApiClient | Array<TonApiClientConfig | TonApiClient>} tonApiClient - The ton api configuration or ton api client {@link TonApiClient}. It's also possible to provide an array of configs or api clients instead. In such case, connection errors will cause the wallet to automatically fallback on the next api client in the list.
 * @property {number} [retries] - If set and if 'tonClient' and 'tonApiClient' are lists of configs or clients, the number of additional retry attempts after the initial call fails. Total attempts = `1 + retries`. For example, `retries: 3` with 4 clients will try each client once before throwing. If `retries` exceeds the number of clients, the failover will loop back and retry already-failed clients in round-robin order. Default: 3.
 * @property {Object} paymasterToken - The paymaster token configuration.
 * @property {string} paymasterToken.address - The address of the paymaster token.
 * @property {number | bigint} [transferMaxFee] - The maximum fee amount for transfer operations.
 * @property {number | bigint} [transactionMaxFee] - The maximum fee amount for sendTransaction and signTransaction operations.
 */

const DUMMY_MESSAGE_VALUE = toNano(0.05)
const JETTON_TRANSFER_OPCODE = 0xf8a7ea5

function addressesEqual (left, right) {
  return Address.isAddress(left) && Address.isAddress(right) && left.equals(right)
}

function cellsEqual (left, right) {
  try {
    return left?.hash().equals(right?.hash()) === true
  } catch {
    return false
  }
}

function parseCoins (value) {
  try {
    return BigInt(value)
  } catch {
    return null
  }
}

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
   * @param {Omit<TonGaslessWalletConfig, 'transferMaxFee' | 'transactionMaxFee'>} config - The configuration object.
   */
  constructor (publicKey, config) {
    const tonReadOnlyAccount = new WalletAccountReadOnlyTon(publicKey, config)

    super(tonReadOnlyAccount._address)

    /**
     * The read-only ton gasless wallet account configuration.
     *
     * @protected
     * @type {Omit<TonGaslessWalletConfig, 'transferMaxFee' | 'transactionMaxFee'>}
     */
    this._config = config

    const { tonApiClient, retries = 3 } = config

    if (Array.isArray(tonApiClient)) {
      if (!tonApiClient.length) {
        throw new Error("The 'tonApiClient' option cannot be set to an empty list.")
      }
      this._tonApiClient = WalletAccountReadOnlyTonGasless._createTonApiClientWithFailover(tonApiClient, retries)
    } else {
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
   * @deprecated Use {@link getTransaction} instead, which returns a normalized, finality-based receipt. The raw ton transaction remains available on its `transaction` property.
   * @param {string} hash - The transaction's hash.
   * @returns {Promise<TonTransactionReceipt | null>} - The receipt, or null if the transaction has not been included in a block yet.
   */
  async getTransactionReceipt (hash) {
    return await this._tonReadOnlyAccount.getTransactionReceipt(hash)
  }

  /**
   * Returns a normalized, finality-based receipt for a transaction.
   *
   * Note: TonCenter only indexes transactions once they are included in a block, so a
   * returned receipt is always `confirmed` or `final` — there is no visible `pending`
   * (mempool) state through this API.
   *
   * @param {string} hash - The transaction's message body hash.
   * @returns {Promise<TransactionReceipt & TonTransactionDetails>} The normalized receipt.
   * @throws {NoSuchElementError} If no transaction has been found for the given hash.
   */
  async getTransaction (hash) {
    return await this._tonReadOnlyAccount.getTransaction(hash)
  }

  /**
   * Blocks until a transaction reaches the requested finality target, or times out.
   *
   * Note: there is no `dropped` path. A transaction TonCenter has not indexed yet is
   * indistinguishable from one that will never land, so it stays not-found and a dropped
   * transaction surfaces as a {@link TimeoutError} rather than resolving to a `dropped` receipt.
   *
   * @param {string} hash - The transaction's message body hash.
   * @param {WaitForTransactionOptions} [options] - The wait options.
   * @returns {Promise<TransactionReceipt & TonTransactionDetails>} The terminal receipt for the finality target reached (inspect `success` to tell success from revert).
   * @throws {TimeoutError} If the target is not reached before the timeout.
   */
  async waitForTransaction (hash, options = {}) {
    return await super.waitForTransaction(hash, options)
  }

  /**
   * Creates a TON API client whose internal API calls fail over across configured clients.
   *
   * @protected
   * @param {Array<TonApiClientConfig | TonApiClient>} tonApiClients - TON API client configs or clients.
   * @param {number} retries - The number of failover retries.
   * @returns {TonApiClient} The TON API client with a failover API.
   */
  static _createTonApiClientWithFailover (tonApiClients, retries) {
    const failoverProvider = new FailoverProvider({ retries })

    let tonApiClient

    const clients = tonApiClients.map((entry) => {
      if (entry instanceof TonApiClient) {
        if (!tonApiClient) tonApiClient = entry
        return entry
      }
      return new TonApiClient({ baseUrl: entry.url, apiKey: entry.secretKey })
    })

    for (const client of clients) {
      failoverProvider.addProvider(client.http)
    }

    tonApiClient = tonApiClient || new TonApiClient()
    tonApiClient.http = failoverProvider.initialize()

    return tonApiClient
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
      .storeUint(JETTON_TRANSFER_OPCODE, 32)
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

    await this._validateGaslessTokenTransferRawParams(rawParams, message, { paymasterToken })

    return rawParams
  }

  /**
   * Validates that the relay estimate preserves the requested transfer and only
   * adds the advertised commission transfer.
   *
   * @protected
   * @param {SignRawParams} rawParams - The ton api's raw parameters.
   * @param {MessageRelaxed} originalMessage - The original Jetton transfer message.
   * @param {Pick<TonGaslessWalletConfig, 'paymasterToken'>} config - The configuration object.
   * @returns {Promise<void>}
   * @throws {Error} If the relay estimate changes the requested transfer or returns an invalid commission message.
   */
  async _validateGaslessTokenTransferRawParams (rawParams, originalMessage, { paymasterToken }) {
    const invalidCommissionMessage = 'The gasless estimate returned an invalid commission message.'
    let relayAddress

    try {
      const originalBody = originalMessage.body.beginParse()

      if (originalBody.loadUint(32) !== JETTON_TRANSFER_OPCODE) {
        throw new Error('Invalid original transfer body.')
      }

      originalBody.loadUintBig(64)
      originalBody.loadCoins()
      originalBody.loadAddress()
      relayAddress = originalBody.loadAddress()
    } catch {
      throw new Error('The original Jetton transfer message is invalid.')
    }

    if (!addressesEqual(rawParams?.relayAddress, relayAddress)) {
      throw new Error('The gasless estimate returned an unexpected relay address.')
    }
    if (!addressesEqual(rawParams.from, this._tonReadOnlyAccount._wallet.address)) {
      throw new Error('The gasless estimate returned an unexpected sender address.')
    }
    if (!Number.isSafeInteger(rawParams.validUntil) || rawParams.validUntil <= Math.floor(Date.now() / 1_000)) {
      throw new Error('The gasless estimate returned an invalid expiry.')
    }
    if (typeof rawParams.commission !== 'bigint' || rawParams.commission <= 0n) {
      throw new Error('The gasless estimate returned an invalid commission.')
    }
    if (!Array.isArray(rawParams.messages) || rawParams.messages.length !== 2) {
      throw new Error('The gasless estimate returned an unexpected message set.')
    }

    const original = rawParams.messages.find(message => {
      return addressesEqual(message?.address, originalMessage.info.dest) &&
        parseCoins(message.amount) === originalMessage.info.value.coins &&
        cellsEqual(message.payload, originalMessage.body) &&
        !message.stateInit
    })

    if (!original) {
      throw new Error('The gasless estimate changed the requested Jetton transfer.')
    }

    const commissionMessages = rawParams.messages.filter(message => message !== original)
    const commissionMessage = commissionMessages[0]
    const commissionMessageAmount = parseCoins(commissionMessage?.amount)
    const paymasterJettonWallet = await this._getJettonWalletAddressForMaster(paymasterToken.address)

    if (!addressesEqual(commissionMessage?.address, paymasterJettonWallet) ||
        commissionMessageAmount === null ||
        commissionMessageAmount < 0n ||
        commissionMessageAmount > DUMMY_MESSAGE_VALUE ||
        commissionMessage.stateInit ||
        !commissionMessage.payload) {
      throw new Error(invalidCommissionMessage)
    }

    try {
      const commissionBody = commissionMessage.payload.beginParse()

      if (commissionBody.loadUint(32) !== JETTON_TRANSFER_OPCODE) {
        throw new Error(invalidCommissionMessage)
      }

      commissionBody.loadUintBig(64)
      const commission = commissionBody.loadCoins()
      const destination = commissionBody.loadAddress()
      const responseDestination = commissionBody.loadAddress()
      const customPayload = commissionBody.loadMaybeRef()
      const forwardTonAmount = commissionBody.loadCoins()
      const forwardPayloadInRef = commissionBody.loadBit()

      if (commission !== rawParams.commission ||
          !addressesEqual(destination, relayAddress) ||
          !addressesEqual(responseDestination, relayAddress) ||
          customPayload ||
          forwardTonAmount !== 0n ||
          forwardPayloadInRef ||
          commissionBody.remainingBits !== 0 ||
          commissionBody.remainingRefs !== 0) {
        throw new Error(invalidCommissionMessage)
      }
    } catch {
      throw new Error(invalidCommissionMessage)
    }
  }

  /**
   * Returns the Jetton wallet address for the account and a specific master.
   *
   * @private
   * @param {string} masterAddress - The Jetton master address.
   * @returns {Promise<Address>} The account's Jetton wallet address.
   */
  async _getJettonWalletAddressForMaster (masterAddress) {
    const { stack } = await this._tonReadOnlyAccount._tonClient.callGetMethod(
      Address.parse(masterAddress),
      'get_wallet_address',
      [{
        type: 'slice',
        cell: beginCell().storeAddress(this._tonReadOnlyAccount._wallet.address).endCell()
      }]
    )

    return stack.readAddress()
  }
}
