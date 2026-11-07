import type { SupportedChainId } from '../wagmi'
import { ChainSelector } from './ChainSelector'
import { ConnectButton } from './ConnectButton'
import { Link } from './Link'
import { Logo } from './Logo'

export function Header({ chainId }: { chainId: SupportedChainId }) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-rail-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3">
            <Logo />
            <div className="leading-tight">
              <div className="font-display text-lg font-extrabold tracking-tight">Shinkanshen</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-shk-300/80">App</div>
            </div>
          </Link>
          <Link to="/" className="btn-ghost hidden text-xs sm:inline-flex">
            ← Site
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <ChainSelector chainId={chainId} />
          <ConnectButton />
        </div>
      </div>
    </header>
  )
}
