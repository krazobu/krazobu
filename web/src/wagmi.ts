import { createConfig, http } from 'wagmi'
import { bsc, bscTestnet, hardhat } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

import { deployedChainIds } from './contracts'

// The local Hardhat chain only exists on a developer machine, so production builds never offer it.
const allChains = [bsc, bscTestnet, ...(import.meta.env.DEV ? [hardhat] : [])] as const
// Networks with a deployed farm come first so the app opens on a usable chain.
export const chains = [...allChains].sort(
  (a, b) => Number(deployedChainIds.includes(b.id)) - Number(deployedChainIds.includes(a.id)),
) as unknown as typeof allChains
export type SupportedChainId = (typeof chains)[number]['id']

export const config = createConfig({
  chains,
  connectors: [injected()],
  transports: {
    [bsc.id]: http(import.meta.env.VITE_BSC_RPC_URL || undefined),
    [bscTestnet.id]: http(import.meta.env.VITE_BSC_TESTNET_RPC_URL || undefined),
    [hardhat.id]: http('http://127.0.0.1:8545'),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
