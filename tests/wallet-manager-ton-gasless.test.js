import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals'

import * as bip39 from 'bip39'

import WalletManagerTonGasless, { WalletAccountTonGasless } from '../index.js'

const SEED_PHRASE = 'cook voyage document eight skate token alien guide drink uncle term abuse'
const SEED = bip39.mnemonicToSeedSync(SEED_PHRASE)

describe('WalletManagerTonGasless', () => {
  let wallet
  const mockConfig = {
    tonClient: { url: 'https://testnet.toncenter.com/api/v2/jsonRPC' },
    tonApiClient: { url: 'https://testnet.tonapi.io' },
    paymasterToken: {
      address: 'EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA'
    }
  }

  beforeEach(() => {
    wallet = new WalletManagerTonGasless(SEED_PHRASE, mockConfig)
  })

  afterEach(() => {
    wallet.dispose()
    jest.restoreAllMocks()
  })

  describe('constructor', () => {
    test('should successfully initialize with seed phrase', () => {
      const manager = new WalletManagerTonGasless(SEED_PHRASE, mockConfig)

      expect(manager).toBeInstanceOf(WalletManagerTonGasless)
      expect(manager.seed).toBeDefined()

      manager.dispose()
    })

    test('should successfully initialize with seed buffer', () => {
      const manager = new WalletManagerTonGasless(SEED, mockConfig)

      expect(manager).toBeInstanceOf(WalletManagerTonGasless)
      expect(manager.seed).toBeDefined()

      manager.dispose()
    })

    test('should throw for invalid seed phrase', () => {
      expect(() => {
        new WalletManagerTonGasless('invalid seed phrase', mockConfig)
      }).toThrow()
    })

    test('should store config', () => {
      const manager = new WalletManagerTonGasless(SEED_PHRASE, mockConfig)

      expect(manager._config).toBe(mockConfig)

      manager.dispose()
    })
  })

  describe('getAccount', () => {
    test('should return the account at index 0 by default', async () => {
      const account = await wallet.getAccount()

      expect(account).toBeInstanceOf(WalletAccountTonGasless)
      expect(account.path).toBe("m/44'/607'/0'/0/0")
    })

    test('should return the account at the given index', async () => {
      const account = await wallet.getAccount(3)

      expect(account).toBeInstanceOf(WalletAccountTonGasless)
      expect(account.path).toBe("m/44'/607'/0'/0/3")
    })

    test('should return the same instance for the same index', async () => {
      const account1 = await wallet.getAccount(0)
      const account2 = await wallet.getAccount(0)

      expect(account1).toBe(account2)
    })

    test('should throw if the index is a negative number', async () => {
      await expect(wallet.getAccount(-1))
        .rejects.toThrow('Invalid child index: -1')
    })
  })

  describe('getAccountByPath', () => {
    test('should return the account with the given path', async () => {
      const account = await wallet.getAccountByPath("1'/2/3")

      expect(account).toBeInstanceOf(WalletAccountTonGasless)
      expect(account.path).toBe("m/44'/607'/1'/2/3")
    })

    test('should throw if the path is invalid', async () => {
      await expect(wallet.getAccountByPath("a'/b/c"))
        .rejects.toThrow('Invalid child index: a\'')
    })
  })

  describe('getFeeRates', () => {
    const EXPECTED_FEE_RATE = 1_234

    test('should return the correct fee rates', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({
          config: {
            config_param21: {
              gas_limits_prices: {
                gas_flat_pfx: {
                  other: {
                    gas_prices_ext: {
                      gas_price: EXPECTED_FEE_RATE * 65_536
                    }
                  }
                }
              }
            }
          }
        })
      })

      const feeRates = await wallet.getFeeRates()

      expect(global.fetch).toHaveBeenCalledWith('https://tonapi.io/v2/blockchain/config/raw')

      expect(feeRates).toEqual({
        normal: BigInt(EXPECTED_FEE_RATE),
        fast: BigInt(EXPECTED_FEE_RATE)
      })
    })

    test('should throw error when fetch fails', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      await expect(wallet.getFeeRates()).rejects.toThrow('Network error')
    })

    test('should throw error when API returns invalid response', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({})
      })

      await expect(wallet.getFeeRates()).rejects.toThrow('Cannot read properties of undefined')
    })
  })
})