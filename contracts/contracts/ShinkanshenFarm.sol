// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ShinkanshenToken} from "./ShinkanshenToken.sol";

/// @title Shinkanshen Farm
/// @notice MasterChef-style staking & yield farming for BNB Smart Chain.
///         Users stake BEP-20 tokens (SHK itself, PancakeSwap LP tokens, ...)
///         into pools and continuously earn SHK, minted by the farm and split
///         between pools pro rata to their allocation points.
/// @dev    Rewards are time based (per second). Each pool tracks its own
///         `totalStaked` instead of relying on `balanceOf(this)`, so the same
///         token can safely be used as both stake and reward and stray
///         transfers cannot distort accounting. Deposits credit the amount
///         actually received, so fee-on-transfer tokens are supported.
contract ShinkanshenFarm is Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct UserInfo {
        uint256 amount; // staked tokens
        uint256 rewardDebt; // amount * accRewardPerShare / ACC_PRECISION at last action
    }

    struct PoolInfo {
        IERC20 stakeToken;
        uint256 allocPoint;
        uint256 lastRewardTime;
        uint256 accRewardPerShare; // scaled by ACC_PRECISION
        uint256 totalStaked;
    }

    uint256 public constant ACC_PRECISION = 1e18;
    uint256 public constant MAX_REWARD_PER_SECOND = 1_000e18;

    ShinkanshenToken public immutable rewardToken;
    uint256 public immutable startTime;
    uint256 public rewardPerSecond;
    uint256 public totalAllocPoint;

    PoolInfo[] public poolInfo;
    mapping(uint256 pid => mapping(address user => UserInfo)) public userInfo;
    mapping(IERC20 token => bool) public isPoolToken;

    event PoolAdded(uint256 indexed pid, IERC20 indexed stakeToken, uint256 allocPoint);
    event PoolUpdated(uint256 indexed pid, uint256 allocPoint);
    event RewardPerSecondUpdated(uint256 previous, uint256 current);
    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event Harvest(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event Recovered(IERC20 indexed token, address indexed to, uint256 amount);

    error ZeroAddress();
    error ZeroAmount();
    error InvalidPool(uint256 pid);
    error DuplicatePoolToken(IERC20 token);
    error RewardRateTooHigh(uint256 requested, uint256 max);
    error InsufficientStake(uint256 requested, uint256 available);
    error ProtectedToken(IERC20 token);

    constructor(ShinkanshenToken rewardToken_, uint256 rewardPerSecond_, uint256 startTime_, address initialOwner)
        Ownable(initialOwner)
    {
        if (address(rewardToken_) == address(0)) revert ZeroAddress();
        if (rewardPerSecond_ > MAX_REWARD_PER_SECOND) revert RewardRateTooHigh(rewardPerSecond_, MAX_REWARD_PER_SECOND);
        rewardToken = rewardToken_;
        rewardPerSecond = rewardPerSecond_;
        startTime = startTime_ > block.timestamp ? startTime_ : block.timestamp;
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    function pools() external view returns (PoolInfo[] memory) {
        return poolInfo;
    }

    /// @notice SHK claimable by `account` in pool `pid` as of the current block.
    function pendingReward(uint256 pid, address account) external view returns (uint256) {
        _requireValidPool(pid);
        PoolInfo storage pool = poolInfo[pid];
        UserInfo storage user = userInfo[pid][account];

        uint256 accRewardPerShare = pool.accRewardPerShare;
        if (block.timestamp > pool.lastRewardTime && pool.totalStaked != 0) {
            accRewardPerShare += (_poolReward(pool) * ACC_PRECISION) / pool.totalStaked;
        }
        return (user.amount * accRewardPerShare) / ACC_PRECISION - user.rewardDebt;
    }

    // ---------------------------------------------------------------------
    // Owner
    // ---------------------------------------------------------------------

    /// @notice Add a new stake token. Settles all pools first so the change in
    ///         `totalAllocPoint` cannot retroactively alter accrued rewards.
    function add(uint256 allocPoint, IERC20 stakeToken) external onlyOwner {
        if (address(stakeToken) == address(0)) revert ZeroAddress();
        if (isPoolToken[stakeToken]) revert DuplicatePoolToken(stakeToken);

        massUpdatePools();

        totalAllocPoint += allocPoint;
        isPoolToken[stakeToken] = true;
        poolInfo.push(
            PoolInfo({
                stakeToken: stakeToken,
                allocPoint: allocPoint,
                lastRewardTime: block.timestamp > startTime ? block.timestamp : startTime,
                accRewardPerShare: 0,
                totalStaked: 0
            })
        );
        emit PoolAdded(poolInfo.length - 1, stakeToken, allocPoint);
    }

    /// @notice Change a pool's allocation points. Setting 0 retires the pool
    ///         while leaving stakes withdrawable.
    function set(uint256 pid, uint256 allocPoint) external onlyOwner {
        _requireValidPool(pid);
        massUpdatePools();
        totalAllocPoint = totalAllocPoint - poolInfo[pid].allocPoint + allocPoint;
        poolInfo[pid].allocPoint = allocPoint;
        emit PoolUpdated(pid, allocPoint);
    }

    function setRewardPerSecond(uint256 rewardPerSecond_) external onlyOwner {
        if (rewardPerSecond_ > MAX_REWARD_PER_SECOND) revert RewardRateTooHigh(rewardPerSecond_, MAX_REWARD_PER_SECOND);
        massUpdatePools();
        emit RewardPerSecondUpdated(rewardPerSecond, rewardPerSecond_);
        rewardPerSecond = rewardPerSecond_;
    }

    /// @notice Rescue tokens sent to the farm by mistake. Stake tokens and the
    ///         reward token are protected, so user funds can never be moved.
    function recoverERC20(IERC20 token, address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        if (isPoolToken[token] || address(token) == address(rewardToken)) revert ProtectedToken(token);
        token.safeTransfer(to, amount);
        emit Recovered(token, to, amount);
    }

    // ---------------------------------------------------------------------
    // Pool accounting
    // ---------------------------------------------------------------------

    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    /// @notice Mint the rewards accrued by a pool since its last update and
    ///         fold them into `accRewardPerShare`.
    function updatePool(uint256 pid) public {
        _requireValidPool(pid);
        PoolInfo storage pool = poolInfo[pid];
        if (block.timestamp <= pool.lastRewardTime) return;

        if (pool.totalStaked != 0) {
            uint256 reward = _poolReward(pool);
            if (reward != 0) {
                rewardToken.mint(address(this), reward);
                pool.accRewardPerShare += (reward * ACC_PRECISION) / pool.totalStaked;
            }
        }
        pool.lastRewardTime = block.timestamp;
    }

    // ---------------------------------------------------------------------
    // User actions
    // ---------------------------------------------------------------------

    /// @notice Stake `amount` of the pool's token. Pending rewards are paid out.
    function deposit(uint256 pid, uint256 amount) external nonReentrant {
        _requireValidPool(pid);
        if (amount == 0) revert ZeroAmount();
        PoolInfo storage pool = poolInfo[pid];
        UserInfo storage user = userInfo[pid][msg.sender];

        updatePool(pid);
        _payPending(pid, pool, user);

        uint256 balanceBefore = pool.stakeToken.balanceOf(address(this));
        pool.stakeToken.safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = pool.stakeToken.balanceOf(address(this)) - balanceBefore;
        if (received == 0) revert ZeroAmount();

        user.amount += received;
        pool.totalStaked += received;
        user.rewardDebt = (user.amount * pool.accRewardPerShare) / ACC_PRECISION;
        emit Deposit(msg.sender, pid, received);
    }

    /// @notice Unstake `amount`. Pending rewards are paid out.
    function withdraw(uint256 pid, uint256 amount) external nonReentrant {
        _requireValidPool(pid);
        if (amount == 0) revert ZeroAmount();
        PoolInfo storage pool = poolInfo[pid];
        UserInfo storage user = userInfo[pid][msg.sender];
        if (user.amount < amount) revert InsufficientStake(amount, user.amount);

        updatePool(pid);
        _payPending(pid, pool, user);

        user.amount -= amount;
        pool.totalStaked -= amount;
        user.rewardDebt = (user.amount * pool.accRewardPerShare) / ACC_PRECISION;
        pool.stakeToken.safeTransfer(msg.sender, amount);
        emit Withdraw(msg.sender, pid, amount);
    }

    /// @notice Claim pending SHK without changing the stake.
    function harvest(uint256 pid) external nonReentrant {
        _requireValidPool(pid);
        PoolInfo storage pool = poolInfo[pid];
        UserInfo storage user = userInfo[pid][msg.sender];

        updatePool(pid);
        _payPending(pid, pool, user);
        user.rewardDebt = (user.amount * pool.accRewardPerShare) / ACC_PRECISION;
    }

    /// @notice Withdraw the full stake and forfeit all pending rewards. Never
    ///         touches reward accounting, so it works even if minting fails.
    function emergencyWithdraw(uint256 pid) external nonReentrant {
        _requireValidPool(pid);
        PoolInfo storage pool = poolInfo[pid];
        UserInfo storage user = userInfo[pid][msg.sender];
        uint256 amount = user.amount;
        if (amount == 0) revert ZeroAmount();

        user.amount = 0;
        user.rewardDebt = 0;
        pool.totalStaked -= amount;
        pool.stakeToken.safeTransfer(msg.sender, amount);
        emit EmergencyWithdraw(msg.sender, pid, amount);
    }

    // ---------------------------------------------------------------------
    // Internals
    // ---------------------------------------------------------------------

    /// @dev Reward owed to a pool since `lastRewardTime`, capped by the supply
    ///      that can still be minted so emissions stop cleanly at MAX_SUPPLY.
    function _poolReward(PoolInfo storage pool) internal view returns (uint256) {
        if (totalAllocPoint == 0 || pool.allocPoint == 0) return 0;
        uint256 elapsed = block.timestamp - pool.lastRewardTime;
        uint256 reward = (elapsed * rewardPerSecond * pool.allocPoint) / totalAllocPoint;
        uint256 mintable = rewardToken.remainingMintableSupply();
        return reward > mintable ? mintable : reward;
    }

    function _payPending(uint256 pid, PoolInfo storage pool, UserInfo storage user) internal {
        if (user.amount == 0) return;
        uint256 pending = (user.amount * pool.accRewardPerShare) / ACC_PRECISION - user.rewardDebt;
        if (pending != 0) {
            IERC20(address(rewardToken)).safeTransfer(msg.sender, pending);
            emit Harvest(msg.sender, pid, pending);
        }
    }

    function _requireValidPool(uint256 pid) internal view {
        if (pid >= poolInfo.length) revert InvalidPool(pid);
    }
}
