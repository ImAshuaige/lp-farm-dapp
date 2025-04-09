const hre = require("hardhat");
const contractAddresses = require('../frontend/src/contracts/deployed.json');

async function main() {
    const receiverAddress = "0x34846BF00C64A56A5FB10a9EE7717aBC7887FEdf"; // test user 
    const tokenKeys = ['lp1', 'lp2', 'lp3'];

    const MockLPToken = await hre.ethers.getContractFactory("MockLPToken");
    const amount = hre.ethers.parseEther("10000"); // 10,000 tokens

    for (const key of tokenKeys) {
        const lpTokenAddress = contractAddresses[key];
        const lpToken = await MockLPToken.attach(lpTokenAddress);

        console.log(`Transferring 10,000 tokens from ${key} (${lpTokenAddress}) to ${receiverAddress}...`);

        const tx = await lpToken.transfer(receiverAddress, amount);
        console.log(`Transaction hash for ${key}:`, tx.hash);

        await tx.wait();
        console.log(`✅ Transferred 10,000 ${key} tokens to ${receiverAddress}\n`);
    }

    console.log("✅✅ All token transfers completed.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

