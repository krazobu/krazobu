import type { Address } from 'viem'
import deploymentsJson from './deployments.json'

export { mockBep20Abi, shinkanshenFarmAbi, shinkanshenTokenAbi } from './abis'

export type Deployment = { token: Address; farm: Address }

const deployments = deploymentsJson as Record<string, Deployment>

export function getDeployment(chainId: number | undefined): Deployment | undefined {
  return chainId === undefined ? undefined : deployments[String(chainId)]
}

export const deployedChainIds = Object.keys(deployments).map(Number)
