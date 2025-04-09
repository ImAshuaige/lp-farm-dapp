const WalletInfo = ({ rewardBalance, lpBalances }) => {
  const tokenLabels = ["LP Token A", "LP Token B", "LP Token C"];

  return (
    <div className="balances-section">
      <h2>Your Balances</h2>

      <div style={{ textAlign: "center" }}>
        <p><strong>Reward Token:</strong> {parseFloat(rewardBalance).toFixed(2)} RWT</p>
      </div>

      <div className="lp-balances-row" style={{ display: "flex", justifyContent: "space-between" }}>
        {lpBalances.map((balance, index) => (
          <div key={index} className="lp-balance" style={{ flex: 1, textAlign: "center" }}>
            <p><strong>{tokenLabels[index]}</strong></p>
            <p>{parseFloat(balance).toFixed(2)} LP</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WalletInfo;
