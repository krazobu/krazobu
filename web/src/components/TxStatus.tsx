import type { Chain } from 'viem'

import { errorMessage } from '../lib/format'
import type { TxStatus as Status } from '../hooks/useTx'

export function TxStatus({ status, hash, error, chain }: { status: Status; hash?: `0x${string}`; error: unknown; chain?: Chain }) {
  if (status === 'idle') return null
  const explorer = chain?.blockExplorers?.default.url
  const link = hash && explorer ? `${explorer}/tx/${hash}` : undefined

  const text = {
    signing: 'Confirm in your wallet…',
    confirming: 'Transaction submitted, waiting for confirmation…',
    confirmed: 'Transaction confirmed.',
    error: errorMessage(error),
  }[status]

  const tone = status === 'error' ? 'text-rose-400' : status === 'confirmed' ? 'text-emerald-300' : 'text-sky-300'
  return (
    <p className={`flex items-center gap-2 text-xs ${tone}`} role="status">
      {(status === 'signing' || status === 'confirming') && (
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      <span className="break-all">{text}</span>
      {link && (
        <a className="underline decoration-dotted underline-offset-2" href={link} target="_blank" rel="noreferrer">
          View
        </a>
      )}
    </p>
  )
}
