import PoolButton from "./PoolButton";

const ActionPanel = ({
  depositAmount,
  withdrawAmount,
  setDepositAmount,
  setWithdrawAmount,
  deposit,
  withdraw,
  claimRewards,
  loading
}) => {
  const poolNames = ["Pool A", "Pool B", "Pool C"];
  
  return (
    <div className="action-section">
      <h2>Manage Stakes</h2>

      <div className="action-card">
        <h3>Deposit LP Tokens</h3>
        <label>Amount:</label>
        <input
          type="number"
          value={depositAmount}
          onChange={(e) => {
            const value = e.target.value;
            if (value >= 0 || value === '') {
              setDepositAmount(value);
            }
          }}
          placeholder="Enter deposit amount"
          style={{ width: '90%' }}
        />
        <div className="button-row">
          {poolNames.map((name, index) => (
            <PoolButton
              key={`deposit-${index}`}
              onClick={() => deposit(index)}
              disabled={loading}
              poolName={name}
              actionType="Deposit to"
            />
          ))}
        </div>
      </div>

      <div className="action-card">
        <h3>Withdraw LP Tokens</h3>
        <label>Amount:</label>
        <input
          type="number"
          value={withdrawAmount}
          onChange={(e) => {
            const value = e.target.value;
            if (value >= 0 || value === '') {
              setWithdrawAmount(value);
            }
          }}
          placeholder="Enter withdrawal amount"
          style={{ width: '90%' }}
        />
        <div className="button-row">
          {poolNames.map((name, index) => (
            <PoolButton
              key={`withdraw-${index}`}
              onClick={() => withdraw(index)}
              disabled={loading}
              poolName={name}
              actionType="Withdraw from"
            />
          ))}
        </div>
      </div>

      <div className="action-card">
        <h3>Claim Rewards</h3>
        <div className="button-row">
          {poolNames.map((name, index) => (
            <PoolButton
              key={`claim-${index}`}
              onClick={() => claimRewards(index)}
              disabled={loading}
              poolName={name}
              actionType="Claim from"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActionPanel;