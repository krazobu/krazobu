// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Test/dev-only BEP-20 token with an open faucet. Never deploy to mainnet.
contract MockBEP20 is ERC20 {
    uint8 private immutable _decimals;

    constructor(string memory name_, string memory symbol_, uint8 decimals_) ERC20(name_, symbol_) {
        _decimals = decimals_;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function getOwner() external pure returns (address) {
        return address(0);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
