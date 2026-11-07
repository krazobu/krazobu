import { useEffect } from 'react'
import type { Address } from 'viem'
import { useChainId } from 'wagmi'

import { DepartureBoard } from '../components/site/DepartureBoard'
import { Faq } from '../components/site/Faq'
import { Features } from '../components/site/Features'
import { Footer } from '../components/site/Footer'
import { Hero } from '../components/site/Hero'
import { HowItWorks } from '../components/site/HowItWorks'
import { Marquee } from '../components/site/Marquee'
import { Nav } from '../components/site/Nav'
import { ScrollProgress } from '../components/site/ScrollProgress'
import { Tokenomics } from '../components/site/Tokenomics'
import { getDeployment } from '../contracts'
import { useFarmOverview, type PoolInfo } from '../hooks/useFarm'
import { scrollToHash, useLocation } from '../router'
import { chains, type SupportedChainId } from '../wagmi'

/** Snapshot of on-chain farm state (undefined fields while loading or when not deployed). */
export type LiveFarm = {
  chainId: SupportedChainId
  chainName: string
  explorerUrl?: string
  deployed: boolean
  farmAddress?: Address
  tokenAddress?: Address
  pools?: readonly PoolInfo[]
  rewardPerSecond?: bigint
  totalAllocPoint?: bigint
  totalSupply?: bigint
  maxSupply?: bigint
}

export function Landing() {
  const chainId = useChainId()
  const location = useLocation()
  const chain = chains.find((c) => c.id === chainId)
  const deployment = getDeployment(chainId)
  const overview = useFarmOverview(deployment, chainId)

  useEffect(() => {
    const hash = location.includes('#') ? location.slice(location.indexOf('#')) : ''
    if (hash) window.setTimeout(() => scrollToHash(hash), 60)
  }, [location])

  const live: LiveFarm = {
    chainId,
    chainName: chain?.name ?? 'BNB Smart Chain',
    explorerUrl: chain?.blockExplorers?.default.url,
    deployed: deployment !== undefined && !overview.error,
    farmAddress: deployment?.farm,
    tokenAddress: deployment?.token,
    pools: overview.pools,
    rewardPerSecond: overview.rewardPerSecond,
    totalAllocPoint: overview.totalAllocPoint,
    totalSupply: overview.totalSupply,
    maxSupply: overview.maxSupply,
  }

  return (
    <div className="min-h-screen">
      <ScrollProgress />
      <div className="noise" aria-hidden="true" />
      <Nav />
      <main>
        <Hero live={live} />
        <Marquee />
        <Features />
        <HowItWorks />
        <Tokenomics live={live} />
        <DepartureBoard live={live} />
        <Faq />
      </main>
      <Footer live={live} />
    </div>
  )
}
