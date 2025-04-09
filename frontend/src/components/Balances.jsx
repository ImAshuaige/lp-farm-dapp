import PoolCard from "./PoolCard";

const Balances = ({ poolBalances, stakedAmounts, pendingRewards }) => (
  <div className="balance-grid">
    <PoolCard name="Pool A" weight="50%" poolBalance={poolBalances[0]} staked={stakedAmounts[0]} pending={pendingRewards[0]} />
    <PoolCard name="Pool B" weight="30%" poolBalance={poolBalances[1]} staked={stakedAmounts[1]} pending={pendingRewards[1]} />
    <PoolCard name="Pool C" weight="20%" poolBalance={poolBalances[2]} staked={stakedAmounts[2]} pending={pendingRewards[2]} />
  </div>
);
export default Balances;
