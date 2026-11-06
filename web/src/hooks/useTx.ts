import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'

export type TxStatus = 'idle' | 'signing' | 'confirming' | 'confirmed' | 'error'

/** Wraps write + receipt tracking and refreshes all on-chain reads once a tx lands. */
export function useTx() {
  const queryClient = useQueryClient()
  const write = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash: write.data })

  useEffect(() => {
    if (receipt.isSuccess) void queryClient.invalidateQueries()
  }, [receipt.isSuccess, queryClient])

  const error = write.error ?? receipt.error ?? null
  let status: TxStatus = 'idle'
  if (write.isPending) status = 'signing'
  else if (receipt.isLoading) status = 'confirming'
  else if (receipt.isSuccess) status = 'confirmed'
  else if (error) status = 'error'

  return { send: write.mutate, hash: write.data, status, error, reset: write.reset, busy: status === 'signing' || status === 'confirming' }
}
