import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals'

import { Address } from '@ton/ton'
import { JettonMinter } from '@ton-community/assets-sdk'
import { beginCell } from '@ton/ton'

import * as bip39 from 'bip39'

import BlockchainWithLogs from './blockchain-with-logs.js'
import FakeTonClient from './fake-ton-client.js'
import FakeTonApiClient from './fake-ton-api-client.js'

const { WalletAccountReadOnlyTonGasless } = await import('../index.js')

const SEED_PHRASE = 'cook voyage document eight skate token alien guide drink uncle term abuse'
const SEED = bip39.mnemonicToSeedSync(SEED_PHRASE)

const PUBLIC_KEY = 'f2ade24192b5a0fba669da730d105088a3a848519f43b27f24bdd8395eb26b8f'

const ACCOUNT = {
  index: 0,
  path: "m/44'/607'/0'/0/0",
  address: 'UQAvTZZjLwb1qnnuP1szbILyQyZT2zpSRX_Bw-fh4O9QojNi',
  keyPair: {
    publicKey: Buffer.from(PUBLIC_KEY, 'hex')
  }
}

const RECIPIENT = {
  address: 'UQCKSPZPsdyq3FRW9SHtRNY1Ni6qCNbTErQLHUpytJFej_vG'
}

const TREASURY_BALANCE = 1_000_000_000_000n
const INITIAL_BALANCE = 1_000_000_000n
const INITIAL_TOKEN_BALANCE = 100_000n

async function deployTestToken (blockchain, deployer) {
  const jettonMinter = JettonMinter.createFromConfig({
    admin: deployer.address,
    content: beginCell().storeStringTail('TestToken').endCell()
  })

  const testToken = blockchain.openContract(jettonMinter)

  await testToken.sendDeploy(deployer.getSender())

  return testToken
}

async function deployPaymasterToken (blockchain, deployer) {
  const jettonMinter = JettonMinter.createFromConfig({
    admin: deployer.address,
    content: beginCell().storeStringTail('PaymasterToken').endCell()
  })

  const paymasterToken = blockchain.openContract(jettonMinter)

  await paymasterToken.sendDeploy(deployer.getSender())

  return paymasterToken
}

describe('WalletAccountReadOnlyTonGasless', () => {
  let blockchain, treasury, testToken, paymasterToken, tonClient, tonApiClient, account

  async function sendTonsTo (to, value, options = {}) {
    await treasury.send({ to: Address.parse(to), value, init: options.init })
  }

  async function sendTestTokensTo (to, value) {
    await testToken.sendMint(treasury.getSender(), Address.parse(to), value)
  }

  async function sendPaymasterTokensTo (to, value) {
    await paymasterToken.sendMint(treasury.getSender(), Address.parse(to), value)
  }

  beforeEach(async () => {
    blockchain = await BlockchainWithLogs.create()
    treasury = await blockchain.treasury('treasury', { balance: TREASURY_BALANCE })
    testToken = await deployTestToken(blockchain, treasury)
    paymasterToken = await deployPaymasterToken(blockchain, treasury)

    tonClient = new FakeTonClient(blockchain)
    tonApiClient = new FakeTonApiClient(blockchain, paymasterToken)

    account = new WalletAccountReadOnlyTonGasless(ACCOUNT.keyPair.publicKey, {
      tonClient,
      tonApiClient,
      paymasterToken: {
        address: paymasterToken.address.toString()
      }
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('getAddress', () => {
    test('should return the correct address', async () => {
      const address = await account.getAddress()

      expect(address).toBe(ACCOUNT.address)
    })
  })

  describe('getBalance', () => {
    test('should return the correct balance of the account', async () => {
      await sendTonsTo(ACCOUNT.address, INITIAL_BALANCE)

      const getBalanceSpy = jest.spyOn(account._tonReadOnlyAccount, 'getBalance').mockResolvedValue(INITIAL_BALANCE)

      const balance = await account.getBalance()

      expect(getBalanceSpy).toHaveBeenCalledTimes(1)
      expect(balance).toBe(INITIAL_BALANCE)
    })

    test('should throw if the account is not connected to ton client', async () => {
      const accountWithoutClient = new WalletAccountReadOnlyTonGasless(ACCOUNT.keyPair.publicKey, {
        tonApiClient,
        paymasterToken: {
          address: paymasterToken.address.toString()
        }
      })

      await expect(accountWithoutClient.getBalance())
        .rejects.toThrow('The wallet must be connected to ton center to get balances.')
    })
  })

  describe('getTokenBalance', () => {
    test('should return the correct token balance of the account', async () => {
      await sendTestTokensTo(ACCOUNT.address, INITIAL_TOKEN_BALANCE)

      const getTokenBalanceSpy = jest.spyOn(account._tonReadOnlyAccount, 'getTokenBalance').mockResolvedValue(INITIAL_TOKEN_BALANCE)

      const balance = await account.getTokenBalance(testToken.address.toString())

      expect(getTokenBalanceSpy).toHaveBeenCalledWith(testToken.address.toString())
      expect(balance).toEqual(INITIAL_TOKEN_BALANCE)
    })

    test('should throw if the account is not connected to ton client', async () => {
      const accountWithoutClient = new WalletAccountReadOnlyTonGasless(ACCOUNT.keyPair.publicKey, {
        tonApiClient,
        paymasterToken: {
          address: paymasterToken.address.toString()
        }
      })

      await expect(accountWithoutClient.getTokenBalance(testToken.address.toString()))
        .rejects.toThrow('The wallet must be connected to ton center to get token balances.')
    })
  })

  describe('getPaymasterTokenBalance', () => {
    test('should return the correct paymaster token balance', async () => {
      await sendPaymasterTokensTo(ACCOUNT.address, INITIAL_TOKEN_BALANCE)

      jest.spyOn(account._tonReadOnlyAccount, 'getTokenBalance').mockResolvedValue(INITIAL_TOKEN_BALANCE)

      const balance = await account.getPaymasterTokenBalance()

      expect(balance).toEqual(INITIAL_TOKEN_BALANCE)
    })
  })

  describe('quoteSendTransaction', () => {
    test('should throw error as method is not supported', async () => {
      const TRANSACTION = {
        to: RECIPIENT.address,
        value: 1_000
      }

      await expect(account.quoteSendTransaction(TRANSACTION))
        .rejects.toThrow("Method 'quoteSendTransaction(tx)' not supported on ton gasless.")
    })
  })

  describe('quoteTransfer', () => {
    test('should successfully quote a transfer', async () => {
      const TRANSFER = {
        token: testToken.address.toString(),
        recipient: RECIPIENT.address,
        amount: 1_000
      }

      const accountJettonWalletAddress = await testToken.getWalletAddress(Address.parse(ACCOUNT.address))
      jest.spyOn(account._tonReadOnlyAccount, '_getJettonWalletAddress').mockResolvedValue(accountJettonWalletAddress)
      const gaslessConfigSpy = jest.spyOn(tonApiClient.gasless, 'gaslessConfig')
      const gaslessEstimateSpy = jest.spyOn(tonApiClient.gasless, 'gaslessEstimate')

      const result = await account.quoteTransfer(TRANSFER)

      expect(result).toHaveProperty('fee')
      expect(result.fee).toBe(5_000_000n)
      expect(gaslessConfigSpy).toHaveBeenCalledTimes(1)
      expect(gaslessEstimateSpy).toHaveBeenCalledTimes(1)
    })

    test('should throw error when gaslessConfig API fails', async () => {
      const TRANSFER = {
        token: testToken.address.toString(),
        recipient: RECIPIENT.address,
        amount: 1_000
      }

      const accountJettonWalletAddress = await testToken.getWalletAddress(Address.parse(ACCOUNT.address))
      jest.spyOn(account._tonReadOnlyAccount, '_getJettonWalletAddress').mockResolvedValue(accountJettonWalletAddress)
      jest.spyOn(tonApiClient.gasless, 'gaslessConfig').mockRejectedValue(new Error('API error'))

      await expect(account.quoteTransfer(TRANSFER)).rejects.toThrow('API error')
    })

    test('should throw error when gaslessEstimate API fails', async () => {
      const TRANSFER = {
        token: testToken.address.toString(),
        recipient: RECIPIENT.address,
        amount: 1_000
      }

      const accountJettonWalletAddress = await testToken.getWalletAddress(Address.parse(ACCOUNT.address))
      jest.spyOn(account._tonReadOnlyAccount, '_getJettonWalletAddress').mockResolvedValue(accountJettonWalletAddress)
      jest.spyOn(tonApiClient.gasless, 'gaslessEstimate').mockRejectedValue(new Error('Estimate failed'))

      await expect(account.quoteTransfer(TRANSFER)).rejects.toThrow('Estimate failed')
    })

    test('should throw for invalid recipient address', async () => {
      const TRANSFER = {
        token: testToken.address.toString(),
        recipient: 'invalid-address',
        amount: 1_000
      }

      const accountJettonWalletAddress = await testToken.getWalletAddress(Address.parse(ACCOUNT.address))
      jest.spyOn(account._tonReadOnlyAccount, '_getJettonWalletAddress').mockResolvedValue(accountJettonWalletAddress)

      await expect(account.quoteTransfer(TRANSFER)).rejects.toThrow()
    })
  })

  describe('getTransactionReceipt', () => {
    test('should delegate to underlying tonReadOnlyAccount', async () => {
      const MESSAGE_HASH = 'e3dafa8c96cee59affae9a9ce1c1ac0661ba2b041bee6b46fd188f61ee70582a'

      const getTransactionReceiptSpy = jest.spyOn(account._tonReadOnlyAccount, 'getTransactionReceipt').mockResolvedValue({
        json: () => Promise.resolve({
          transactions: []
        })
      })

      await account.getTransactionReceipt(MESSAGE_HASH)

      expect(getTransactionReceiptSpy).toHaveBeenCalledWith(MESSAGE_HASH)
    })
  })
})