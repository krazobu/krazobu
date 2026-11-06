import type { Address, Chain } from 'viem'

import type { Deployment } from '../contracts'
import { useAccountRewards, useFarmOverview } from '../hooks/useFarm'
import { errorMessage } from '../lib/format'
import type { SupportedChainId } from '../wagmi'
import { PoolCard } from './PoolCard'
import { StatsBar } from './StatsBar'

type Props = {
  deployment: Deployment
  chainId: SupportedChainId
  chain: Chain | undefined
  account: Address | undefined
  wrongNetwork: boolean
}

export function Dashboard({ deployment, chainId, chain, account, wrongNetwork }: Props) {
  const overview = useFarmOverview(deployment, chainId)
  const rewards = useAccountRewards(deployment, chainId, overview.pools?.length ?? 0, account)

  if (overview.error) {
    return (
      <div className="card border-rose-400/30 p-6 text-sm">
        <p className="font-semibold text-rose-300">Could not load the farm on {chain?.name ?? 'this network'}.</p>
        <p className="mt-1 text-slate-400">{errorMessage(overview.error)}</p>
        {chainId === 31337 && (
          <p className="mt-3 text-slate-400">
            Start the local chain with <code className="rounded bg-white/10 px-1">pnpm chain</code> and deploy with{' '}
            <code className="rounded bg-white/10 px-1">pnpm deploy:local</code>.
          </p>
        )}
      </div>
    )
  }

  if (!overview.pools || overview.rewardPerSecond === undefined || overview.totalAllocPoint === undefined) {
    return (
      <div className="card flex items-center justify-center gap-3 p-10 text-sm text-slate-400">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-emerald-300 border-t-transparent" />
        Loading pools…
      </div>
    )
  }

  const { pools, rewardPerSecond, totalAllocPoint } = overview
  return (
    <div className="space-y-10">
      <StatsBar
        rewardPerSecond={rewardPerSecond}
        totalSupply={overview.totalSupply ?? 0n}
        maxSupply={overview.maxSupply ?? 0n}
        poolCount={pools.filter((p) => p.allocPoint > 0n).length}
        balance={rewards.balance}
        totalPending={rewards.totalPending}
        connected={account !== undefined}
      />

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold tracking-tight">Pools</h2>
          <p className="text-xs text-slate-500">Rewards accrue every second · harvest any time</p>
        </div>
        {pools.length === 0 ? (
          <p className="card p-6 text-sm text-slate-400">No pools yet. The farm owner can add one with `farm.add(allocPoint, token)`.</p>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {pools.map((pool, index) => (
              <PoolCard
                key={pool.stakeToken}
                deployment={deployment}
                chainId={chainId}
                chain={chain}
                pid={BigInt(index)}
                pool={pool}
                rewardPerSecond={rewardPerSecond}
                totalAllocPoint={totalAllocPoint}
                account={account}
                wrongNetwork={wrongNetwork}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
