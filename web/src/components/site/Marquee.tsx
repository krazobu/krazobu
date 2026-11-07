const items = [
  'Rewards every second',
  'BEP-20 native',
  'No lockups',
  'Emergency exit, always',
  '100M hard cap',
  'Multi-pool allocation',
  'Fee-on-transfer safe',
  'Open source · MIT',
  'PancakeSwap LP ready',
]

export function Marquee() {
  const doubled = [...items, ...items]
  return (
    <div className="marquee relative border-y border-white/5 bg-white/[0.02] py-4" aria-hidden="true">
      <div className="marquee-track gap-10 pr-10 font-mono text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
        {doubled.map((item, index) => (
          <span key={index} className="flex items-center gap-10 whitespace-nowrap">
            {item}
            <span className="text-stripe-400">◆</span>
          </span>
        ))}
      </div>
    </div>
  )
}
