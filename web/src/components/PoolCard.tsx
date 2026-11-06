import { useState } from 'react'
import { erc20Abi, parseUnits, type Address, type Chain } from 'viem'
import { hardhat } from 'wagmi/chains'

import { mockBep20Abi, shinkanshenFarmAbi, type Deployment } from '../contracts'
import { usePoolPosition, useTokenMeta, type PoolInfo } from '../hooks/useFarm'
import { useTx } from '../hooks/useTx'
import { aprPercent, formatAmount, formatPercent, parseAmount, perDay, poolRewardPerSecond, poolShare } from '../lib/format'
import type { SupportedChainId } from '../wagmi'
import { AmountInput } from './AmountInput'
import { TxStatus } from './TxStatus'

type Props = {
  deployment: Deployment
  chainId: SupportedChainId
  chain: Chain | undefined
  pid: bigint
  pool: PoolInfo
  rewardPerSecond: bigint
  totalAllocPoint: bigint
  account: Address | undefined
  wrongNetwork: boolean
}

export function PoolCard({ deployment, chainId, chain, pid, pool, rewardPerSecond, totalAllocPoint, account, wrongNetwork }: Props) {
  const isShkPool = pool.stakeToken.toLowerCase() === deployment.token.toLowerCase()
  const meta = useTokenMeta(pool.stakeToken, chainId)
  const position = usePoolPosition({ deployment, chainId, pid, stakeToken: pool.stakeToken, account })
  const tx = useTx()
  const [tab, setTab] = useState<'stake' | 'unstake'>('stake')
  const [amount, setAmount] = useState('')

  const decimals = meta.decimals ?? 18
  const symbol = meta.symbol ?? '…'
  const parsed = parseAmount(amount, decimals)
  const poolRate = poolRewardPerSecond(rewardPerSecond, pool.allocPoint, totalAllocPoint)
  const share = poolShare(pool.allocPoint, totalAllocPoint)
  const apr = isShkPool ? aprPercent(poolRate, pool.totalStaked) : undefined
  const userShare =
    position.staked !== undefined && pool.totalStaked > 0n ? Number((position.staked * 10_000n) / pool.totalStaked) / 100 : undefined
  const retired = pool.allocPoint === 0n

  const canAct = account !== undefined && !wrongNetwork && !tx.busy
  const needsApproval = parsed !== undefined && position.allowance !== undefined && position.allowance < parsed
  const exceeds =
    parsed !== undefined &&
    (tab === 'stake'
      ? position.balance !== undefined && parsed > position.balance
      : position.staked !== undefined && parsed > position.staked)
  const validAmount = parsed !== undefined && parsed > 0n && !exceeds

  const farm = { address: deployment.farm, abi: shinkanshenFarmAbi, chainId } as const
  const clearAmount = { onSuccess: () => setAmount('') }

  const approve = () =>
    parsed !== undefined &&
    tx.send({ address: pool.stakeToken, abi: erc20Abi, chainId, functionName: 'approve', args: [deployment.farm, parsed] })
  const stake = () => parsed !== undefined && tx.send({ ...farm, functionName: 'deposit', args: [pid, parsed] }, clearAmount)
  const unstake = () => parsed !== undefined && tx.send({ ...farm, functionName: 'withdraw', args: [pid, parsed] }, clearAmount)
  const harvest = () => tx.send({ ...farm, functionName: 'harvest', args: [pid] })
  const emergencyWithdraw = () => {
    if (window.confirm('Emergency withdraw returns your whole stake but forfeits ALL pending rewards. Continue?')) {
      tx.send({ ...farm, functionName: 'emergencyWithdraw', args: [pid] })
    }
  }
  const faucet = () =>
    account !== undefined &&
    tx.send({ address: pool.stakeToken, abi: mockBep20Abi, chainId, functionName: 'mint', args: [account, parseUnits('1000', decimals)] })

  return (
    <article className="card flex flex-col gap-5 p-5" data-testid={`pool-${pid}`}>
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold ${
              isShkPool ? 'bg-emerald-400/15 text-emerald-300' : 'bg-sky-400/15 text-sky-300'
            }`}
          >
            {symbol.slice(0, 3)}
          </div>
          <div>
            <h3 className="text-lg font-semibold leading-tight">
              {meta.isLoading ? 'Loading…' : `Stake ${symbol}`}
            </h3>
            <p className="text-xs text-slate-400">{meta.name ?? ''} · Earn SHK</p>
          </div>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${
            retired ? 'bg-white/5 text-slate-500' : isShkPool ? 'bg-emerald-400/15 text-emerald-300' : 'bg-sky-400/15 text-sky-300'
          }`}
        >
          {retired ? 'Retired' : isShkPool ? 'Single staking' : 'Yield farm'}
        </span>
      </header>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-white/[0.03] p-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="label-xs">{isShkPool ? 'APR' : 'Pool rewards'}</dt>
          <dd className="mt-0.5 font-semibold text-emerald-300">
            {isShkPool ? formatPercent(apr) : `${formatAmount(perDay(poolRate), 18, 0)} SHK/day`}
          </dd>
        </div>
        <div>
          <dt className="label-xs">Allocation</dt>
          <dd className="mt-0.5 font-semibold">{formatPercent(share)}</dd>
        </div>
        <div>
          <dt className="label-xs">Total staked</dt>
          <dd className="mt-0.5 font-semibold" title={formatAmount(pool.totalStaked, decimals, 18)}>
            {formatAmount(pool.totalStaked, decimals)} {symbol}
          </dd>
        </div>
        <div>
          <dt className="label-xs">{isShkPool ? 'Pool rewards' : 'Daily per token'}</dt>
          <dd className="mt-0.5 font-semibold">
            {isShkPool
              ? `${formatAmount(perDay(poolRate), 18, 0)} SHK/day`
              : pool.totalStaked > 0n
                ? `${formatAmount((perDay(poolRate) * 10n ** BigInt(decimals)) / pool.totalStaked)} SHK`
                : '—'}
          </dd>
        </div>
      </dl>

      <div className="flex items-center justify-between gap-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <div className="label-xs">Your stake</div>
            <div className="mt-0.5 font-semibold">
              {account ? `${formatAmount(position.staked, decimals)} ${symbol}` : '—'}
              {userShare !== undefined && userShare > 0 && (
                <span className="ml-1 text-xs font-normal text-slate-400"> ({formatPercent(userShare)} of pool)</span>
              )}
            </div>
          </div>
          <div>
            <div className="label-xs">Claimable</div>
            <div className="mt-0.5 font-semibold text-emerald-300">{account ? `${formatAmount(position.pending)} SHK` : '—'}</div>
          </div>
        </div>
        <button className="btn-primary" disabled={!canAct || !position.pending} onClick={harvest}>
          Harvest
        </button>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 rounded-xl bg-white/5 p-1 text-sm font-semibold">
          {(['stake', 'unstake'] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={`rounded-lg py-2 capitalize transition ${tab === t ? 'bg-rail-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
              onClick={() => {
                setTab(t)
                setAmount('')
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <AmountInput
          value={amount}
          onChange={setAmount}
          max={tab === 'stake' ? position.balance : position.staked}
          decimals={decimals}
          symbol={symbol}
          maxLabel={tab === 'stake' ? 'Wallet' : 'Staked'}
          disabled={!account}
        />

        {!account ? (
          <p className="text-center text-xs text-slate-500">Connect a wallet to stake.</p>
        ) : tab === 'stake' ? (
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-secondary" disabled={!canAct || !validAmount || !needsApproval} onClick={approve}>
              {needsApproval || !validAmount ? `1. Approve ${symbol}` : 'Approved'}
            </button>
            <button className="btn-primary" disabled={!canAct || !validAmount || needsApproval} onClick={stake}>
              2. Stake
            </button>
          </div>
        ) : (
          <button className="btn-primary w-full" disabled={!canAct || !validAmount} onClick={unstake}>
            Unstake
          </button>
        )}
        {exceeds && <p className="text-xs text-rose-400">Amount exceeds your {tab === 'stake' ? 'wallet balance' : 'staked balance'}.</p>}
        <TxStatus status={tx.status} hash={tx.hash} error={tx.error} chain={chain} />
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-3 text-xs text-slate-500">
        <span className="font-mono" title={pool.stakeToken}>
          {pool.stakeToken.slice(0, 10)}…
        </span>
        <div className="flex gap-3">
          {chainId === hardhat.id && !isShkPool && account && (
            <button className="text-sky-300 hover:underline" disabled={tx.busy} onClick={faucet}>
              Faucet: mint 1,000 {symbol}
            </button>
          )}
          <button
            className="text-rose-400/80 hover:text-rose-300 hover:underline disabled:opacity-40"
            disabled={!canAct || !position.staked}
            onClick={emergencyWithdraw}
          >
            Emergency withdraw
          </button>
        </div>
      </footer>
    </article>
  )
}
