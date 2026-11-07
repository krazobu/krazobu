import type { LiveFarm } from '../../pages/Landing'
import { Link } from '../Link'
import { Logo } from '../Logo'
import { ArrowIcon, GithubIcon } from './Icons'

export function Footer({ live }: { live: LiveFarm }) {
  return (
    <footer className="relative overflow-hidden border-t border-white/5">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="card relative overflow-hidden p-10 text-center">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(40rem_16rem_at_50%_120%,rgb(52_211_153/0.25),transparent)]" aria-hidden="true" />
          <h2 className="section-title">Next train departs now.</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">Connect a wallet, pick a pool, and watch your SHK accrue every second.</p>
          <Link to="/app" className="btn-primary btn-lg mt-8">
            Launch App <ArrowIcon width={18} height={18} />
          </Link>
        </div>

        <div className="mt-16 flex flex-wrap items-start justify-between gap-10">
          <div className="max-w-xs">
            <div className="flex items-center gap-3">
              <Logo />
              <div className="font-display text-lg font-extrabold">Shinkanshen</div>
            </div>
            <p className="mt-3 text-sm text-slate-500">Token staking &amp; yield farming on BNB Smart Chain. BEP-20 · open source · unaudited — DYOR.</p>
          </div>
          <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
            <div>
              <div className="label-xs mb-3">Protocol</div>
              <ul className="space-y-2 text-slate-400">
                <li><Link to="/app" className="hover:text-white">App</Link></li>
                <li><Link to="/#pools" className="hover:text-white">Pools</Link></li>
                <li><Link to="/#tokenomics" className="hover:text-white">Tokenomics</Link></li>
              </ul>
            </div>
            <div>
              <div className="label-xs mb-3">Developers</div>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <a className="inline-flex items-center gap-1.5 hover:text-white" href="https://github.com/krazobu/krazobu" target="_blank" rel="noreferrer">
                    <GithubIcon width={14} height={14} /> GitHub
                  </a>
                </li>
                {live.explorerUrl && live.farmAddress && (
                  <li><a className="hover:text-white" href={`${live.explorerUrl}/address/${live.farmAddress}`} target="_blank" rel="noreferrer">Farm contract</a></li>
                )}
                {live.explorerUrl && live.tokenAddress && (
                  <li><a className="hover:text-white" href={`${live.explorerUrl}/address/${live.tokenAddress}`} target="_blank" rel="noreferrer">SHK token</a></li>
                )}
              </ul>
            </div>
            <div>
              <div className="label-xs mb-3">Network</div>
              <ul className="space-y-2 text-slate-400">
                <li><a className="hover:text-white" href="https://www.bnbchain.org" target="_blank" rel="noreferrer">BNB Chain</a></li>
                <li><a className="hover:text-white" href="https://pancakeswap.finance" target="_blank" rel="noreferrer">PancakeSwap</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-6 font-mono text-[11px] tracking-[0.2em] text-slate-600 uppercase">
          <span>© {new Date().getFullYear()} Shinkanshen · MIT</span>
          <span>新幹線 · Built on BNB Smart Chain</span>
        </div>
      </div>
    </footer>
  )
}
