import { formatUnits } from 'viem'

import { formatAmount, formatCompact } from '../../lib/format'
import type { LiveFarm } from '../../pages/Landing'
import { CountUp } from './CountUp'
import { Reveal } from './Reveal'

const CIRCUMFERENCE = 2 * Math.PI * 80
const INITIAL_SHARE = 0.1

export function Tokenomics({ live }: { live: LiveFarm }) {
  const minted = live.totalSupply !== undefined && live.maxSupply ? Number((live.totalSupply * 10_000n) / live.maxSupply) / 100 : undefined
  const perSecond = live.rewardPerSecond !== undefined ? Number(formatUnits(live.rewardPerSecond, 18)) : undefined

  return (
    <section id="tokenomics" className="scroll-mt-24 py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 lg:grid-cols-2">
        <Reveal className="relative mx-auto w-full max-w-sm">
          <div className="absolute inset-0 -z-10 rounded-full bg-shk-400/10 blur-3xl" aria-hidden="true" />
          <svg viewBox="0 0 200 200" className="w-full animate-spin-slow" aria-hidden="true">
            <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="18" />
            <circle
              className="donut-arc"
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="url(#emissions)"
              strokeWidth="18"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              style={{ strokeDashoffset: CIRCUMFERENCE * INITIAL_SHARE }}
              transform="rotate(-90 100 100)"
            />
            <circle
              className="donut-arc"
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="#f472b6"
              strokeWidth="18"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              style={{ strokeDashoffset: CIRCUMFERENCE * (1 - INITIAL_SHARE) }}
              transform={`rotate(${-90 + 360 * (1 - INITIAL_SHARE)} 100 100)`}
            />
            <defs>
              <linearGradient id="emissions" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#6ee7b7" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="font-display text-5xl font-extrabold tracking-tight">
              <CountUp value={100} suffix="M" />
            </div>
            <div className="label-xs mt-1">Max supply · SHK</div>
          </div>
        </Reveal>

        <div>
          <Reveal>
            <span className="eyebrow">Tokenomics · 経済</span>
            <h2 className="section-title mt-4">One token. One schedule. No surprises.</h2>
            <p className="mt-4 text-slate-400">
              SHK is a BEP-20 token with a 100,000,000 hard cap enforced on-chain. The farm is the only minter, and it can
              only mint what stakers have actually earned.
            </p>
          </Reveal>

          <Reveal className="mt-8 grid gap-4 sm:grid-cols-2" delay={100}>
            <Fact color="bg-stripe-400" label="Initial supply" value="10M" note="10% · liquidity, treasury, launch" />
            <Fact color="bg-shk-400" label="Farming emissions" value="90M" note="90% · streamed to stakers over time" />
            <Fact color="bg-sky-400" label="Emission rate" value={perSecond !== undefined ? `${perSecond} SHK/s` : 'Configurable'} note="Owner-tunable, capped at 1,000 SHK/s" />
            <Fact color="bg-bnb" label="Minted so far" value={live.totalSupply !== undefined ? formatCompact(live.totalSupply) : '—'} note={minted !== undefined ? `${minted}% of max supply` : 'Live once deployed'} />
          </Reveal>

          {minted !== undefined && (
            <Reveal className="mt-6" delay={160}>
              <div className="flex justify-between font-mono text-xs text-slate-400">
                <span>Supply progress</span>
                <span>
                  {formatAmount(live.totalSupply, 18, 0)} / {formatAmount(live.maxSupply, 18, 0)}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-stripe-400 via-shk-400 to-sky-400"
                  style={{ width: `${Math.max(1, Math.min(100, minted))}%` }}
                />
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  )
}

function Fact({ color, label, value, note }: { color: string; label: string; value: string; note: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-sm ${color}`} />
        <span className="label-xs">{label}</span>
      </div>
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{note}</div>
    </div>
  )
}
