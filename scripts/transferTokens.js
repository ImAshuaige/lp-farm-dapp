const hre = require("hardhat");

//我去，实在离谱啊。。。我本来就有。。。。。。。。。。。。。。。。。。。
// like 我本来就有，所以这个应该要给其他test acct转 或者是说给那个他们的test acct转。。。。。。。。。。。。。。。。。
//如果我本来就有。idk if this is working bro。。。。。
async function main() {
    //need to modify later, to use env variable for self testing 
    const lpTokenAddress = "0xE9B0408535D272c885b38C5A39aBe82D3535c326"; // lp1
    const receiverAddress = "0x175760a768395E1225e16ed9e6445e204766C52c"; // Your MetaMask address (the receiver)

    // Connect to the LP token contract
    const MockLPToken = await hre.ethers.getContractFactory("MockLPToken");
    const lpToken = await MockLPToken.attach(lpTokenAddress); // Attach to the deployed contract

    // Specify the amount to transfer (e.g., 1000 tokens in ethers)
    const amount = hre.ethers.parseEther("1000"); // You can adjust this number

    console.log("Transferring LP tokens to your MetaMask address...");

    // Transfer tokens from the deployer (or the contract owner) to your address
    const tx = await lpToken.transfer(receiverAddress, amount);

    console.log("Transaction hash:", tx.hash);
    await tx.wait(); // Wait for the transaction to be mined

    console.log(`Transferred ${amount} LP tokens to ${receiverAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
