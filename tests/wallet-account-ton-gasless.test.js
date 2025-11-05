import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals'

import { Address, beginCell } from '@ton/ton'
import { JettonMinter } from '@ton-community/assets-sdk'

import * as bip39 from 'bip39'

import BlockchainWithLogs from './blockchain-with-logs.js'
import FakeTonClient, { ACTIVE_ACCOUNT_FEE } from './fake-ton-client.js'
import FakeTonApiClient from './fake-ton-api-client.js'

function calculateQueryId(highRandom, lowRandom) {
  const high = BigInt(Math.floor(highRandom * 0x100000000))
  const low = BigInt(Math.floor(lowRandom * 0x100000000))
  const queryId = (high << 32n) | low
  return queryId
}

const originalMathRandom = Math.random
function restoreMathRandom() {
  global.Math.random = originalMathRandom
}

const originalDateNow = Date.now
function restoreDateNow() {
  global.Date.now = originalDateNow
}

const { WalletAccountTonGasless } = await import('../index.js')

const SEED_PHRASE = 'cook voyage document eight skate token alien guide drink uncle term abuse'
const INVALID_SEED_PHRASE = 'invalid seed phrase'
const SEED = bip39.mnemonicToSeedSync(SEED_PHRASE)

const PUBLIC_KEY = 'f2ade24192b5a0fba669da730d105088a3a848519f43b27f24bdd8395eb26b8f'
const PRIVATE_KEY = '904a9fec5f3e5bea8f1b4c5180828843e6acd58c198967fd56b4159b44b5a68ef2ade24192b5a0fba669da730d105088a3a848519f43b27f24bdd8395eb26b8f'

const ACCOUNT = {
  index: 0,
  path: "m/44'/607'/0'/0/0",
  address: 'UQAvTZZjLwb1qnnuP1szbILyQyZT2zpSRX_Bw-fh4O9QojNi',
  keyPair: {
    publicKey: Buffer.from(PUBLIC_KEY, 'hex'),
    privateKey: Buffer.from(PRIVATE_KEY, 'hex')
  }
}

const RECIPIENT = {
  index: 1,
  path: "m/44'/607'/0'/0/1",
  address: 'UQCKSPZPsdyq3FRW9SHtRNY1Ni6qCNbTErQLHUpytJFej_vG'
}

const TREASURY_BALANCE = 1_000_000_000_000n

const INITIAL_BALANCE = 1_000_000_000n
const INITIAL_TOKEN_BALANCE = 100_000n

async function deployTestToken(blockchain, deployer) {
  const jettonMinter = JettonMinter.createFromConfig({
    admin: deployer.address,
    content: beginCell().storeStringTail('TestToken').endCell()
  })

  const testToken = blockchain.openContract(jettonMinter)

  await testToken.sendDeploy(deployer.getSender())

  return testToken
}

async function deployPaymasterToken(blockchain, deployer) {
  const jettonMinter = JettonMinter.createFromConfig({
    admin: deployer.address,
    content: beginCell().storeStringTail('PaymasterToken').endCell()
  })

  const paymasterToken = blockchain.openContract(jettonMinter)

  await paymasterToken.sendDeploy(deployer.getSender())

  return paymasterToken
}

describe('WalletAccountTonGasless', () => {
  let blockchain, treasury, testToken, paymasterToken, tonClient, tonApiClient, account, recipient

  async function sendTonsTo(to, value, options = {}) {
    await treasury.send({ to: Address.parse(to), value, init: options.init })
  }

  async function sendTestTokensTo(to, value) {
    await testToken.sendMint(treasury.getSender(), Address.parse(to), value)
  }

  async function sendPaymasterTokensTo(to, value) {
    await paymasterToken.sendMint(treasury.getSender(), Address.parse(to), value)
  }

  beforeEach(async () => {
    blockchain = await BlockchainWithLogs.create()
    treasury = await blockchain.treasury('treasury', { balance: TREASURY_BALANCE })
    testToken = await deployTestToken(blockchain, treasury)
    paymasterToken = await deployPaymasterToken(blockchain, treasury)

    tonClient = new FakeTonClient(blockchain)
    tonApiClient = new FakeTonApiClient(blockchain, paymasterToken)

    account = new WalletAccountTonGasless(SEED_PHRASE, "0'/0/0", {
      tonClient,
      tonApiClient,
      paymasterToken: {
        address: paymasterToken.address.toString()
      }
    })

    recipient = new WalletAccountTonGasless(SEED_PHRASE, "0'/0/1", {
      tonClient,
      tonApiClient,
      paymasterToken: {
        address: paymasterToken.address.toString()
      }
    })
    // account._tonApiClient = tonApiClient;
    await sendTonsTo(ACCOUNT.address, INITIAL_BALANCE)
    await sendTonsTo(RECIPIENT.address, INITIAL_BALANCE)

    await sendTestTokensTo(ACCOUNT.address, INITIAL_TOKEN_BALANCE)
    await sendPaymasterTokensTo(ACCOUNT.address, INITIAL_TOKEN_BALANCE)
  })

  afterEach(() => {
    account.dispose()
    restoreMathRandom()
    restoreDateNow()
  })

  describe('constructor', () => {
    test('should successfully initialize a gasless account for the given seed phrase and path', async () => {
      const account = new WalletAccountTonGasless(SEED_PHRASE, "0'/0/0", {
        tonClient,
        tonApiClient,
        paymasterToken: {
          address: paymasterToken.address.toString()
        }
      })

      expect(account.index).toBe(ACCOUNT.index)
      expect(account.path).toBe(ACCOUNT.path)
      expect(account.keyPair).toEqual({
        privateKey: new Uint8Array(ACCOUNT.keyPair.privateKey),
        publicKey: new Uint8Array(ACCOUNT.keyPair.publicKey)
      })
    })

    test('should successfully initialize a gasless account for the given seed and path', async () => {
      const account = new WalletAccountTonGasless(SEED, "0'/0/0", {
        tonClient,
        tonApiClient,
        paymasterToken: {
          address: paymasterToken.address.toString()
        }
      })

      expect(account.index).toBe(ACCOUNT.index)
      expect(account.path).toBe(ACCOUNT.path)
      expect(account.keyPair).toEqual({
        privateKey: new Uint8Array(ACCOUNT.keyPair.privateKey),
        publicKey: new Uint8Array(ACCOUNT.keyPair.publicKey)
      })
    })

    test('should throw if the seed phrase is invalid', () => {
      expect(() => {
        new WalletAccountTonGasless(INVALID_SEED_PHRASE, "0'/0/0", {
          tonClient,
          tonApiClient,
          paymasterToken: {
            address: paymasterToken.address.toString()
          }
        })
      }).toThrow('The seed phrase is invalid.')
    })

    test('should throw if the path is invalid', () => {
      expect(() => {
        new WalletAccountTonGasless(SEED, "a'/b/c", {
          tonClient,
          tonApiClient,
          paymasterToken: {
            address: paymasterToken.address.toString()
          }
        })
      }).toThrow('Invalid child index: a')
    })
  })

  describe('sign and verify', () => {
    const MESSAGE = 'Dummy message to sign.'

    const EXPECTED_SIGNATURE = '640cb213751dcff7ed5f72330ca36efd6d640b9cc1df71418ec3c4f730b3fa8e81e450386e2a00c5e87da06f3edefebadd958b7d31a22b8d430da846ce087c06'

    test('should return the correct signature', async () => {
      const signature = await account.sign(MESSAGE)

      expect(signature).toBe(EXPECTED_SIGNATURE)
    })
    test('should return true for a valid signature', async () => {
      const result = await account.verify(MESSAGE, EXPECTED_SIGNATURE)

      expect(result).toBe(true)
    })
  })

  describe('transfer', () => {
    test('should successfully transfer tokens', async () => {
      const TRANSFER = {
        token: testToken.address.toString(),
        recipient: RECIPIENT.address,
        amount: 1_000
      }
      global.Date.now = jest.fn(() => 3_000_000_000_000)
      global.Math.random = jest.fn().mockReturnValueOnce(0.5).mockReturnValueOnce(0.25)

      const accountJettonWalletAddress = await testToken.getWalletAddress(Address.parse(ACCOUNT.address))
      jest.spyOn(account._tonReadOnlyAccount, '_getJettonWalletAddress').mockResolvedValue(accountJettonWalletAddress)
      account._tonAccount._contract.getSeqno = jest.fn().mockResolvedValue(0)

      const { hash, fee } = await account.transfer(TRANSFER)

      expect(hash).toBeDefined()
      expect(hash).toBe('4ee6eb54f84f264a2322bf164f6d8800cfe2a7c9a5235c82d453d6d056a47287')

      expect(fee).toBe(5_000_000n)
    })

    test('should generate different hashes for identical token transfers (queryId ensures uniqueness)', async () => {
      const TRANSFER = {
        token: testToken.address.toString(),
        recipient: RECIPIENT.address,
        amount: 1_000
      }
      global.Date.now = jest.fn(() => 3_000_000_000_000)
      global.Math.random = jest.fn()
        .mockReturnValueOnce(0.1).mockReturnValueOnce(0.2)
        .mockReturnValueOnce(0.3).mockReturnValueOnce(0.4)
        .mockReturnValueOnce(0.5).mockReturnValueOnce(0.6)
      global.Date.now = jest.fn(() => 3_000_000_000_000)
      const accountJettonWalletAddress = await testToken.getWalletAddress(Address.parse(ACCOUNT.address))
      jest.spyOn(account._tonReadOnlyAccount, '_getJettonWalletAddress').mockResolvedValue(accountJettonWalletAddress)
      account._tonAccount._contract.getSeqno = jest.fn().mockResolvedValue(0).mockResolvedValue(1).mockResolvedValue(2)
      const result1 = await account.transfer(TRANSFER)
      const result2 = await account.transfer(TRANSFER)
      const result3 = await account.transfer(TRANSFER)

      expect(result1.hash).toBe('0e0ea3ccffcefebd056cc44bf626e21329817add0a0dc10cf9aa687aed1c1aa2')
      expect(result2.hash).toBe('77689f241dc0e6f3a318907904973730a610ce30ba293135c9af505c7b9bb7b5')
      expect(result3.hash).toBe('5f5a1865c7709fbdd83eeb8a4f68cd1a5f9568b3dd12a71b36ced9f3532ac791')
    })
  })
})