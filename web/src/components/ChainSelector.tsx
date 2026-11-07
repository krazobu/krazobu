import { useSwitchChain } from 'wagmi'

import { deployedChainIds } from '../contracts'
import { chains, type SupportedChainId } from '../wagmi'

export function ChainSelector({ chainId }: { chainId: SupportedChainId }) {
  const switchChain = useSwitchChain()
  return (
    <select
      aria-label="Network"
      className="max-w-[11rem] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 outline-none focus:border-shk-400/60"
      value={chainId}
      disabled={switchChain.isPending}
      onChange={(e) => switchChain.mutate({ chainId: Number(e.target.value) as SupportedChainId })}
    >
      {chains.map((chain) => (
        <option key={chain.id} value={chain.id} className="bg-rail-900">
          {chain.name}
          {deployedChainIds.includes(chain.id) ? '' : ' (not deployed)'}
        </option>
      ))}
    </select>
  )
}
