import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

/**
 * Local development deployment: the production setup plus mock BEP-20 tokens
 * (a PancakeSwap-style LP token and USDT) with their own farming pools. Mock
 * tokens expose an open `mint` faucet, so never deploy this module on BSC.
 */
export default buildModule("ShinkanshenLocal", (m) => {
  const deployer = m.getAccount(0);
  const rewardPerSecond = m.getParameter("rewardPerSecond", parseEther("1"));

  const token = m.contract("ShinkanshenToken", [deployer, parseEther("10000000")]);
  const farm = m.contract("ShinkanshenFarm", [token, rewardPerSecond, 0n, deployer]);
  const lpToken = m.contract("MockBEP20", ["Shinkanshen-BNB Cake-LP", "Cake-LP", 18], { id: "ShkBnbLp" });
  const usdt = m.contract("MockBEP20", ["Tether USD", "USDT", 18], { id: "Usdt" });

  const grantMinter = m.call(token, "setMinter", [farm, true]);
  const addShkPool = m.call(farm, "add", [100n, token], { id: "addShkPool", after: [grantMinter] });
  const addLpPool = m.call(farm, "add", [300n, lpToken], { id: "addLpPool", after: [addShkPool] });
  m.call(farm, "add", [100n, usdt], { id: "addUsdtPool", after: [addLpPool] });

  m.call(lpToken, "mint", [deployer, parseEther("1000")], { id: "mintLp" });
  m.call(usdt, "mint", [deployer, parseEther("10000")], { id: "mintUsdt" });

  return { token, farm, lpToken, usdt };
});
