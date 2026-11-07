import { useEffect, useState } from 'react'
import type { Address } from 'viem'

import { useTokenMeta, type PoolInfo } from '../../hooks/useFarm'
import { formatAmount, perDay, poolRewardPerSecond, poolShare } from '../../lib/format'
import type { LiveFarm } from '../../pages/Landing'
import type { SupportedChainId } from '../../wagmi'
import { Link } from '../Link'
import { ArrowIcon } from './Icons'
import { Reveal } from './Reveal'

const scheduled = [
  { train: 'SHK Express', type: 'Single staking', platform: '0' },
  { train: 'SHK-BNB LP', type: 'Yield farm', platform: '1' },
]

export function DepartureBoard({ live }: { live: LiveFarm }) {
  const clock = useClock()
  const hasPools = live.deployed && live.pools !== undefined && live.pools.length > 0

  return (
    <section id="pools" className="scroll-mt-24 py-24">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="eyebrow">Pools · 発車案内</span>
            <h2 className="section-title mt-4">Now boarding.</h2>
            <p className="mt-4 text-slate-400">
              Every pool is a train on the same timetable. Pick one, stake, and the rewards leave the station every second.
            </p>
          </div>
          <Link to="/app" className="btn-primary btn-lg">
            Board now <ArrowIcon width={18} height={18} />
          </Link>
        </Reveal>

        <Reveal className="board mt-12 overflow-hidden" delay={120}>
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 text-xs font-bold tracking-[0.3em] text-bnb uppercase">
            <span>Departures · {live.chainName}</span>
            <span className="tabular-nums">{clock}</span>
          </div>
          <div className="grid grid-cols-[1.6fr_1fr_1fr] gap-3 px-5 py-3 text-[10px] font-semibold tracking-[0.25em] text-slate-500 uppercase md:grid-cols-[0.6fr_2fr_1.4fr_1.4fr_1fr_1.2fr]">
            <span className="hidden md:block">Platform</span>
            <span>Train</span>
            <span className="hidden md:block">Type</span>
            <span className="hidden md:block">Rewards</span>
            <span>Alloc</span>
            <span className="text-right">Status</span>
          </div>
          {hasPools
            ? live.pools!.map((pool, index) => (
                <LiveRow
                  key={pool.stakeToken}
                  index={index}
                  pool={pool}
                  chainId={live.chainId}
                  tokenAddress={live.tokenAddress!}
                  rewardPerSecond={live.rewardPerSecond ?? 0n}
                  totalAllocPoint={live.totalAllocPoint ?? 0n}
                />
              ))
            : scheduled.map((row, index) => (
                <Row
                  key={row.train}
                  index={index}
                  platform={row.platform}
                  train={row.train}
                  subtitle="Awaiting deployment"
                  type={row.type}
                  rewards="—"
                  alloc="—"
                  status="scheduled"
                />
              ))}
          <div className="border-t border-white/10 px-5 py-3 font-mono text-[10px] tracking-[0.25em] text-slate-600 uppercase">
            Rewards accrue per second · harvest any time · emergency exit always open
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function LiveRow({
  index,
  pool,
  chainId,
  tokenAddress,
  rewardPerSecond,
  totalAllocPoint,
}: {
  index: number
  pool: PoolInfo
  chainId: SupportedChainId
  tokenAddress: Address
  rewardPerSecond: bigint
  totalAllocPoint: bigint
}) {
  const meta = useTokenMeta(pool.stakeToken, chainId)
  const isShk = pool.stakeToken.toLowerCase() === tokenAddress.toLowerCase()
  const rate = poolRewardPerSecond(rewardPerSecond, pool.allocPoint, totalAllocPoint)
  return (
    <Row
      index={index}
      platform={String(index)}
      train={meta.symbol ? `${meta.symbol} ${isShk ? 'Express' : 'Farm'}` : '…'}
      subtitle={meta.name ?? ''}
      type={isShk ? 'Single staking' : 'Yield farm'}
      rewards={`${formatAmount(perDay(rate), 18, 0)} / day`}
      alloc={`${poolShare(pool.allocPoint, totalAllocPoint)}%`}
      status={pool.allocPoint > 0n ? 'boarding' : 'retired'}
    />
  )
}

type RowProps = {
  index: number
  platform: string
  train: string
  subtitle: string
  type: string
  rewards: string
  alloc: string
  status: 'boarding' | 'retired' | 'scheduled'
}

function Row({ index, platform, train, subtitle, type, rewards, alloc, status }: RowProps) {
  const statusStyle = {
    boarding: 'text-shk-300',
    retired: 'text-slate-500',
    scheduled: 'text-bnb',
  }[status]
  return (
    <div
      className="board-row grid grid-cols-[1.6fr_1fr_1fr] items-center gap-3 border-t border-white/5 px-5 py-4 text-sm md:grid-cols-[0.6fr_2fr_1.4fr_1.4fr_1fr_1.2fr]"
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <span className="hidden md:block">
        <span className="flap text-bnb">{platform}</span>
      </span>
      <span>
        <span className="flap text-slate-100 uppercase">{train}</span>
        <span className="mt-1 block truncate text-[11px] text-slate-500">{subtitle}</span>
      </span>
      <span className="hidden text-slate-300 uppercase md:block">{type}</span>
      <span className="hidden text-shk-300 tabular-nums md:block">{rewards}</span>
      <span className="tabular-nums text-slate-200">{alloc}</span>
      <span className={`flex items-center justify-end gap-2 text-xs font-bold tracking-[0.2em] uppercase ${statusStyle}`}>
        {status === 'boarding' && <span className="h-1.5 w-1.5 animate-blink rounded-full bg-shk-400" />}
        {status}
      </span>
    </div>
  )
}

function useClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-GB', { hour12: false }))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])
  return time
}
