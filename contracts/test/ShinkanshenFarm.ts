import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { getAddress, maxUint256, parseEther, zeroAddress } from "viem";

const MAX_SUPPLY = parseEther("100000000");
const INITIAL_SUPPLY = parseEther("10000000");
const REWARD_PER_SECOND = parseEther("1");
const SHK_PID = 0n; // allocPoint 100 -> 25% of emissions
const LP_PID = 1n; // allocPoint 300 -> 75% of emissions

describe("ShinkanshenFarm", async function () {
  const { viem, networkHelpers } = await network.create();
  const { time } = networkHelpers;
  const [owner, alice, bob] = await viem.getWalletClients();
  const ALICE = getAddress(alice.account.address);
  const BOB = getAddress(bob.account.address);

  async function deployFarm() {
    const token = await viem.deployContract("ShinkanshenToken", [owner.account.address, INITIAL_SUPPLY]);
    const farm = await viem.deployContract("ShinkanshenFarm", [
      token.address,
      REWARD_PER_SECOND,
      0n,
      owner.account.address,
    ]);
    await token.write.setMinter([farm.address, true]);

    const lp = await viem.deployContract("MockBEP20", ["Shinkanshen-BNB Cake-LP", "Cake-LP", 18]);
    await farm.write.add([100n, token.address]);
    await farm.write.add([300n, lp.address]);

    for (const user of [alice, bob]) {
      await lp.write.mint([user.account.address, parseEther("1000")]);
      await lp.write.approve([farm.address, maxUint256], { account: user.account });
      await token.write.transfer([user.account.address, parseEther("1000")]);
      await token.write.approve([farm.address, maxUint256], { account: user.account });
    }
    return { token, farm, lp };
  }

  describe("configuration", function () {
    it("initialises parameters and pools", async function () {
      const { token, farm, lp } = await networkHelpers.loadFixture(deployFarm);

      assert.equal(await farm.read.rewardToken(), getAddress(token.address));
      assert.equal(await farm.read.rewardPerSecond(), REWARD_PER_SECOND);
      assert.equal(await farm.read.totalAllocPoint(), 400n);
      assert.equal(await farm.read.poolLength(), 2n);
      assert.equal(await farm.read.owner(), getAddress(owner.account.address));
      assert.ok((await farm.read.startTime()) <= BigInt(await time.latest()));

      const pools = await farm.read.pools();
      assert.equal(pools.length, 2);
      assert.equal(pools[0].stakeToken, getAddress(token.address));
      assert.equal(pools[0].allocPoint, 100n);
      assert.equal(pools[1].stakeToken, getAddress(lp.address));
      assert.equal(pools[1].allocPoint, 300n);
      assert.equal(pools[1].totalStaked, 0n);
      assert.equal(await farm.read.isPoolToken([lp.address]), true);
    });

    it("validates constructor arguments", async function () {
      const { token } = await networkHelpers.loadFixture(deployFarm);

      await assert.rejects(
        viem.deployContract("ShinkanshenFarm", [zeroAddress, REWARD_PER_SECOND, 0n, owner.account.address]),
      );
      await assert.rejects(
        viem.deployContract("ShinkanshenFarm", [
          token.address,
          parseEther("1000") + 1n,
          0n,
          owner.account.address,
        ]),
      );

      const future = BigInt((await time.latest()) + 5_000);
      const farm = await viem.deployContract("ShinkanshenFarm", [token.address, REWARD_PER_SECOND, future, owner.account.address]);
      assert.equal(await farm.read.startTime(), future);
    });

    it("restricts pool management to the owner and validates inputs", async function () {
      const { token, farm, lp } = await networkHelpers.loadFixture(deployFarm);

      await viem.assertions.revertWithCustomErrorWithArgs(
        farm.write.add([100n, lp.address], { account: alice.account }),
        farm,
        "OwnableUnauthorizedAccount",
        [ALICE],
      );
      await viem.assertions.revertWithCustomErrorWithArgs(farm.write.add([100n, lp.address]), farm, "DuplicatePoolToken", [
        getAddress(lp.address),
      ]);
      await viem.assertions.revertWithCustomError(farm.write.add([100n, zeroAddress]), farm, "ZeroAddress");
      await viem.assertions.revertWithCustomErrorWithArgs(farm.write.set([5n, 100n]), farm, "InvalidPool", [5n]);
      await viem.assertions.revertWithCustomError(
        farm.write.set([LP_PID, 100n], { account: alice.account }),
        farm,
        "OwnableUnauthorizedAccount",
      );
      await viem.assertions.revertWithCustomErrorWithArgs(
        farm.write.setRewardPerSecond([parseEther("1000") + 1n]),
        farm,
        "RewardRateTooHigh",
        [parseEther("1000") + 1n, parseEther("1000")],
      );

      await viem.assertions.emitWithArgs(farm.write.set([LP_PID, 100n]), farm, "PoolUpdated", [LP_PID, 100n]);
      assert.equal(await farm.read.totalAllocPoint(), 200n);

      await viem.assertions.emitWithArgs(
        farm.write.setRewardPerSecond([parseEther("2")]),
        farm,
        "RewardPerSecondUpdated",
        [REWARD_PER_SECOND, parseEther("2")],
      );
      assert.equal(await farm.read.rewardPerSecond(), parseEther("2"));

      const other = await viem.deployContract("MockBEP20", ["Other", "OTH", 18]);
      await viem.assertions.emitWithArgs(farm.write.add([50n, other.address]), farm, "PoolAdded", [
        2n,
        getAddress(other.address),
        50n,
      ]);
      assert.equal(await farm.read.totalAllocPoint(), 250n);
      assert.equal(await farm.read.poolLength(), 3n);
      assert.equal(await farm.read.isPoolToken([token.address]), true);
    });
  });

  describe("staking", function () {
    it("transfers the stake in and tracks accounting", async function () {
      const { farm, lp } = await networkHelpers.loadFixture(deployFarm);

      await viem.assertions.revertWithCustomError(farm.write.deposit([LP_PID, 0n], { account: alice.account }), farm, "ZeroAmount");
      await viem.assertions.revertWithCustomErrorWithArgs(
        farm.write.deposit([9n, 1n], { account: alice.account }),
        farm,
        "InvalidPool",
        [9n],
      );

      await viem.assertions.emitWithArgs(
        farm.write.deposit([LP_PID, parseEther("100")], { account: alice.account }),
        farm,
        "Deposit",
        [ALICE, LP_PID, parseEther("100")],
      );

      assert.equal(await lp.read.balanceOf([farm.address]), parseEther("100"));
      assert.equal(await lp.read.balanceOf([alice.account.address]), parseEther("900"));
      assert.deepEqual(await farm.read.userInfo([LP_PID, alice.account.address]), [parseEther("100"), 0n]);
      assert.equal((await farm.read.pools())[1].totalStaked, parseEther("100"));
    });

    it("accrues rewards per second pro rata to allocation points", async function () {
      const { token, farm } = await networkHelpers.loadFixture(deployFarm);
      const t0 = await time.latest();

      await time.setNextBlockTimestamp(t0 + 10);
      await farm.write.deposit([LP_PID, parseEther("100")], { account: alice.account });

      await time.increaseTo(t0 + 110);
      // 100 s * 1 SHK/s * 300/400
      assert.equal(await farm.read.pendingReward([LP_PID, alice.account.address]), parseEther("75"));
      assert.equal(await farm.read.pendingReward([SHK_PID, alice.account.address]), 0n);

      await time.setNextBlockTimestamp(t0 + 210);
      await viem.assertions.emitWithArgs(farm.write.harvest([LP_PID], { account: alice.account }), farm, "Harvest", [
        ALICE,
        LP_PID,
        parseEther("150"),
      ]);
      assert.equal(await token.read.balanceOf([alice.account.address]), parseEther("1150"));
      assert.equal(await farm.read.pendingReward([LP_PID, alice.account.address]), 0n);
      assert.equal(await token.read.totalSupply(), INITIAL_SUPPLY + parseEther("150"));
    });

    it("splits pool rewards between stakers by stake size", async function () {
      const { token, farm, lp } = await networkHelpers.loadFixture(deployFarm);
      const t0 = await time.latest();

      await time.setNextBlockTimestamp(t0 + 10);
      await farm.write.deposit([LP_PID, parseEther("100")], { account: alice.account });
      await time.setNextBlockTimestamp(t0 + 110);
      await farm.write.deposit([LP_PID, parseEther("300")], { account: bob.account });

      await time.increaseTo(t0 + 210);
      // alice: 75 (alone) + 25% of 75; bob: 75% of 75
      assert.equal(await farm.read.pendingReward([LP_PID, alice.account.address]), parseEther("93.75"));
      assert.equal(await farm.read.pendingReward([LP_PID, bob.account.address]), parseEther("56.25"));

      await time.setNextBlockTimestamp(t0 + 310);
      const withdrawal = farm.write.withdraw([LP_PID, parseEther("100")], { account: alice.account });
      await viem.assertions.emitWithArgs(withdrawal, farm, "Harvest", [ALICE, LP_PID, parseEther("112.5")]);
      await viem.assertions.emitWithArgs(withdrawal, farm, "Withdraw", [ALICE, LP_PID, parseEther("100")]);
      assert.equal(await lp.read.balanceOf([alice.account.address]), parseEther("1000"));
      assert.equal(await token.read.balanceOf([alice.account.address]), parseEther("1112.5"));

      await time.setNextBlockTimestamp(t0 + 410);
      // bob: 56.25 + 75% of 75 + 100% of 75
      await viem.assertions.emitWithArgs(farm.write.harvest([LP_PID], { account: bob.account }), farm, "Harvest", [
        BOB,
        LP_PID,
        parseEther("187.5"),
      ]);

      // 400 s of LP-pool emissions were fully distributed with no dust left behind.
      assert.equal(await token.read.totalSupply(), INITIAL_SUPPLY + parseEther("300"));
      assert.equal(await token.read.balanceOf([farm.address]), 0n);
    });

    it("stakes SHK itself and keeps the reward reserve separate from stakes", async function () {
      const { token, farm } = await networkHelpers.loadFixture(deployFarm);
      const t0 = await time.latest();

      await time.setNextBlockTimestamp(t0 + 10);
      await farm.write.deposit([SHK_PID, parseEther("1000")], { account: alice.account });
      assert.equal(await token.read.balanceOf([alice.account.address]), 0n);

      await time.increaseTo(t0 + 110);
      // 100 s * 1 SHK/s * 100/400
      assert.equal(await farm.read.pendingReward([SHK_PID, alice.account.address]), parseEther("25"));

      // Rewards sitting in the farm cannot be withdrawn as stake.
      await viem.assertions.revertWithCustomErrorWithArgs(
        farm.write.withdraw([SHK_PID, 1n], { account: bob.account }),
        farm,
        "InsufficientStake",
        [1n, 0n],
      );
      await viem.assertions.revertWithCustomErrorWithArgs(
        farm.write.withdraw([SHK_PID, parseEther("1000") + 1n], { account: alice.account }),
        farm,
        "InsufficientStake",
        [parseEther("1000") + 1n, parseEther("1000")],
      );

      await time.setNextBlockTimestamp(t0 + 210);
      const withdrawal = farm.write.withdraw([SHK_PID, parseEther("1000")], { account: alice.account });
      await viem.assertions.emitWithArgs(withdrawal, farm, "Harvest", [ALICE, SHK_PID, parseEther("50")]);
      await viem.assertions.emitWithArgs(withdrawal, farm, "Withdraw", [ALICE, SHK_PID, parseEther("1000")]);
      assert.equal(await token.read.balanceOf([alice.account.address]), parseEther("1050"));
      assert.equal(await token.read.balanceOf([farm.address]), 0n);
    });

    it("pays pending rewards on deposit and harvest", async function () {
      const { token, farm } = await networkHelpers.loadFixture(deployFarm);
      const t0 = await time.latest();

      await time.setNextBlockTimestamp(t0 + 10);
      await farm.write.deposit([LP_PID, parseEther("100")], { account: alice.account });

      await time.setNextBlockTimestamp(t0 + 110);
      const topUp = farm.write.deposit([LP_PID, parseEther("100")], { account: alice.account });
      await viem.assertions.emitWithArgs(topUp, farm, "Harvest", [ALICE, LP_PID, parseEther("75")]);
      await viem.assertions.emitWithArgs(topUp, farm, "Deposit", [ALICE, LP_PID, parseEther("100")]);
      assert.equal((await farm.read.userInfo([LP_PID, alice.account.address]))[0], parseEther("200"));

      await time.setNextBlockTimestamp(t0 + 210);
      await viem.assertions.emitWithArgs(farm.write.harvest([LP_PID], { account: alice.account }), farm, "Harvest", [
        ALICE,
        LP_PID,
        parseEther("75"),
      ]);
      await time.setNextBlockTimestamp(t0 + 211);
      await viem.assertions.emitWithArgs(farm.write.harvest([LP_PID], { account: alice.account }), farm, "Harvest", [
        ALICE,
        LP_PID,
        parseEther("0.75"),
      ]);
      assert.equal(await token.read.balanceOf([alice.account.address]), parseEther("1150.75"));

      // Harvesting with no stake is a harmless no-op.
      await farm.write.harvest([LP_PID], { account: bob.account });
      assert.equal(await token.read.balanceOf([bob.account.address]), parseEther("1000"));
    });

    it("validates withdrawals", async function () {
      const { farm } = await networkHelpers.loadFixture(deployFarm);
      await farm.write.deposit([LP_PID, parseEther("100")], { account: alice.account });

      await viem.assertions.revertWithCustomError(farm.write.withdraw([LP_PID, 0n], { account: alice.account }), farm, "ZeroAmount");
      await viem.assertions.revertWithCustomErrorWithArgs(
        farm.write.withdraw([LP_PID, parseEther("101")], { account: alice.account }),
        farm,
        "InsufficientStake",
        [parseEther("101"), parseEther("100")],
      );
      await viem.assertions.revertWithCustomErrorWithArgs(
        farm.write.withdraw([7n, 1n], { account: alice.account }),
        farm,
        "InvalidPool",
        [7n],
      );
      await assert.rejects(farm.read.pendingReward([7n, alice.account.address]));
    });

    it("emergencyWithdraw returns the stake and forfeits rewards", async function () {
      const { token, farm, lp } = await networkHelpers.loadFixture(deployFarm);
      const t0 = await time.latest();

      await time.setNextBlockTimestamp(t0 + 10);
      await farm.write.deposit([LP_PID, parseEther("100")], { account: alice.account });
      await time.increaseTo(t0 + 110);
      assert.equal(await farm.read.pendingReward([LP_PID, alice.account.address]), parseEther("75"));

      await viem.assertions.emitWithArgs(
        farm.write.emergencyWithdraw([LP_PID], { account: alice.account }),
        farm,
        "EmergencyWithdraw",
        [ALICE, LP_PID, parseEther("100")],
      );
      assert.equal(await lp.read.balanceOf([alice.account.address]), parseEther("1000"));
      assert.equal(await token.read.balanceOf([alice.account.address]), parseEther("1000"));
      assert.deepEqual(await farm.read.userInfo([LP_PID, alice.account.address]), [0n, 0n]);
      assert.equal(await farm.read.pendingReward([LP_PID, alice.account.address]), 0n);
      assert.equal((await farm.read.pools())[1].totalStaked, 0n);

      await viem.assertions.revertWithCustomError(
        farm.write.emergencyWithdraw([LP_PID], { account: alice.account }),
        farm,
        "ZeroAmount",
      );
    });
  });

  describe("emission schedule", function () {
    it("does not accrue rewards before startTime", async function () {
      const { token, lp } = await networkHelpers.loadFixture(deployFarm);
      const t0 = await time.latest();
      const startTime = BigInt(t0 + 1_000);

      const farm = await viem.deployContract("ShinkanshenFarm", [token.address, REWARD_PER_SECOND, startTime, owner.account.address]);
      await token.write.setMinter([farm.address, true]);
      await farm.write.add([100n, lp.address]);
      await lp.write.approve([farm.address, maxUint256], { account: alice.account });

      await time.setNextBlockTimestamp(t0 + 10);
      await farm.write.deposit([0n, parseEther("100")], { account: alice.account });

      await time.increaseTo(t0 + 500);
      assert.equal(await farm.read.pendingReward([0n, alice.account.address]), 0n);

      await time.increaseTo(t0 + 1_100);
      assert.equal(await farm.read.pendingReward([0n, alice.account.address]), parseEther("100"));
    });

    it("applies allocation and rate changes only going forward", async function () {
      const { farm, lp } = await networkHelpers.loadFixture(deployFarm);
      const t0 = await time.latest();

      await time.setNextBlockTimestamp(t0 + 10);
      await farm.write.deposit([LP_PID, parseEther("100")], { account: alice.account });

      // 75 accrued at 300/400, then the LP pool drops to 100/200.
      await time.setNextBlockTimestamp(t0 + 110);
      await farm.write.set([LP_PID, 100n]);
      await time.increaseTo(t0 + 210);
      assert.equal(await farm.read.pendingReward([LP_PID, alice.account.address]), parseEther("125"));

      // 50 more at 0.5 SHK/s, then the rate doubles to 1 SHK/s for the pool.
      await time.setNextBlockTimestamp(t0 + 310);
      await farm.write.setRewardPerSecond([parseEther("2")]);
      await time.increaseTo(t0 + 410);
      assert.equal(await farm.read.pendingReward([LP_PID, alice.account.address]), parseEther("275"));

      // Retiring the pool freezes rewards but leaves the stake withdrawable.
      await time.setNextBlockTimestamp(t0 + 510);
      await farm.write.set([LP_PID, 0n]);
      await time.increaseTo(t0 + 610);
      assert.equal(await farm.read.pendingReward([LP_PID, alice.account.address]), parseEther("375"));

      await farm.write.withdraw([LP_PID, parseEther("100")], { account: alice.account });
      assert.equal(await lp.read.balanceOf([alice.account.address]), parseEther("1000"));
    });

    it("stops emissions cleanly at MAX_SUPPLY", async function () {
      const token = await viem.deployContract("ShinkanshenToken", [owner.account.address, MAX_SUPPLY - parseEther("10")]);
      const farm = await viem.deployContract("ShinkanshenFarm", [token.address, REWARD_PER_SECOND, 0n, owner.account.address]);
      await token.write.setMinter([farm.address, true]);
      const lp = await viem.deployContract("MockBEP20", ["LP", "LP", 18]);
      await farm.write.add([100n, lp.address]);
      await lp.write.mint([alice.account.address, parseEther("100")]);
      await lp.write.approve([farm.address, maxUint256], { account: alice.account });
      const t0 = await time.latest();

      await time.setNextBlockTimestamp(t0 + 10);
      await farm.write.deposit([0n, parseEther("100")], { account: alice.account });

      await time.increaseTo(t0 + 110);
      assert.equal(await farm.read.pendingReward([0n, alice.account.address]), parseEther("10"));

      await time.setNextBlockTimestamp(t0 + 210);
      await viem.assertions.emitWithArgs(farm.write.harvest([0n], { account: alice.account }), farm, "Harvest", [
        ALICE,
        0n,
        parseEther("10"),
      ]);
      assert.equal(await token.read.totalSupply(), MAX_SUPPLY);

      await time.increaseTo(t0 + 310);
      assert.equal(await farm.read.pendingReward([0n, alice.account.address]), 0n);
      await farm.write.withdraw([0n, parseEther("100")], { account: alice.account });
      assert.equal(await lp.read.balanceOf([alice.account.address]), parseEther("100"));
    });
  });

  describe("token safety", function () {
    it("credits the amount actually received for fee-on-transfer tokens", async function () {
      const { farm } = await networkHelpers.loadFixture(deployFarm);
      const fee = await viem.deployContract("MockFeeOnTransferToken", [100n]); // 1 %
      await farm.write.add([100n, fee.address]);
      await fee.write.mint([alice.account.address, parseEther("1000")]);
      await fee.write.approve([farm.address, maxUint256], { account: alice.account });

      await viem.assertions.emitWithArgs(
        farm.write.deposit([2n, parseEther("100")], { account: alice.account }),
        farm,
        "Deposit",
        [ALICE, 2n, parseEther("99")],
      );
      assert.equal((await farm.read.userInfo([2n, alice.account.address]))[0], parseEther("99"));
      assert.equal((await farm.read.pools())[2].totalStaked, parseEther("99"));
      assert.equal(await fee.read.balanceOf([farm.address]), parseEther("99"));

      await farm.write.withdraw([2n, parseEther("99")], { account: alice.account });
      assert.equal(await fee.read.balanceOf([farm.address]), 0n);
      assert.equal(await fee.read.balanceOf([alice.account.address]), parseEther("998.01"));
    });

    it("recovers stray tokens but never stake or reward tokens", async function () {
      const { token, farm, lp } = await networkHelpers.loadFixture(deployFarm);
      const stray = await viem.deployContract("MockBEP20", ["Stray", "STR", 6]);
      await stray.write.mint([farm.address, 5_000_000n]);

      await viem.assertions.revertWithCustomError(
        farm.write.recoverERC20([stray.address, owner.account.address, 5_000_000n], { account: alice.account }),
        farm,
        "OwnableUnauthorizedAccount",
      );
      await viem.assertions.revertWithCustomErrorWithArgs(
        farm.write.recoverERC20([lp.address, owner.account.address, 1n]),
        farm,
        "ProtectedToken",
        [getAddress(lp.address)],
      );
      await viem.assertions.revertWithCustomErrorWithArgs(
        farm.write.recoverERC20([token.address, owner.account.address, 1n]),
        farm,
        "ProtectedToken",
        [getAddress(token.address)],
      );
      await viem.assertions.revertWithCustomError(
        farm.write.recoverERC20([stray.address, zeroAddress, 1n]),
        farm,
        "ZeroAddress",
      );

      await viem.assertions.emitWithArgs(
        farm.write.recoverERC20([stray.address, owner.account.address, 5_000_000n]),
        farm,
        "Recovered",
        [getAddress(stray.address), getAddress(owner.account.address), 5_000_000n],
      );
      assert.equal(await stray.read.balanceOf([owner.account.address]), 5_000_000n);
    });

    it("lets anyone settle pools", async function () {
      const { farm } = await networkHelpers.loadFixture(deployFarm);
      await farm.write.massUpdatePools({ account: alice.account });
      await farm.write.updatePool([LP_PID], { account: bob.account });
      await viem.assertions.revertWithCustomErrorWithArgs(farm.write.updatePool([9n]), farm, "InvalidPool", [9n]);
    });
  });
});
