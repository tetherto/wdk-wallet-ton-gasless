import { TonApiClient } from '@ton-api/client'
import { Address, beginCell, loadMessageRelaxed, toNano } from '@ton/ton'

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
        const originalMessage = loadMessageRelaxed(params.messages[0].boc.beginParse())
        const paymasterJettonWallet = await this.paymasterToken.getWalletAddress(
          Address.parse(params.walletAddress.toString())
        )
        const commissionPayload = beginCell()
          .storeUint(0xf8a7ea5, 32)
          .storeUint(0, 64)
          .storeCoins(mockCommission)
          .storeAddress(this.relayAddress)
          .storeAddress(this.relayAddress)
          .storeBit(false)
          .storeCoins(0n)
          .storeBit(false)
          .endCell()

        return {
          relayAddress: this.relayAddress,
          commission: mockCommission,
          from: params.walletAddress,
          validUntil: Math.floor(Date.now() / 1000) + 600,
          protocolName: 'gasless',
          messages: [
            {
              address: paymasterJettonWallet,
              amount: toNano(0.005).toString(),
              payload: commissionPayload
            },
            {
              address: originalMessage.info.dest,
              amount: originalMessage.info.value.coins.toString(),
              payload: originalMessage.body
            }
          ]
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
