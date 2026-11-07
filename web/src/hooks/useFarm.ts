import { erc20Abi, zeroAddress, type Address } from 'viem'
import { useReadContract, useReadContracts } from 'wagmi'

import { shinkanshenFarmAbi, shinkanshenTokenAbi, type Deployment } from '../contracts'
import type { SupportedChainId } from '../wagmi'

export type PoolInfo = {
  stakeToken: Address
  allocPoint: bigint
  lastRewardTime: bigint
  accRewardPerShare: bigint
  totalStaked: bigint
}

export function useFarmOverview(deployment: Deployment | undefined, chainId: SupportedChainId) {
  const farm = { address: deployment?.farm ?? zeroAddress, abi: shinkanshenFarmAbi, chainId } as const
  const token = { address: deployment?.token ?? zeroAddress, abi: shinkanshenTokenAbi, chainId } as const

  const query = useReadContracts({
    contracts: [
      { ...farm, functionName: 'pools' },
      { ...farm, functionName: 'rewardPerSecond' },
      { ...farm, functionName: 'totalAllocPoint' },
      { ...farm, functionName: 'startTime' },
      { ...token, functionName: 'totalSupply' },
      { ...token, functionName: 'MAX_SUPPLY' },
    ],
    allowFailure: false,
    query: { enabled: deployment !== undefined, refetchInterval: 15_000 },
  })

  const [pools, rewardPerSecond, totalAllocPoint, startTime, totalSupply, maxSupply] = query.data ?? []
  return {
    pools: pools as readonly PoolInfo[] | undefined,
    rewardPerSecond,
    totalAllocPoint,
    startTime,
    totalSupply,
    maxSupply,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useTokenMeta(token: Address, chainId: SupportedChainId) {
  const base = { address: token, abi: erc20Abi, chainId } as const
  const query = useReadContracts({
    contracts: [
      { ...base, functionName: 'symbol' },
      { ...base, functionName: 'name' },
      { ...base, functionName: 'decimals' },
    ],
    allowFailure: false,
    query: { staleTime: Number.POSITIVE_INFINITY },
  })
  const [symbol, name, decimals] = query.data ?? []
  return { symbol, name, decimals, isLoading: query.isLoading }
}

export function usePoolPosition(params: {
  deployment: Deployment
  chainId: SupportedChainId
  pid: bigint
  stakeToken: Address
  account: Address | undefined
}) {
  const { deployment, chainId, pid, stakeToken, account } = params
  const owner = account ?? zeroAddress
  const query = useReadContracts({
    contracts: [
      { address: stakeToken, abi: erc20Abi, chainId, functionName: 'balanceOf', args: [owner] },
      { address: stakeToken, abi: erc20Abi, chainId, functionName: 'allowance', args: [owner, deployment.farm] },
      { address: deployment.farm, abi: shinkanshenFarmAbi, chainId, functionName: 'userInfo', args: [pid, owner] },
      { address: deployment.farm, abi: shinkanshenFarmAbi, chainId, functionName: 'pendingReward', args: [pid, owner] },
    ],
    allowFailure: false,
    query: { enabled: account !== undefined, refetchInterval: 5_000 },
  })
  const [balance, allowance, userInfo, pending] = query.data ?? []
  return {
    balance,
    allowance,
    staked: userInfo?.[0],
    pending,
    isLoading: query.isLoading,
    refetch: query.refetch,
  }
}

export function useAccountRewards(deployment: Deployment, chainId: SupportedChainId, poolCount: number, account: Address | undefined) {
  const owner = account ?? zeroAddress
  const enabled = account !== undefined
  const balance = useReadContract({
    address: deployment.token,
    abi: shinkanshenTokenAbi,
    chainId,
    functionName: 'balanceOf',
    args: [owner],
    query: { enabled, refetchInterval: 5_000 },
  })
  const pending = useReadContracts({
    contracts: Array.from({ length: poolCount }, (_, pid) => ({
      address: deployment.farm,
      abi: shinkanshenFarmAbi,
      chainId,
      functionName: 'pendingReward' as const,
      args: [BigInt(pid), owner] as const,
    })),
    allowFailure: false,
    query: { enabled, refetchInterval: 5_000 },
  })
  return {
    balance: balance.data,
    totalPending: pending.data?.reduce((sum, value) => sum + value, 0n),
  }
}
