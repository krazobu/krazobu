import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

/**
 * Production deployment: SHK token + farm, with SHK single-asset staking as
 * pool 0. LP pools are added afterwards via `farm.add(allocPoint, lpToken)`.
 */
export default buildModule("Shinkanshen", (m) => {
  const deployer = m.getAccount(0);
  const initialSupply = m.getParameter("initialSupply", parseEther("10000000"));
  const rewardPerSecond = m.getParameter("rewardPerSecond", parseEther("0.5"));
  const startTime = m.getParameter("startTime", 0n); // 0 = start at deployment
  const shkAllocPoint = m.getParameter("shkAllocPoint", 100n);

  const token = m.contract("ShinkanshenToken", [deployer, initialSupply]);
  const farm = m.contract("ShinkanshenFarm", [token, rewardPerSecond, startTime, deployer]);

  const grantMinter = m.call(token, "setMinter", [farm, true]);
  m.call(farm, "add", [shkAllocPoint, token], { id: "addShkPool", after: [grantMinter] });

  return { token, farm };
});
