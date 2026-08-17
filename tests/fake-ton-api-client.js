import { TonApiClient } from '@ton-api/client'
import { Address, beginCell } from '@ton/ton'

const JETTON_TRANSFER_OPCODE = 0xf8a7ea5

export default class FakeTonApiClient extends TonApiClient {
  constructor (blockchain, paymasterToken) {
    super({ baseUrl: 'http://fake-ton-api' })

    this.blockchain = blockchain
    this.paymasterToken = paymasterToken
    this.relayAddress = Address.parse('0QCbDJJZ9vOWkFkKo1JMa0jXBOT60KBmDybpoCmqsVPUwvNS')
    this.mockCommission = 5_000_000n

    this.gasless = {
      gaslessConfig: async () => {
        return {
          relayAddress: this.relayAddress
        }
      },

      gaslessEstimate: async (paymasterTokenAddress, params) => {
        const feePaymentBody = beginCell()
          .storeUint(JETTON_TRANSFER_OPCODE, 32)
          .storeUint(0, 64)
          .storeCoins(this.mockCommission)
          .storeAddress(this.relayAddress)
          .storeAddress(this.relayAddress)
          .storeBit(false)
          .storeCoins(1n)
          .storeMaybeRef(null)
          .endCell()

        return {
          commission: this.mockCommission,
          relayAddress: this.relayAddress,
          from: params.walletAddress,
          validUntil: Math.floor(Date.now() / 1000) + 600,
          messages: [
            {
              address: params.walletAddress.toString(),
              amount: '1000000',
              payload: feePaymentBody
            },
            ...params.messages.map(msg => ({
              address: params.walletAddress.toString(),
              amount: '1000000',
              payload: msg.boc
            }))
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
