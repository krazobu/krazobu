import { Reveal } from './Reveal'

const stations = [
  { number: '01', kanji: '接続', title: 'Connect', body: 'Plug in MetaMask or any injected wallet on BNB Smart Chain. The app detects the network and the deployed farm.' },
  { number: '02', kanji: '預入', title: 'Stake', body: 'Approve once, then deposit SHK or a PancakeSwap LP token into a pool. Your share of the pool updates instantly.' },
  { number: '03', kanji: '獲得', title: 'Earn', body: 'SHK accrues to your position every second, pro rata to your stake and the pool’s allocation points.' },
  { number: '04', kanji: '収穫', title: 'Harvest', body: 'Claim rewards whenever you like, compound by restaking, or unstake — every action settles what you’re owed.' },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 border-y border-white/5 bg-white/[0.02] py-24">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal className="max-w-2xl">
          <span className="eyebrow">How it works · 乗り方</span>
          <h2 className="section-title mt-4">Four stops to yield.</h2>
          <p className="mt-4 text-slate-400">The whole journey takes less time than a Nozomi takes to leave the platform.</p>
        </Reveal>

        <Reveal className="relative mt-16" delay={100}>
          <div className="rail-line top-0 bottom-0 left-[22px] w-px md:top-[22px] md:right-0 md:bottom-auto md:left-0 md:h-px md:w-auto" aria-hidden="true">
            <span className="rail-train" />
          </div>

          <ol className="grid gap-10 md:grid-cols-4 md:gap-6">
            {stations.map((station, index) => (
              <li key={station.number} className="relative pl-16 md:pl-0 md:pt-16">
                <span
                  className="station-dot absolute top-0 left-[11px] flex h-6 w-6 items-center justify-center rounded-full border-2 border-shk-400 bg-rail-950 md:top-[11px] md:left-0"
                  style={{ animationDelay: `${index * 0.6}s` }}
                  aria-hidden="true"
                >
                  <span className="h-2 w-2 rounded-full bg-shk-400" />
                </span>
                <div className="font-mono text-xs font-semibold tracking-[0.3em] text-stripe-400">
                  {station.number} <span className="ml-2 text-slate-600">{station.kanji}</span>
                </div>
                <h3 className="mt-2 font-display text-2xl font-bold">{station.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{station.body}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  )
}
