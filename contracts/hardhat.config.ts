import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable, defineConfig } from "hardhat/config";

// BNB Smart Chain supports the Cancun EVM (Haber hard fork), so we pin it
// rather than relying on the compiler default, which may target newer forks.
const solcSettings = {
  evmVersion: "cancun",
  optimizer: { enabled: true, runs: 200 },
};

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: { version: "0.8.34", settings: solcSettings },
      production: { version: "0.8.34", settings: solcSettings },
    },
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
      chainType: "l1",
    },
    // Standalone dev node (`pnpm chain`): mines a block every 3s so rewards
    // visibly accrue in the UI without waiting for a transaction.
    localnode: {
      type: "edr-simulated",
      chainType: "l1",
      chainId: 31337,
      mining: { auto: true, interval: 3000 },
    },
    localhost: {
      type: "http",
      chainType: "l1",
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    bscTestnet: {
      type: "http",
      chainType: "generic",
      chainId: 97,
      url: process.env.BSC_TESTNET_RPC_URL ?? "https://bsc-testnet-rpc.publicnode.com",
      accounts: [configVariable("BSC_PRIVATE_KEY")],
    },
    bsc: {
      type: "http",
      chainType: "generic",
      chainId: 56,
      url: process.env.BSC_RPC_URL ?? "https://bsc-rpc.publicnode.com",
      accounts: [configVariable("BSC_PRIVATE_KEY")],
    },
  },
  verify: {
    etherscan: {
      apiKey: configVariable("ETHERSCAN_API_KEY"),
    },
  },
});
