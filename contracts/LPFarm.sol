// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./RewardToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract LPFarm is Ownable{
    using SafeERC20 for IERC20;
    RewardToken public rewardToken;
    uint256 public REWARD_PER_BLOCK = 200 ether; // 200 tokens per block

    // LP Token info (50:30:20 split)
    struct PoolInfo {
        IERC20 lpToken; // LP token contract
        uint256 allocPoint; // Allocation points (weight)
        uint lastRewardBlock; //Last block number that rewards distribution occurred
        uint256 accRewardPerShare; //Accumulated rewards per share
    }

    PoolInfo[] public pools; // pools[0], pools[1], pools[2]

    // Total allocation points (sum of all pool weights)
    uint256 public totalAllocPoint;

    struct UserInfo {
        uint256 amount; // How many LP tokens the user has provided
        uint256 rewardDebt; // Reward debt (for pending reward calculation)
    }

    // Mapping from pool ID => user address => UserInfo
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event Claim(address indexed user, uint256 amount);

    constructor(address _rewardToken) Ownable(msg.sender) {
        rewardToken = RewardToken(_rewardToken);
    }


    /// @notice Add LP token pools (called by owner)
    function addPool(IERC20 _lpToken, uint256 _allocPoint) external onlyOwner {
        // Update all existing pools first
        massUpdatePools();
        
        // Set last reward block to current block
        uint256 lastRewardBlock = block.number;
        
        // Add to total allocation points
        totalAllocPoint += _allocPoint;
        
        // Push new pool to array
        pools.push(PoolInfo({
            lpToken: _lpToken,
            allocPoint: _allocPoint,
            lastRewardBlock: lastRewardBlock,
            accRewardPerShare: 0
        }));
    }

    /// @notice Update all pools' reward calculations
    function massUpdatePools() public {
        uint256 length = pools.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    /// @notice Update reward calculations for a specific pool
    /// @param _pid Pool ID to update
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = pools[_pid];
        if (block.number <= pool.lastRewardBlock) return;

        // Get current LP token supply
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }

        // Calculate blocks passed since last update
        uint256 blocksPassed = block.number - pool.lastRewardBlock;
        
        // Calculate reward for this pool
        uint256 poolReward = (blocksPassed * REWARD_PER_BLOCK * pool.allocPoint) / totalAllocPoint;
        
        // Mint reward tokens (requires farm contract to be RewardToken owner)
        rewardToken.mint(address(this), poolReward);
        
        // Update accumulated rewards per share
        pool.accRewardPerShare += (poolReward * 1e18) / lpSupply;
        
        // Update last reward block
        pool.lastRewardBlock = block.number;
    }

    /// @notice Deposit LP tokens to farm
    /// @param _pid Pool ID to deposit to
    /// @param _amount Amount of LP tokens to deposit
    function deposit(uint256 _pid, uint256 _amount) external {
        PoolInfo storage pool = pools[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        updatePool(_pid);
        
        // Handle pending rewards first
        if (user.amount > 0) {
            uint256 pending = (user.amount * pool.accRewardPerShare) / 1e18 - user.rewardDebt;
            safeRewardTransfer(msg.sender, pending);
        }
        
        // Transfer LP tokens from user
        pool.lpToken.safeTransferFrom(msg.sender, address(this), _amount);
        user.amount += _amount;
        
        // Update reward debt
        user.rewardDebt = (user.amount * pool.accRewardPerShare) / 1e18;
        
        emit Deposit(msg.sender, _pid, _amount);
    }

    /// @notice Withdraw LP tokens from farm
    /// @param _pid Pool ID to withdraw from
    /// @param _amount Amount of LP tokens to withdraw
    function withdraw(uint256 _pid, uint256 _amount) external {
        PoolInfo storage pool = pools[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "Insufficient balance");
        
        updatePool(_pid);
        
        // Calculate pending rewards
        uint256 pending = (user.amount * pool.accRewardPerShare) / 1e18 - user.rewardDebt;
        safeRewardTransfer(msg.sender, pending);
        
        // Update user balance
        user.amount -= _amount;
        
        // Transfer LP tokens back to user
        pool.lpToken.safeTransfer(msg.sender, _amount);
        
        // Update reward debt
        user.rewardDebt = (user.amount * pool.accRewardPerShare) / 1e18;
        
        emit Withdraw(msg.sender, _pid, _amount);
    }

    /// @notice Safe reward transfer (avoids rounding errors)
    /// @param _to Recipient address
    /// @param _amount Amount to transfer
    function safeRewardTransfer(address _to, uint256 _amount) internal {
        uint256 rewardBal = rewardToken.balanceOf(address(this));
        if (_amount > rewardBal) {
            rewardToken.transfer(_to, rewardBal);
        } else {
            rewardToken.transfer(_to, _amount);
        }
        emit Claim(_to, _amount);
    }

    /// might need to delete this one, cuz no point showing
    /// @notice Get pending rewards for a user in a pool
    /// @param _pid Pool ID to check
    /// @param _user User address
    function pendingRewards(uint256 _pid, address _user) external view returns (uint256) {
        PoolInfo storage pool = pools[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        
        uint256 accRewardPerShare = pool.accRewardPerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        
        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 blocksPassed = block.number - pool.lastRewardBlock;
            uint256 poolReward = (blocksPassed * REWARD_PER_BLOCK * pool.allocPoint) / totalAllocPoint;
            accRewardPerShare += (poolReward * 1e18) / lpSupply;
        }
        
        return (user.amount * accRewardPerShare) / 1e18 - user.rewardDebt;
    }

    function claim(uint256 _pid) external {
        updatePool(_pid);
        UserInfo storage user = userInfo[_pid][msg.sender];
        uint256 pending = (user.amount * pools[_pid].accRewardPerShare) / 1e18 - user.rewardDebt;
        safeRewardTransfer(msg.sender, pending);
        user.rewardDebt = (user.amount * pools[_pid].accRewardPerShare) / 1e18;
    }
}