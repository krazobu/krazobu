# Shinkanshen

**Token Staking & Yield Farming DApp for the BNB Smart Chain (BEP-20) ecosystem.**

Stake SHK or PancakeSwap LP tokens into Shinkanshen pools and earn SHK every second. Rewards are minted on demand by the farm, split across pools by allocation points, and hard-capped at 100M SHK.

```
contracts/   Solidity (0.8.34) · Hardhat 3 · OpenZeppelin 5 · Ignition deployments · node:test + viem tests
web/         React 19 · Vite 8 · wagmi 3 · viem · TanStack Query · Tailwind 4 — marketing site (/) + staking app (/app)
scripts/     dev-local.mjs — one-command local stack (Hardhat node → deploy → Vite)
```

## Website

The web app serves two routes from a single bundle:

- `/` — the landing site: animated hero, features, how-it-works, tokenomics, a live "departures board" of pools, FAQ. Live numbers are read straight from the farm on the selected network.
- `/app` — the staking dashboard (connect wallet, stake / unstake / harvest).

Routing is client-side, so static hosts need an SPA fallback that rewrites unknown paths to `index.html` (Netlify `_redirects`, Vercel `rewrites`; Cloudflare Pages does this automatically). Fonts are self-hosted via `@fontsource-variable`, and all animations respect `prefers-reduced-motion`.

## Contracts

| Contract | Purpose |
| --- | --- |
| `ShinkanshenToken` (SHK) | BEP-20 reward token: ERC-20 + `getOwner()`, EIP-2612 permit, burnable, `Ownable2Step`. Minting is restricted to owner-approved minters and capped at `MAX_SUPPLY = 100,000,000 SHK`. |
| `ShinkanshenFarm` | MasterChef-style farm. Owner adds BEP-20 stake tokens as pools with allocation points; users `deposit` / `withdraw` / `harvest` / `emergencyWithdraw`. Rewards accrue per second and are minted on pool updates. |
| `mocks/MockBEP20`, `mocks/MockFeeOnTransferToken` | Local-development and test tokens with an open `mint` faucet. **Never deploy on BSC.** |

Design notes for the farm:

- **Time based**, not block based, so emissions are predictable on BSC's ~3 s blocks (`rewardPerSecond`, bounded by `MAX_REWARD_PER_SECOND`).
- Each pool tracks `totalStaked` instead of `balanceOf(this)`, so SHK can be both a stake token (pool 0) and the reward token, and stray transfers cannot distort accounting.
- Deposits credit the amount actually received, so fee-on-transfer tokens are safe.
- `add` / `set` / `setRewardPerSecond` settle all pools first, so parameter changes only apply going forward; setting a pool's allocation to 0 retires it while leaving stakes withdrawable.
- Emissions stop cleanly at `MAX_SUPPLY`; when nothing is mintable, rewards are simply 0 and deposits/withdrawals keep working.
- `emergencyWithdraw` never touches reward accounting, `recoverERC20` can never move stake or reward tokens, and all user entry points are `nonReentrant`.

## Quick start (local)

Requirements: Node ≥ 22 and pnpm 10.

```bash
pnpm install
pnpm test          # contract test suite (22 tests)
pnpm dev:local     # Hardhat node (3 s blocks) → deploy ShinkanshenLocal → Vite on http://localhost:5173
```

`pnpm dev:local` deploys SHK, the farm and two mock pools (Cake-LP and USDT), then writes the addresses to `web/src/contracts/deployments.json`. To use the UI with MetaMask:

1. Add the Hardhat network (RPC `http://127.0.0.1:8545`, chain id `31337`) — the in-app network selector can prompt this for you.
2. Import Hardhat account #0 (private key printed by the node; it holds 10M SHK and the mock tokens), or use the per-pool **Faucet** button to mint test tokens.
3. Pick a pool, approve, stake, and watch rewards accrue every block.

Run the pieces separately if you prefer: `pnpm chain`, then `pnpm deploy:local`, then `pnpm dev`.

## Deploying to BNB Smart Chain

Secrets live in the Hardhat keystore, never in files:

```bash
cd contracts
npx hardhat keystore set BSC_PRIVATE_KEY      # deployer / farm owner
npx hardhat keystore set ETHERSCAN_API_KEY    # Etherscan v2 key (covers BscScan) — only needed for verification
```

Tune `ignition/parameters/bscTestnet.json` / `bsc.json` (`initialSupply`, `rewardPerSecond`, `startTime`, `shkAllocPoint`; bigints are strings with an `n` suffix), then:

```bash
pnpm deploy:bscTestnet   # or pnpm deploy:bsc
npx hardhat verify --network bscTestnet <address> <constructor args…>
```

Deployment writes the new addresses into `web/src/contracts/deployments.json`, and the app automatically lists the network. Add farming pools afterwards from the owner account, e.g. a PancakeSwap SHK/BNB LP token: `farm.add(300, <lpTokenAddress>)`.

RPC endpoints default to public BNB Chain nodes; override with `BSC_RPC_URL` / `BSC_TESTNET_RPC_URL` (contracts) and `VITE_BSC_RPC_URL` / `VITE_BSC_TESTNET_RPC_URL` (web). See the `.env.example` files.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm test` | Hardhat test suite (`contracts/test/*.ts`) |
| `pnpm typecheck` | `hardhat build && tsc --noEmit` for contracts, `tsc -b` for web |
| `pnpm build` | Compile contracts and build the web app |
| `pnpm export:web` | Re-export ABIs + deployment addresses into `web/src/contracts/` |
| `pnpm --filter @shinkanshen/web lint` | oxlint |

## Security

The contracts are tested but **unaudited**. Mock tokens have an open faucet and must never be deployed to a public network. Review parameters (`rewardPerSecond`, allocation points, `startTime`) carefully before a mainnet deployment and consider transferring ownership of the token and farm to a multisig (`transferOwnership` + `acceptOwnership`).

## License

[MIT](./LICENSE)
