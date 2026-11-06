import { useConnect, useConnection, useConnectors, useDisconnect } from 'wagmi'

import { errorMessage, shortAddress } from '../lib/format'

export function ConnectButton() {
  const { address, isConnected, connector } = useConnection()
  const connectors = useConnectors()
  const connect = useConnect()
  const disconnect = useDisconnect()

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm sm:inline" title={address}>
          {shortAddress(address)}
        </span>
        <button className="btn-secondary" onClick={() => disconnect.mutate()} title={`Disconnect ${connector?.name ?? ''}`}>
          Disconnect
        </button>
      </div>
    )
  }

  const hasProvider = typeof window !== 'undefined' && Boolean((window as { ethereum?: unknown }).ethereum)
  if (!hasProvider) {
    return (
      <a className="btn-primary" href="https://metamask.io/download/" target="_blank" rel="noreferrer">
        Install MetaMask
      </a>
    )
  }

  // EIP-6963 discovery may surface the same wallet under several connectors; show one per name.
  const unique = connectors.filter((c, i) => connectors.findIndex((o) => o.name === c.name) === i)
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        {unique.map((c) => (
          <button key={c.uid} className="btn-primary" disabled={connect.isPending} onClick={() => connect.mutate({ connector: c })}>
            {connect.isPending ? 'Connecting…' : `Connect ${c.name === 'Injected' ? 'Wallet' : c.name}`}
          </button>
        ))}
      </div>
      {connect.error && <span className="text-xs text-rose-400">{errorMessage(connect.error)}</span>}
    </div>
  )
}
