const PoolCard = ({ name, weight, poolBalance, staked }) => (
    <div className="pool-card">
      <h3>{name} ({weight})</h3>
      <p>Pool Balance: {parseFloat(poolBalance).toFixed(2)}</p>
      <p>My Deposit: {parseFloat(staked).toFixed(2)}</p>
    </div>
  );
  export default PoolCard;
  