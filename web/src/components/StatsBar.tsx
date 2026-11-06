import { formatAmount, formatCompact, perDay } from '../lib/format'

type Props = {
  rewardPerSecond: bigint
  totalSupply: bigint
  maxSupply: bigint
  poolCount: number
  balance: bigint | undefined
  totalPending: bigint | undefined
  connected: boolean
}

export function StatsBar({ rewardPerSecond, totalSupply, maxSupply, poolCount, balance, totalPending, connected }: Props) {
  const minted = maxSupply === 0n ? 0 : Number((totalSupply * 10_000n) / maxSupply) / 100
  const stats = [
    { label: 'Daily emissions', value: `${formatAmount(perDay(rewardPerSecond), 18, 0)} SHK` },
    { label: 'Active pools', value: String(poolCount) },
    {
      label: 'SHK supply',
      value: `${formatCompact(totalSupply)} / ${formatCompact(maxSupply)}`,
      bar: minted,
    },
    { label: 'Your SHK', value: connected ? `${formatAmount(balance)} SHK` : '—' },
    { label: 'Claimable rewards', value: connected ? `${formatAmount(totalPending)} SHK` : '—', accent: true },
  ]

  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-5" aria-label="Protocol statistics">
      {stats.map((stat) => (
        <div key={stat.label} className="card p-4">
          <div className="label-xs">{stat.label}</div>
          <div className={`mt-1 truncate text-lg font-semibold ${stat.accent ? 'text-emerald-300' : ''}`} title={stat.value}>
            {stat.value}
          </div>
          {stat.bar !== undefined && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400" style={{ width: `${Math.min(100, stat.bar)}%` }} />
            </div>
          )}
        </div>
      ))}
    </section>
  )
}
