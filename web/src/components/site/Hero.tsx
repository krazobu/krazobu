import { formatUnits } from 'viem'

import { formatAmount, perDay } from '../../lib/format'
import type { LiveFarm } from '../../pages/Landing'
import { Link } from '../Link'
import { CountUp } from './CountUp'
import { ArrowIcon } from './Icons'
import { SpeedLines } from './SpeedLines'

const toNumber = (value: bigint | undefined, decimals = 18) => (value === undefined ? 0 : Number(formatUnits(value, decimals)))

export function Hero({ live }: { live: LiveFarm }) {
  const deployed = live.deployed && live.rewardPerSecond !== undefined
  const emissionsPerDay = live.rewardPerSecond !== undefined ? perDay(live.rewardPerSecond) : undefined
  const activePools = live.pools?.filter((pool) => pool.allocPoint > 0n).length ?? 0

  return (
    <section className="relative flex min-h-[94vh] items-center overflow-hidden pt-24">
      <SpeedLines className="absolute inset-0 h-full w-full opacity-80" />
      <div className="grid-floor" aria-hidden="true" />
      <div className="hero-vignette" aria-hidden="true" />
      <div className="kanji font-display" aria-hidden="true">
        新幹線
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 px-4 py-16 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <span className="eyebrow">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-shk-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-shk-400" />
            </span>
            {deployed ? `Live on ${live.chainName}` : 'BNB Smart Chain · BEP-20'}
          </span>

          <h1 className="mt-6 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
            Yield at <span className="text-gradient text-shimmer">bullet-train</span> speed.
          </h1>

          <p className="mt-6 max-w-xl text-lg text-slate-400">
            Stake SHK or PancakeSwap LP tokens into Shinkanshen pools and earn rewards every single second. No lockups,
            no custodians, hard-capped supply — just a very fast farm on BNB Smart Chain.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/app" className="btn-primary btn-lg">
              Launch App <ArrowIcon width={18} height={18} />
            </Link>
            <Link to="/#how-it-works" className="btn-secondary btn-lg">
              How it works
            </Link>
          </div>

          <dl className="mt-12 grid max-w-xl grid-cols-3 gap-6 border-t border-white/10 pt-6">
            {deployed ? (
              <>
                <Stat label="SHK / day" value={<CountUp value={toNumber(emissionsPerDay)} />} />
                <Stat label="Pools boarding" value={<CountUp value={activePools} />} />
                <Stat label="SHK staked" value={<CountUp value={toNumber(live.pools?.[0]?.totalStaked)} />} />
              </>
            ) : (
              <>
                <Stat label="Max supply" value={<CountUp value={100} suffix="M" />} />
                <Stat label="Farming emissions" value={<CountUp value={90} suffix="M" />} />
                <Stat label="Reward cadence" value={<CountUp value={1} suffix="s" />} />
              </>
            )}
          </dl>
        </div>

        <BoardingPass live={live} emissionsPerDay={emissionsPerDay} activePools={activePools} />
      </div>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="label-xs">{label}</dt>
      <dd className="mt-1 font-display text-2xl font-bold tabular-nums sm:text-3xl">{value}</dd>
    </div>
  )
}

function BoardingPass({ live, emissionsPerDay, activePools }: { live: LiveFarm; emissionsPerDay: bigint | undefined; activePools: number }) {
  const rows = [
    ['From', 'Your wallet'],
    ['To', 'Yield'],
    ['Train', 'SHK Express'],
    ['Departs', 'Every second'],
    ['Class', 'Non-custodial'],
    ['Network', live.chainName],
  ]
  return (
    <div className="ticket animate-float mx-auto w-full max-w-md pl-[10px]" aria-label="Boarding pass">
      <div className="flex items-start justify-between p-6 pb-4">
        <div>
          <div className="font-display text-xl font-extrabold tracking-tight">SHINKANSHEN</div>
          <div className="label-xs mt-1">Boarding pass · 乗車券</div>
        </div>
        <div className="rounded-lg bg-bnb/15 px-2 py-1 font-mono text-[11px] font-bold tracking-wider text-bnb">BEP-20</div>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 px-6 pb-6 font-mono text-sm">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="label-xs">{label}</dt>
            <dd className="mt-0.5 uppercase tracking-wide text-slate-100">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="ticket-perf px-6 py-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="label-xs">Emissions</div>
            <div className="mt-0.5 font-mono text-2xl font-bold text-shk-300 tabular-nums">
              {emissionsPerDay !== undefined ? `${formatAmount(emissionsPerDay, 18, 0)}` : '—'}
              <span className="ml-1 text-xs font-medium text-slate-400">SHK / day</span>
            </div>
          </div>
          <div className="text-right">
            <div className="label-xs">Pools</div>
            <div className="mt-0.5 font-mono text-2xl font-bold tabular-nums">{live.deployed ? activePools : '—'}</div>
          </div>
        </div>
        <div className="barcode mt-5" aria-hidden="true" />
        <div className="mt-2 flex justify-between font-mono text-[10px] tracking-[0.3em] text-slate-500">
          <span>SHK·0001</span>
          <span>{live.deployed ? 'BOARDING' : 'SCHEDULED'}</span>
        </div>
      </div>
    </div>
  )
}
