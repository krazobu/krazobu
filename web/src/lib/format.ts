import { BaseError, formatUnits, parseUnits } from 'viem'

const SECONDS_PER_DAY = 86_400n
const SECONDS_PER_YEAR = 31_536_000n

export function formatAmount(value: bigint | undefined, decimals = 18, maxFractionDigits = 4): string {
  if (value === undefined) return '—'
  const num = Number(formatUnits(value, decimals))
  const smallest = 10 ** -maxFractionDigits
  if (num !== 0 && Math.abs(num) < smallest) return `<${smallest}`
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: maxFractionDigits }).format(num)
}

export function formatCompact(value: bigint | undefined, decimals = 18): string {
  if (value === undefined) return '—'
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(
    Number(formatUnits(value, decimals)),
  )
}

export function formatPercent(value: number | undefined, digits = 2): string {
  if (value === undefined || !Number.isFinite(value)) return '—'
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(value)}%`
}

export function parseAmount(input: string, decimals: number): bigint | undefined {
  const trimmed = input.trim()
  if (trimmed === '' || trimmed === '.' || !/^\d*\.?\d*$/.test(trimmed)) return undefined
  try {
    return parseUnits(trimmed, decimals)
  } catch {
    return undefined
  }
}

export function perDay(perSecond: bigint): bigint {
  return perSecond * SECONDS_PER_DAY
}

export function poolShare(allocPoint: bigint, totalAllocPoint: bigint): number {
  return totalAllocPoint === 0n ? 0 : Number((allocPoint * 10_000n) / totalAllocPoint) / 100
}

export function poolRewardPerSecond(rewardPerSecond: bigint, allocPoint: bigint, totalAllocPoint: bigint): bigint {
  return totalAllocPoint === 0n ? 0n : (rewardPerSecond * allocPoint) / totalAllocPoint
}

/** APR in percent; only meaningful when stake and reward are the same token. */
export function aprPercent(poolRewardPerSec: bigint, totalStaked: bigint): number | undefined {
  if (totalStaked === 0n) return undefined
  return Number((poolRewardPerSec * SECONDS_PER_YEAR * 10_000n) / totalStaked) / 100
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export function errorMessage(error: unknown): string {
  if (error instanceof BaseError) {
    if (/user rejected|user denied/i.test(error.shortMessage)) return 'Transaction rejected in wallet.'
    return error.shortMessage
  }
  if (error instanceof Error) return error.message
  return 'Something went wrong.'
}
