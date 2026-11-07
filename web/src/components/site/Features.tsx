import { BoltIcon, CapIcon, CodeIcon, GithubIcon, KeyIcon, LayersIcon, ShieldIcon } from './Icons'
import { Reveal } from './Reveal'
import { SpotlightCard } from './SpotlightCard'

const features = [
  {
    icon: LayersIcon,
    title: 'Multi-pool allocation',
    body: 'Emissions are split across pools by allocation points. SHK single-staking and LP farms share one schedule — the owner can tune or retire pools without touching anyone’s stake.',
  },
  {
    icon: CapIcon,
    title: 'Hard-capped at 100M',
    body: 'Rewards are minted on demand and can never exceed the cap. When the last SHK is minted, emissions stop cleanly and withdrawals keep working.',
  },
  {
    icon: KeyIcon,
    title: 'Your keys, your exit',
    body: 'Nothing is locked. Unstake any time, or hit emergency withdraw to pull your full stake even if reward accounting ever failed.',
  },
  {
    icon: ShieldIcon,
    title: 'Fee-on-transfer safe',
    body: 'Deposits credit exactly what the farm receives, pools track their own balances, and all entry points are re-entrancy guarded.',
  },
]

export function Features() {
  return (
    <section id="features" className="scroll-mt-24 py-24">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal className="max-w-2xl">
          <span className="eyebrow">Features · 特徴</span>
          <h2 className="section-title mt-4">Built for speed. Engineered for safety.</h2>
          <p className="mt-4 text-slate-400">
            A MasterChef-style farm with time-based emissions, rewritten with the sharp edges filed off.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-6">
          <Reveal className="md:col-span-4">
            <SpotlightCard className="flex h-full flex-col justify-between p-7">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-shk-400/15 text-shk-300">
                  <BoltIcon />
                </div>
                <h3 className="mt-5 font-display text-2xl font-bold">Rewards every second</h3>
                <p className="mt-2 max-w-lg text-slate-400">
                  No epochs, no claim windows. Each pool accrues SHK per second and your share is computed to the wei the
                  moment you harvest, stake, or unstake.
                </p>
              </div>
              <RewardStream />
            </SpotlightCard>
          </Reveal>

          {features.map((feature, index) => (
            <Reveal key={feature.title} className={index === 0 ? 'md:col-span-2' : 'md:col-span-2'} delay={80 * (index + 1)}>
              <SpotlightCard className="h-full p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stripe-400/15 text-stripe-300">
                  <feature.icon />
                </div>
                <h3 className="mt-5 font-display text-xl font-bold">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{feature.body}</p>
              </SpotlightCard>
            </Reveal>
          ))}

          <Reveal className="md:col-span-6" delay={120}>
            <SpotlightCard className="flex flex-wrap items-center justify-between gap-4 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-400/15 text-sky-300">
                  <CodeIcon />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold">Open source. Tested. MIT.</h3>
                  <p className="text-sm text-slate-400">
                    Solidity 0.8 · OpenZeppelin 5 · 22 automated tests covering reward math, access control and edge cases.
                  </p>
                </div>
              </div>
              <a className="btn-secondary" href="https://github.com/krazobu/krazobu" target="_blank" rel="noreferrer">
                <GithubIcon width={18} height={18} /> View the code
              </a>
            </SpotlightCard>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function RewardStream() {
  return (
    <div className="mt-8 flex items-center gap-4 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
      <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-slate-300">Farm</span>
      <div className="relative h-px flex-1 bg-gradient-to-r from-shk-400/40 via-sky-400/40 to-stripe-400/40">
        {Array.from({ length: 6 }, (_, i) => (
          <span
            key={i}
            className="stream-dot"
            style={{
              animationDelay: `${i * 0.55}s`,
              background: i % 3 === 0 ? '#f472b6' : i % 3 === 1 ? '#38bdf8' : '#34d399',
              boxShadow: `0 0 14px ${i % 3 === 0 ? '#f472b6' : i % 3 === 1 ? '#38bdf8' : '#34d399'}`,
            }}
          />
        ))}
      </div>
      <span className="rounded-lg border border-shk-400/30 bg-shk-400/10 px-3 py-2 text-shk-300">You</span>
    </div>
  )
}
