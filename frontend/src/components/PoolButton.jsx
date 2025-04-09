const PoolButton = ({ onClick, disabled, poolName, actionType }) => (
    <button 
      onClick={onClick} 
      disabled={disabled}
    >
      {actionType} {poolName}
    </button>
);

export default PoolButton;
  