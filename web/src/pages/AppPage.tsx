import { useChainId, useConnection, useSwitchChain } from 'wagmi'

import { Dashboard } from '../components/Dashboard'
import { Header } from '../components/Header'
import { Link } from '../components/Link'
import { getDeployment } from '../contracts'
import { chains } from '../wagmi'

export function AppPage() {
  const chainId = useChainId()
  const { address, chainId: walletChainId, isConnected } = useConnection()
  const switchChain = useSwitchChain()

  const chain = chains.find((c) => c.id === chainId)
  const deployment = getDeployment(chainId)
  const wrongNetwork = isConnected && walletChainId !== chainId

  return (
    <div className="min-h-screen">
      <Header chainId={chainId} />

      <main className="mx-auto max-w-6xl space-y-8 px-4 pt-10 pb-24">
        <section className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label-xs text-shk-300">Staking dashboard · {chain?.name ?? 'Unknown network'}</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Stake. Earn. Harvest.</h1>
          </div>
          <p className="max-w-md text-sm text-slate-400">
            Rewards accrue every second and are paid out on every stake, unstake, or harvest. Nothing is locked.
          </p>
        </section>

        {wrongNetwork && chain && (
          <div className="card flex flex-wrap items-center justify-between gap-3 border-amber-400/30 bg-amber-400/5 p-4 text-sm" role="alert">
            <span className="text-amber-200">Your wallet is connected to a different network than the one selected.</span>
            <button className="btn-secondary" disabled={switchChain.isPending} onClick={() => switchChain.mutate({ chainId })}>
              Switch wallet to {chain.name}
            </button>
          </div>
        )}

        {deployment ? (
          <Dashboard deployment={deployment} chainId={chainId} chain={chain} account={address} wrongNetwork={wrongNetwork} />
        ) : (
          <div className="card space-y-3 p-6 text-sm text-slate-300">
            <p className="font-semibold text-white">Shinkanshen is not deployed on {chain?.name ?? 'this network'} yet.</p>
            <p className="text-slate-400">
              Deploy it from the <code className="rounded bg-white/10 px-1">contracts</code> package, e.g.{' '}
              <code className="rounded bg-white/10 px-1">pnpm --filter @shinkanshen/contracts deploy:bscTestnet</code>, which also
              exports the addresses to this app. Or pick another network above.
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-500">
        {deployment && chain && (
          <p className="mb-2 flex flex-wrap justify-center gap-4 font-mono">
            <ContractLink label="Farm" address={deployment.farm} explorer={chain.blockExplorers?.default.url} />
            <ContractLink label="SHK" address={deployment.token} explorer={chain.blockExplorers?.default.url} />
          </p>
        )}
        <Link to="/" className="hover:text-slate-300">
          ← Back to shinkanshen site
        </Link>
      </footer>
    </div>
  )
}

function ContractLink({ label, address, explorer }: { label: string; address: string; explorer?: string }) {
  const text = `${label}: ${address}`
  return explorer ? (
    <a className="hover:text-slate-300 hover:underline" href={`${explorer}/address/${address}`} target="_blank" rel="noreferrer">
      {text}
    </a>
  ) : (
    <span>{text}</span>
  )
}
