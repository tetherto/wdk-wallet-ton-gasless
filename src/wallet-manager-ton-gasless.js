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

import WalletManagerTon from '@wdk/wallet-ton'
import WalletAccountTonGasless from './wallet-account-ton-gasless.js'

/** @typedef {import('./wallet-account-ton-gasless.js').TonGaslessWalletConfig} TonGaslessWalletConfig */

export default class WalletManagerTonGasless extends WalletManagerTon {
  /**
   * Creates a new gasless wallet manager for the ton blockchain.
   *
   * @param {string | Uint8Array} seed - The wallet's [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) seed phrase.
   * @param {TonGaslessWalletConfig} [config] - The configuration object.
   */
  constructor (seed, config = {}) {
    super(seed, config)

    /**
     * The ton gasless wallet configuration.
     *
     * @protected
     * @type {TonGaslessWalletConfig}
     */
    this._config = config
  }

  /**
   * Returns the gasless wallet account at a specific index (see [BIP-44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)).
   *
   * @example
   * // Returns the account with derivation path m/44'/607'/0'/0/1
   * const account = await wallet.getAccount(1);
   * @param {number} [index] - The index of the account to get (default: 0).
   * @returns {Promise<WalletAccountTonGasless>} The gasless account.
   */
  async getAccount (index = 0) {
    return await this.getAccountByPath(`0'/0/${index}`)
  }

  /**
   * Returns the gasless wallet account at a specific BIP-44 derivation path.
   *
   * @example
   * // Returns the account with derivation path m/44'/607'/0'/0/1
   * const account = await wallet.getAccountByPath("0'/0/1");
   * @param {string} path - The derivation path (e.g. "0'/0/0").
   * @returns {Promise<WalletAccountTonGasless>} The gasless account.
   */
  async getAccountByPath (path) {
    if (!this._accounts[path]) {
      const account = new WalletAccountTonGasless(this.seed, path, this._config)

      this._accounts[path] = account
    }

    return this._accounts[path]
  }
}
