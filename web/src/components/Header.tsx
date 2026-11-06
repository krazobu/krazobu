import { ChainSelector } from './ChainSelector'
import { ConnectButton } from './ConnectButton'
import { Logo } from './Logo'
import type { SupportedChainId } from '../wagmi'

export function Header({ chainId }: { chainId: SupportedChainId }) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-rail-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <a href="/" className="flex items-center gap-3">
          <Logo />
          <div className="leading-tight">
            <div className="text-lg font-bold tracking-tight">Shinkanshen</div>
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-emerald-300/80">BNB Smart Chain</div>
          </div>
        </a>
        <div className="flex items-center gap-2">
          <ChainSelector chainId={chainId} />
          <ConnectButton />
        </div>
      </div>
    </header>
  )
}
