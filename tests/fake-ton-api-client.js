import { TonApiClient } from '@ton-api/client'
import { Address } from '@ton/ton'

export default class FakeTonApiClient extends TonApiClient {
  constructor(blockchain, paymasterToken) {
    super({ baseUrl: 'http://fake-ton-api' })

    this.blockchain = blockchain
    this.paymasterToken = paymasterToken
    this.relayAddress = Address.parse('0QCbDJJZ9vOWkFkKo1JMa0jXBOT60KBmDybpoCmqsVPUwvNS')

    this.gasless = {
      gaslessConfig: async () => {
        return {
          relayAddress: this.relayAddress
        }
      },

      gaslessEstimate: async (paymasterTokenAddress, params) => {
        const mockCommission = 5_000_000n

        return {
          commission: mockCommission,
          from: params.walletAddress,
          valid_until: Math.floor(Date.now() / 1000) + 600,
          messages: params.messages.map(msg => ({
            address: this.relayAddress.toString(),  // Convert to string to avoid module mismatch
            amount: '1000000',
            payload: msg.boc
          }))
        }
      },

      gaslessSend: async (params) => {
        return {
          success: true,
          message: 'Gasless transaction submitted'
        }
      }
    }

    this.jettons = {
      getJettonInfo: async (address) => {
        return {
          address: address,
          metadata: {
            name: 'Test Token',
            symbol: 'TEST',
            decimals: 6
          },
          mintable: false,
          totalSupply: '1000000000000'
        }
      }
    }
  }
}