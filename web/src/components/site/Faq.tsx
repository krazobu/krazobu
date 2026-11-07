import { Reveal } from './Reveal'

const faqs = [
  {
    q: 'What is Shinkanshen?',
    a: 'A token staking and yield farming protocol on BNB Smart Chain. You stake SHK or PancakeSwap LP tokens into pools and earn SHK, which the farm mints per second according to each pool’s allocation.',
  },
  {
    q: 'Is there a lockup or withdrawal fee?',
    a: 'No. Stakes can be withdrawn at any time and there are no deposit or withdrawal fees. Pending rewards are paid out automatically whenever you stake, unstake, or harvest.',
  },
  {
    q: 'Where do the rewards come from?',
    a: 'The farm is the only approved minter of SHK. Rewards are created on demand, capped by the 100M max supply, and split across pools by allocation points — so no pre-mined reward reserve can be drained.',
  },
  {
    q: 'What does “emergency withdraw” do?',
    a: 'It returns your entire stake immediately and forfeits any pending rewards. It never touches reward accounting, so it works even if minting were ever to fail.',
  },
  {
    q: 'Which wallets and networks are supported?',
    a: 'Any injected (EIP-1193 / EIP-6963) wallet such as MetaMask or Trust Wallet, on BNB Smart Chain mainnet and testnet. A local Hardhat network is available for development.',
  },
  {
    q: 'Have the contracts been audited?',
    a: 'Not yet. The code is open source under MIT with an automated test suite, but no third-party audit has been performed. Use at your own risk and never stake more than you can afford to lose.',
  },
]

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 border-t border-white/5 bg-white/[0.02] py-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <span className="eyebrow">FAQ · よくある質問</span>
          <h2 className="section-title mt-4">Questions, answered.</h2>
          <p className="mt-4 text-slate-400">Everything you need before you board.</p>
        </Reveal>
        <Reveal className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-rail-900/60" delay={100}>
          {faqs.map((item) => (
            <details key={item.q} className="faq group px-6 py-5">
              <summary className="flex items-center justify-between gap-6 font-display text-lg font-bold">
                {item.q}
                <span className="faq-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-shk-300 transition-transform duration-300">
                  +
                </span>
              </summary>
              <p className="mt-3 pr-14 text-sm leading-relaxed text-slate-400">{item.a}</p>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
