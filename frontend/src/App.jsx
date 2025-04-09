import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import LPFarmABI from "./contracts/LPFarmABI.json";
import RewardTokenABI from "./contracts/RewardTokenABI.json";
import MockLPTokenABI from "./contracts/MockLPTokenABI.json";
import contractAddresses from "./contracts/deployed.json";
import "./App.css";
import Header from "./components/Header";
import WalletInfo from "./components/WalletInfo";
import Balances from "./components/Balances";
import ActionPanel from "./components/ActionPanel";

const App = () => {
  // State variables
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [lpFarmContract, setLpFarmContract] = useState(null);
  const [rewardTokenContract, setRewardTokenContract] = useState(null);
  const [lpTokenContracts, setLpTokenContracts] = useState([]);
  const [rewardBalance, setRewardBalance] = useState("0");
  const [lpBalances, setLpBalances] = useState([0, 0, 0]);
  const [stakedAmounts, setStakedAmounts] = useState([0, 0, 0]);
  const [poolBalances, setPoolBalances] = useState([0, 0, 0]); // For 3 pools
  const [pendingRewards, setPendingRewards] = useState([0, 0, 0]);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Connect wallet function
  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        const web3Signer = await web3Provider.getSigner();
        const userAddress = await web3Signer.getAddress();
        
        setProvider(web3Provider);
        setSigner(web3Signer);
        setAccount(userAddress);
        
        console.log("Connected to wallet:", userAddress);
        setupContracts(web3Provider, web3Signer);
      } else {
        setErrorMessage("Please install MetaMask!");
      }
    } catch (error) {
      console.error("Connection error:", error);
      setErrorMessage(`Failed to connect: ${error.message}`);
    }
  };

  // Setup contract instances
  const setupContracts = async (provider, signer) => {
    try {
      // Create contract instances
      const farmContract = new ethers.Contract(
        contractAddresses.lpFarm, 
        LPFarmABI.abi, 
        signer
      );
      
      const rwdContract = new ethers.Contract(
        contractAddresses.rewardToken, 
        RewardTokenABI.abi, 
        signer
      );
      
      const lpContracts = [
        contractAddresses.lp1,
        contractAddresses.lp2,
        contractAddresses.lp3
      ].map(address => 
        new ethers.Contract(address, MockLPTokenABI.abi, signer)
      );
      
      setLpFarmContract(farmContract);
      setRewardTokenContract(rwdContract);
      setLpTokenContracts(lpContracts);
      
      // Load data once contracts are ready
      await loadBalances(signer, rwdContract, lpContracts, farmContract);
    } catch (error) {
      console.error("Setup contracts error:", error);
      setErrorMessage(`Contract setup failed: ${error.message}`);
    }
  };

  // Load user balances and staking info
  const loadBalances = async (signer, rwdContract, lpContracts, farmContract) => {
    try {
      setLoading(true);
      const userAddress = await signer.getAddress();
      
      // Get reward token balance
      const rwdBalance = await rwdContract.balanceOf(userAddress);
      setRewardBalance(ethers.formatUnits(rwdBalance, 18));
      
      // Get LP token balances
      const balancePromises = lpContracts.map(contract => 
        contract.balanceOf(userAddress)
      );
      const balances = await Promise.all(balancePromises);
      setLpBalances(balances.map(bal => ethers.formatUnits(bal, 18)));
      
      // Get staked amounts for each pool
      const userInfoPromises = [0, 1, 2].map(pid => 
        farmContract.userInfo(pid, userAddress)
      );
      const userInfos = await Promise.all(userInfoPromises);
      setStakedAmounts(userInfos.map(info => ethers.formatUnits(info.amount, 18)));

      // Get pool balances for each pool
      const poolBalancePromises = lpContracts.map(contract => 
        contract.balanceOf(contractAddresses.lpFarm)
      );
      const poolBalances = await Promise.all(poolBalancePromises);
      setPoolBalances(poolBalances.map(bal => ethers.formatUnits(bal, 18)));
  
      // Get pending rewards
      const pendingPromises = [0, 1, 2].map(pid => 
        farmContract.pendingRewards(pid, userAddress)
      );
      const pending = await Promise.all(pendingPromises);
      setPendingRewards(pending.map(amount => ethers.formatUnits(amount, 18)));
      
      setLoading(false);
    } catch (error) {
      console.error("Load balances error:", error);
      setLoading(false);
      setErrorMessage(`Failed to load data: ${error.message}`);
    }
  };

  // Deposit LP tokens
  const deposit = async (pid) => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setErrorMessage("Please enter a valid deposit amount");
      return;
    }
    
    try {
      setLoading(true);
      setErrorMessage("");
      
      const amount = ethers.parseUnits(depositAmount, 18);
      const lpToken = lpTokenContracts[pid];
      
      // First approve spending
      const approveTx = await lpToken.approve(contractAddresses.lpFarm, amount);
      await approveTx.wait();
      console.log("Approval confirmed");
      
      // Then deposit
      const depositTx = await lpFarmContract.deposit(pid, amount);
      await depositTx.wait();
      console.log("Deposit successful");
      
      // Refresh balances
      await loadBalances(signer, rewardTokenContract, lpTokenContracts, lpFarmContract);
      setDepositAmount("");
      setLoading(false);
    } catch (error) {
      console.error("Deposit error:", error);
      setLoading(false);
      setErrorMessage(`Deposit failed: ${error.message}`);
    }
  };

  // Withdraw LP tokens
  const withdraw = async (pid) => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setErrorMessage("Please enter a valid withdrawal amount");
      return;
    }
    
    try {
      setLoading(true);
      setErrorMessage("");
      
      const amount = ethers.parseUnits(withdrawAmount, 18);
      const withdrawTx = await lpFarmContract.withdraw(pid, amount);
      await withdrawTx.wait();
      console.log("Withdrawal successful");
      
      // Refresh balances
      await loadBalances(signer, rewardTokenContract, lpTokenContracts, lpFarmContract);
      setWithdrawAmount("");
      setLoading(false);
    } catch (error) {
      console.error("Withdraw error:", error);
      setLoading(false);
      setErrorMessage(`Withdrawal failed: ${error.message}`);
    }
  };

  // Claim rewards
  const claimRewards = async (pid) => {
    try {
      setLoading(true);
      setErrorMessage("");
      
      const claimTx = await lpFarmContract.claim(pid);
      await claimTx.wait();
      console.log("Claim successful");
      
      // Refresh balances
      await loadBalances(signer, rewardTokenContract, lpTokenContracts, lpFarmContract);
      setLoading(false);
    } catch (error) {
      console.error("Claim error:", error);
      setLoading(false);
      setErrorMessage(`Claim failed: ${error.message}`);
    }
  };

  // Refresh data function
  const refreshData = async () => {
    if (signer && rewardTokenContract && lpTokenContracts.length && lpFarmContract) {
      await loadBalances(signer, rewardTokenContract, lpTokenContracts, lpFarmContract);
    }
  };

  return (
    <div className="App">
      <Header account={account} connectWallet={connectWallet} refreshData={refreshData} />
      
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {loading && <div className="loading">Loading...</div>}

      {account && (
        <div className="farm-content">
          <WalletInfo rewardBalance={rewardBalance} lpBalances={lpBalances} />
          <Balances poolBalances={poolBalances} stakedAmounts={stakedAmounts} pendingRewards={pendingRewards} />
          <ActionPanel
            depositAmount={depositAmount}
            withdrawAmount={withdrawAmount}
            setDepositAmount={setDepositAmount}
            setWithdrawAmount={setWithdrawAmount}
            deposit={deposit}
            withdraw={withdraw}
            claimRewards={claimRewards}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
};

export default App;
