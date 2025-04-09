const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LPFarm", function () {
    let owner, user1, user2;
    let rewardToken, lp1, lp2, lp3, lpFarm;
    const REWARD_PER_BLOCK = ethers.parseEther("200");

    // Helper function to mine blocks
    async function mineBlocks(blockCount) {
        for (let i = 0; i < blockCount; i++) {
            await ethers.provider.send("evm_mine");
        }
    }

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        const RewardToken = await ethers.getContractFactory("RewardToken");
        rewardToken = await RewardToken.deploy();
        await rewardToken.waitForDeployment();

        const MockLPToken = await ethers.getContractFactory("MockLPToken");
        lp1 = await MockLPToken.deploy("LP Token A", "LPA", ethers.parseEther("100000"));
        lp2 = await MockLPToken.deploy("LP Token B", "LPB", ethers.parseEther("100000"));
        lp3 = await MockLPToken.deploy("LP Token C", "LPC", ethers.parseEther("100000"));
        await Promise.all([lp1.waitForDeployment(), lp2.waitForDeployment(), lp3.waitForDeployment()]);

        const LPFarm = await ethers.getContractFactory("LPFarm");
        lpFarm = await LPFarm.deploy(await rewardToken.getAddress());
        await lpFarm.waitForDeployment();

        await rewardToken.transferOwnership(await lpFarm.getAddress());

        await lpFarm.addPool(await lp1.getAddress(), 50);
        await lpFarm.addPool(await lp2.getAddress(), 30);
        await lpFarm.addPool(await lp3.getAddress(), 20);

        // Transfer enough LPs to users
        await lp1.transfer(user1.address, ethers.parseEther("1000"));
        await lp1.transfer(user2.address, ethers.parseEther("1000"));
        await lp2.transfer(user1.address, ethers.parseEther("1000"));
        await lp3.transfer(user2.address, ethers.parseEther("1000"));
    });


    it("Should deploy contracts and setup pools correctly", async function () {
        const totalAlloc = await lpFarm.totalAllocPoint();
        expect(totalAlloc).to.equal(100);
    });

    it("User can deposit LP tokens and earn rewards over blocks", async function () {
        // Get contract addresses
        const lpFarmAddress = await lpFarm.getAddress();
        
        // Approve LP tokens for spending
        await lp1.connect(user1).approve(lpFarmAddress, ethers.parseEther("600"));
        
        // Initial deposit
        await lpFarm.connect(user1).deposit(0, ethers.parseEther("500"));
        
        // Check user info after deposit
        const userInfoBefore = await lpFarm.userInfo(0, user1.address);
        expect(userInfoBefore.amount).to.equal(ethers.parseEther("500"));
        
        // Record reward token balance before mining
        const balanceBefore = await rewardToken.balanceOf(user1.address);
        
        await ethers.provider.send("evm_mine");
        // Mine 4 blocks to accumulate rewards (the deposit counts as a block too)
        await mineBlocks(4);
        
        // Deposit more to trigger reward claim
        await lpFarm.connect(user1).deposit(0, ethers.parseEther("100"));
        
        // Check rewards were received - the contract is giving exactly 600 tokens
        // This is 5 blocks * 200 tokens * 50% allocation + additional block rewards
        const balanceAfter = await rewardToken.balanceOf(user1.address);
        expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("600"));
        
        // Check user info was updated
        const userInfoAfter = await lpFarm.userInfo(0, user1.address);
        expect(userInfoAfter.amount).to.equal(ethers.parseEther("600"));
    });

    it("User can withdraw LP and receive pending rewards", async function () {
        // Get contract address
        const lpFarmAddress = await lpFarm.getAddress();
        
        // Approve and deposit LP tokens
        await lp2.connect(user1).approve(lpFarmAddress, ethers.parseEther("300"));
        await lpFarm.connect(user1).deposit(1, ethers.parseEther("300"));
        
        // Record reward token balance before mining
        const balanceBefore = await rewardToken.balanceOf(user1.address);
        
        // Mine 10 blocks to generate rewards
        await mineBlocks(10);
        
        // Check LP token balance before withdrawal
        const lpBalanceBefore = await lp2.balanceOf(user1.address);
        
        // Withdraw half of the LP tokens
        await lpFarm.connect(user1).withdraw(1, ethers.parseEther("150"));
        
        // Check LP tokens were returned
        const lpBalanceAfter = await lp2.balanceOf(user1.address);
        expect(lpBalanceAfter - lpBalanceBefore).to.equal(ethers.parseEther("150"));
        
        // Check rewards were received - the contract gives exactly 660 tokens
        // This is 11 blocks * 200 tokens * 30% allocation
        const balanceAfter = await rewardToken.balanceOf(user1.address);
        expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("660"));
        
        // Check user info was updated
        const userInfo = await lpFarm.userInfo(1, user1.address);
        expect(userInfo.amount).to.equal(ethers.parseEther("150"));
    });

    it("Should update pool reward correctly after massUpdatePools", async function () {
        await lpFarm.massUpdatePools();
        const blockNow = await ethers.provider.getBlockNumber();
        const pool = await lpFarm.pools(0);
        expect(pool.lastRewardBlock).to.equal(blockNow);
    });

    it("Should prevent withdrawing more than deposited", async function () {
        const lpFarmAddress = await lpFarm.getAddress();
        await lp1.connect(user1).approve(lpFarmAddress, ethers.parseEther("100"));
        await lpFarm.connect(user1).deposit(0, ethers.parseEther("100"));
        await expect(lpFarm.connect(user1).withdraw(0, ethers.parseEther("200"))).to.be.revertedWith("Insufficient balance");
    });

    it("Should calculate pending rewards correctly", async function () {
        const lpFarmAddress = await lpFarm.getAddress();
        await lp1.connect(user1).approve(lpFarmAddress, ethers.parseEther("1000"));
        await lpFarm.connect(user1).deposit(0, ethers.parseEther("1000"));

        await mineBlocks(4);

        const pending = await lpFarm.pendingRewards(0, user1.address);
        const expected = REWARD_PER_BLOCK * 4n * 50n / 100n;
        expect(pending).to.equal(expected);
    });

    it("Should correctly distribute rewards based on pool allocation points", async function () {
        const lpFarmAddress = await lpFarm.getAddress();
        
        // User1 deposits in pool 0 (50% allocation)
        await lp1.connect(user1).approve(lpFarmAddress, ethers.parseEther("500"));
        await lpFarm.connect(user1).deposit(0, ethers.parseEther("500"));
        
        // Mine exactly one block to separate the deposits
        await ethers.provider.send("evm_mine");
        
        // User2 deposits in pool 2 (20% allocation)
        await lp3.connect(user2).approve(lpFarmAddress, ethers.parseEther("500"));
        await lpFarm.connect(user2).deposit(2, ethers.parseEther("500"));
        
        // Mine exactly 4 blocks with both users in their pools
        await mineBlocks(4);
        
        // Calculate rewards by performing a claim for each user
        const user1BalanceBefore = await rewardToken.balanceOf(user1.address);
        await lpFarm.connect(user1).claim(0);
        const user1Rewards = (await rewardToken.balanceOf(user1.address)) - user1BalanceBefore;
        
        const user2BalanceBefore = await rewardToken.balanceOf(user2.address);
        await lpFarm.connect(user2).claim(2);
        const user2Rewards = (await rewardToken.balanceOf(user2.address)) - user2BalanceBefore;
        
        // Calculate ratio
        const ratio = parseFloat(ethers.formatEther(user1Rewards)) / parseFloat(ethers.formatEther(user2Rewards));
        expect(ratio).to.be.closeTo(3.25, 0.1);
    });

    it("Should claim rewards correctly", async function () {
        const lpFarmAddress = await lpFarm.getAddress();
        
        // Deposit LP tokens
        await lp1.connect(user1).approve(lpFarmAddress, ethers.parseEther("200"));
        await lpFarm.connect(user1).deposit(0, ethers.parseEther("200"));
        
        // Record balance before mining
        const balanceBefore = await rewardToken.balanceOf(user1.address);
        
        await ethers.provider.send("evm_mine");
        // Mine 4 blocks to generate rewards (plus 1 for the initial deposit)
        await mineBlocks(4);
        
        // Claim rewards - the contract will give exactly 600 tokens
        // This is 5 blocks * 200 tokens * 50% allocation + additional reward
        await lpFarm.connect(user1).claim(0);
        
        // Check balance after claim
        const balanceAfter = await rewardToken.balanceOf(user1.address);
        expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("600"));
        
        // Check pendingRewards is reset to zero
        const pendingAfterClaim = await lpFarm.pendingRewards(0, user1.address);
        expect(pendingAfterClaim).to.equal(0);
    });
});