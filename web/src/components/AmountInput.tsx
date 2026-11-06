import { formatUnits } from 'viem'

import { formatAmount } from '../lib/format'

type Props = {
  value: string
  onChange: (value: string) => void
  max: bigint | undefined
  decimals: number
  symbol: string
  maxLabel: string
  disabled?: boolean
}

export function AmountInput({ value, onChange, max, decimals, symbol, maxLabel, disabled }: Props) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Amount</span>
        <button
          type="button"
          className="hover:text-slate-200 disabled:opacity-50"
          disabled={max === undefined || disabled}
          onClick={() => max !== undefined && onChange(formatUnits(max, decimals))}
        >
          {maxLabel}: {formatAmount(max, decimals)} {symbol}
        </button>
      </div>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.0"
          className="input-field pr-16"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value.replace(',', '.'))}
        />
        <button
          type="button"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg bg-white/10 px-2 py-1 text-xs font-semibold text-emerald-300 hover:bg-white/15 disabled:opacity-50"
          disabled={max === undefined || disabled}
          onClick={() => max !== undefined && onChange(formatUnits(max, decimals))}
        >
          MAX
        </button>
      </div>
    </div>
  )
}
