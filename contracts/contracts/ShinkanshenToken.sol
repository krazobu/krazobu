// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

/// @title Shinkanshen Token (SHK)
/// @notice BEP-20 reward token of the Shinkanshen protocol on BNB Smart Chain.
///         Implements the full BEP-20 interface (ERC-20 + `getOwner()`), plus
///         EIP-2612 permits and burning. New supply can only be minted by
///         authorised minters (the farm) and never exceeds `MAX_SUPPLY`.
contract ShinkanshenToken is ERC20, ERC20Burnable, ERC20Permit, Ownable2Step {
    uint256 public constant MAX_SUPPLY = 100_000_000e18;

    mapping(address minter => bool allowed) public isMinter;

    event MinterUpdated(address indexed minter, bool allowed);

    error NotMinter(address caller);
    error MaxSupplyExceeded(uint256 requested, uint256 available);
    error ZeroAddress();

    constructor(address initialOwner, uint256 initialSupply)
        ERC20("Shinkanshen", "SHK")
        ERC20Permit("Shinkanshen")
        Ownable(initialOwner)
    {
        if (initialSupply > MAX_SUPPLY) revert MaxSupplyExceeded(initialSupply, MAX_SUPPLY);
        if (initialSupply > 0) _mint(initialOwner, initialSupply);
    }

    /// @notice BEP-20 required extension over ERC-20.
    function getOwner() external view returns (address) {
        return owner();
    }

    function setMinter(address minter, bool allowed) external onlyOwner {
        if (minter == address(0)) revert ZeroAddress();
        isMinter[minter] = allowed;
        emit MinterUpdated(minter, allowed);
    }

    /// @notice Supply that can still be minted before hitting `MAX_SUPPLY`.
    function remainingMintableSupply() public view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }

    function mint(address to, uint256 amount) external {
        if (!isMinter[msg.sender]) revert NotMinter(msg.sender);
        uint256 available = remainingMintableSupply();
        if (amount > available) revert MaxSupplyExceeded(amount, available);
        _mint(to, amount);
    }
}
