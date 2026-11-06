import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { getAddress, parseEther } from "viem";

const MAX_SUPPLY = parseEther("100000000");
const INITIAL_SUPPLY = parseEther("10000000");

describe("ShinkanshenToken", async function () {
  const { viem, networkHelpers } = await network.create();
  const [owner, alice, bob] = await viem.getWalletClients();

  async function deployToken() {
    const token = await viem.deployContract("ShinkanshenToken", [owner.account.address, INITIAL_SUPPLY]);
    return { token };
  }

  it("has BEP-20 metadata and mints the initial supply to the owner", async function () {
    const { token } = await networkHelpers.loadFixture(deployToken);

    assert.equal(await token.read.name(), "Shinkanshen");
    assert.equal(await token.read.symbol(), "SHK");
    assert.equal(await token.read.decimals(), 18);
    assert.equal(await token.read.getOwner(), getAddress(owner.account.address));
    assert.equal(await token.read.owner(), getAddress(owner.account.address));
    assert.equal(await token.read.MAX_SUPPLY(), MAX_SUPPLY);
    assert.equal(await token.read.totalSupply(), INITIAL_SUPPLY);
    assert.equal(await token.read.balanceOf([owner.account.address]), INITIAL_SUPPLY);
    assert.equal(await token.read.remainingMintableSupply(), MAX_SUPPLY - INITIAL_SUPPLY);
  });

  it("rejects an initial supply above the cap", async function () {
    await assert.rejects(viem.deployContract("ShinkanshenToken", [owner.account.address, MAX_SUPPLY + 1n]));
  });

  it("only lets the owner manage minters", async function () {
    const { token } = await networkHelpers.loadFixture(deployToken);

    await viem.assertions.revertWithCustomErrorWithArgs(
      token.write.setMinter([alice.account.address, true], { account: alice.account }),
      token,
      "OwnableUnauthorizedAccount",
      [getAddress(alice.account.address)],
    );
    await viem.assertions.revertWithCustomError(
      token.write.setMinter(["0x0000000000000000000000000000000000000000", true]),
      token,
      "ZeroAddress",
    );

    await viem.assertions.emitWithArgs(token.write.setMinter([alice.account.address, true]), token, "MinterUpdated", [
      getAddress(alice.account.address),
      true,
    ]);
    assert.equal(await token.read.isMinter([alice.account.address]), true);

    await token.write.setMinter([alice.account.address, false]);
    assert.equal(await token.read.isMinter([alice.account.address]), false);
  });

  it("only lets minters mint, and never beyond MAX_SUPPLY", async function () {
    const { token } = await networkHelpers.loadFixture(deployToken);

    await viem.assertions.revertWithCustomErrorWithArgs(
      token.write.mint([bob.account.address, 1n], { account: bob.account }),
      token,
      "NotMinter",
      [getAddress(bob.account.address)],
    );

    await token.write.setMinter([alice.account.address, true]);
    await token.write.mint([bob.account.address, parseEther("5")], { account: alice.account });
    assert.equal(await token.read.balanceOf([bob.account.address]), parseEther("5"));

    const remaining = await token.read.remainingMintableSupply();
    await viem.assertions.revertWithCustomErrorWithArgs(
      token.write.mint([bob.account.address, remaining + 1n], { account: alice.account }),
      token,
      "MaxSupplyExceeded",
      [remaining + 1n, remaining],
    );

    await token.write.mint([bob.account.address, remaining], { account: alice.account });
    assert.equal(await token.read.totalSupply(), MAX_SUPPLY);
    assert.equal(await token.read.remainingMintableSupply(), 0n);
  });

  it("supports burning, which frees up mintable supply", async function () {
    const { token } = await networkHelpers.loadFixture(deployToken);

    await token.write.burn([parseEther("100")]);
    assert.equal(await token.read.totalSupply(), INITIAL_SUPPLY - parseEther("100"));
    assert.equal(await token.read.remainingMintableSupply(), MAX_SUPPLY - INITIAL_SUPPLY + parseEther("100"));
  });

  it("transfers ownership in two steps", async function () {
    const { token } = await networkHelpers.loadFixture(deployToken);

    await token.write.transferOwnership([alice.account.address]);
    assert.equal(await token.read.getOwner(), getAddress(owner.account.address));
    assert.equal(await token.read.pendingOwner(), getAddress(alice.account.address));

    await token.write.acceptOwnership({ account: alice.account });
    assert.equal(await token.read.getOwner(), getAddress(alice.account.address));
  });
});
