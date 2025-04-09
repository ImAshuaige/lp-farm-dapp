const Header = ({ account, connectWallet, refreshData }) => (
    <header className="App-header">
      <h1>LP Token Farming DApp</h1>
      {!account ? (
          <button className="connect-button" onClick={connectWallet}>
            Connect Wallet
          </button>
      ) : (
        <div className="account-info">
          <p>Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
          <button className="refresh-button" onClick={refreshData}>
            Refresh Data
          </button>
        </div>
      )}
    </header>
  );
  
export default Header;