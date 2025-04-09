const hre = require("hardhat");

async function main() {
    // 1. Deploy RewardToken with deployer as temporary owner
    const RewardToken = await hre.ethers.getContractFactory("RewardToken");
    const rewardToken = await RewardToken.deploy();
    await rewardToken.waitForDeployment();
    console.log("RewardToken deployed to:", await rewardToken.getAddress());

    // 2. Deploy LP Tokens (3 mocks)
    const MockLPToken = await hre.ethers.getContractFactory("MockLPToken");
    const lp1 = await MockLPToken.deploy("LP Token A", "LPA", hre.ethers.parseEther("100000"));
    const lp2 = await MockLPToken.deploy("LP Token B", "LPB", hre.ethers.parseEther("100000"));
    const lp3 = await MockLPToken.deploy("LP Token C", "LPC", hre.ethers.parseEther("100000"));
  
    await Promise.all([lp1.waitForDeployment(), lp2.waitForDeployment(), lp3.waitForDeployment()]);
  

    console.log("LP Tokens deployed:", {
        lp1: await lp1.getAddress(),
        lp2: await lp2.getAddress(),
        lp3: await lp3.getAddress(),
    });

    // 3. Deploy LPFarm
    const LPFarm = await hre.ethers.getContractFactory("LPFarm");
    const lpFarm = await LPFarm.deploy(await rewardToken.getAddress());
    await lpFarm.waitForDeployment();
    console.log("LPFarm deployed to:", await lpFarm.getAddress());

    // 4. Transfer token ownership to LPFarm
    await rewardToken.transferOwnership(await lpFarm.getAddress());
    console.log("RewardToken Ownership transferred");

    // 5. Add LP pools with 50:30:20 split
    await lpFarm.addPool(await lp1.getAddress(), 50);
    await lpFarm.addPool(await lp2.getAddress(), 30);
    await lpFarm.addPool(await lp3.getAddress(), 20);
    console.log("3 LP Pools added with 50:30:20");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



