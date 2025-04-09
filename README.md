# 🌾 LP Token Farming dApp

A decentralized farming application built with Solidity and Vite + React on the Sepolia testnet. Users can stake LP tokens and earn reward tokens per block. This is a take-home assignment project.

---

## 🚀 Live Demo

🌐 [Frontend (GitHub Pages)](https://imashuaige.github.io/lp-farm-dapp/)

> Please ensure MetaMask is connected to the Sepolia Testnet to use this dApp.

---
## 🧩 Project Structure Overview

The project is organized into 4 main areas:

1. **Smart Contracts (`/contracts`)**  
   Core logic for farming and rewards:
   - `LPFarm.sol`: Main contract to manage farming pools.  
     - Emits 200 reward tokens per block.  
     - Allows contract owner to add unlimited LP tokens with custom weights.  
     - Supports deposit, withdraw, and claim functions for users.
   - `RewardToken.sol`: A mintable ERC20 token used as farming rewards.
   - `MockLPToken.sol`: Simulates 3 LP tokens added into the farm with weight ratios 50%, 30%, and 20%.

2. **Deployment Script (`/scripts`)**  
   - `deploy.js`: Deploys the reward token, three mock LP tokens, and LPFarm contract.  
   - Transfers reward token ownership to LPFarm to enable reward minting.

3. **Testing (`/test`)**  
   - `test.js`: Uses Hardhat to test core functionalities.

4. **Frontend (`/frontend`)**  
   - React app for wallet connection and interaction with the farming system 

---
## 🖥️ Frontend Features

- Connect MetaMask (Sepolia Testnet)
- View:
  - LP token balances
  - Pool balances
  - Staked balances for each pool
  - Reward token balance
- Interact with:
  - **Deposit** LP tokens into existing pools
  - **Withdraw** LP tokens from pools
  - **Claim** rewards from each pool

---

## 🧪 Testing Guide for Reviewer

### 🔗 Step-by-Step: How to Test This dApp

1. ### ✅ **Set Up MetaMask**
   - Install the [MetaMask extension](https://metamask.io/) if you haven’t already.
   - **Create a new wallet** or **connect your existing one**.
   - In MetaMask, **switch the network** to `Sepolia` testnet:
     - Click the network dropdown → Select “Sepolia”.

2. ### ⛽ **Ensure SepoliaETH**
   - This wallet must have some SepoliaETH to pay gas fees.
   - If needed, request FREE 0.05 from the [Ethereum Sepolia Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia.)

3. ### 🧾 **Import Mock LP Tokens in MetaMask**
   To view LP token balances:

   - Open MetaMask → "Import Tokens" → "Custom Token"
   - Use these token addresses (copied from `deployed.json`):

     | Token | Contract Address (Example) |
     |-------|----------------------------|
     | LPA   | `0x...LPAAddressHere`      |
 

   - Repeat this step 3 times for each LP token.

> 📌 **Note:**  
> All deployed contract addresses (on Sepolia) are stored in:  
> `frontend/src/contracts/deployed.json`  
>  
> Please refer to that file when importing tokens or verifying deployments.

4. ### 🌐 **Interact With the dApp**
   - Go to the [Live Frontend](https://imashuaige.github.io/lp-farm-dapp/)
   - Connect your MetaMask wallet.
   - You will see:
     - Your LP token balances
     - Your staked amount in each pool
     - Your claimed reward tokens
   - Try these:
     - **Deposit** LP tokens into each pool
     - **Withdraw** from pools
     - **Claim** rewards

5. ### 🔄 **Observe Rewards Accumulate**
   - After depositing, rewards (200 per block) begin accruing.
   - Claim rewards to receive minted tokens.




## 💬 Tech Stack

- **Solidity** (Smart Contracts)
- **Hardhat** (Development & Deployment)
- **Ethers.js** (Frontend–Contract interaction)
- **React.js** (Frontend)
- **MetaMask** (Wallet Integration)
- **GitHub Pages** (Frontend hosting)
- **Sepolia** (Testnet)

---

## 👨‍💻 Author

Hester Huang — Final-year Information Systems (FinTech specialization) student at NUS, passionate about building real-world decentralized apps.
Feel free to reach out to request test LP tokens or for any technical questions!

---



