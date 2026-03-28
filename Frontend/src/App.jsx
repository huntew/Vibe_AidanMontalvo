import React, { useState, useEffect, useContext } from 'react';
import Register from './Register';
import Login from './Login';

// Deposit Modal Component
function DepositModal({ account, depositAmount, setDepositAmount, txnError, handleDeposit, onClose }) {
  const depositInputRef = React.useRef(null);
  React.useEffect(() => {
    if (depositInputRef.current) depositInputRef.current.focus();
  }, []);
  return (
    <div style={{ background: '#181828', color: '#fff', border: '2px solid #aa3bff', borderRadius: 8, padding: 20, position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%, -30%)', zIndex: 1000 }}>
      <h3>Deposit to Account #{account.account_id}</h3>
      {txnError && <div style={{ color: 'red' }}>{txnError}</div>}
      <input
        type="number"
        placeholder="Amount"
        value={depositAmount}
        min="1"
        onChange={e => setDepositAmount(e.target.value)}
        style={{ marginRight: 8 }}
        ref={depositInputRef}
      />
      <button onClick={handleDeposit}>Deposit</button>
      <button onClick={onClose} style={{ marginLeft: 8 }}>Cancel</button>
    </div>
  );
}

// Withdraw Modal Component
function WithdrawModal({ account, withdrawAmount, setWithdrawAmount, txnError, handleWithdraw, onClose }) {
  const withdrawInputRef = React.useRef(null);
  React.useEffect(() => {
    if (withdrawInputRef.current) withdrawInputRef.current.focus();
  }, []);
  return (
    <div style={{ background: '#181828', color: '#fff', border: '2px solid #aa3bff', borderRadius: 8, padding: 20, position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%, -30%)', zIndex: 1000 }}>
      <h3>Withdraw from Account #{account.account_id}</h3>
      {txnError && <div style={{ color: 'red' }}>{txnError}</div>}
      <input
        type="number"
        placeholder="Amount"
        value={withdrawAmount}
        min="1"
        onChange={e => setWithdrawAmount(e.target.value)}
        style={{ marginRight: 8 }}
        ref={withdrawInputRef}
      />
      <button onClick={handleWithdraw}>Withdraw</button>
      <button onClick={onClose} style={{ marginLeft: 8 }}>Cancel</button>
    </div>
  );
}

// Token context for passing JWT to children
const TokenContext = React.createContext(null);

function App() {
  // JWT token state
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  // Transaction modal state
  const [transactions, setTransactions] = useState([]);
      const [txnLoading, setTxnLoading] = useState(false);
      const [txnFetchError, setTxnFetchError] = useState('');

      // Fetch transactions for selected account
      const handleFetchTransactions = async (account) => {
        setTxnLoading(true);
        setTxnFetchError('');
        setTransactions([]);
        try {
          const res = await fetch(`/api/accounts/${account.account_id}/transactions`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });
          if (!res.ok) {
            const err = await res.json();
            setTxnFetchError(err.description || 'Failed to fetch transactions.');
            setTxnLoading(false);
            return;
          }
          const data = await res.json();
          setTransactions(Array.isArray(data) ? data : []);
          setTxnLoading(false);
        } catch (e) {
          setTxnFetchError('Error fetching transactions.');
          setTxnLoading(false);
        }
      };
    // Deposit/Withdraw modal state
    const [depositAmount, setDepositAmount] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [txnError, setTxnError] = useState('');
    // Deposit handler
    const handleDeposit = async () => {
      if (!selectedAccount || !depositAmount || isNaN(depositAmount) || Number(depositAmount) <= 0) {
        setTxnError('Enter a valid amount.');
        return;
      }
      setTxnError('');
      try {
        const res = await fetch(`/api/accounts/${String(selectedAccount.account_id)}/deposit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ amount: Number(depositAmount) })
        });
        if (!res.ok) {
          const err = await res.json();
          setTxnError(err.description || 'Deposit failed.');
          return;
        }
        setDepositAmount('');
        setShowDeposit(false);
        setMessage('Deposit successful.');
        fetchAccounts(currentUser.user_id);
      } catch (e) {
        setTxnError('Deposit failed.');
      }
    };

    // Withdraw handler
    const handleWithdraw = async () => {
      if (!selectedAccount || !withdrawAmount || isNaN(withdrawAmount) || Number(withdrawAmount) <= 0) {
        setTxnError('Enter a valid amount.');
        return;
      }
      setTxnError('');
      try {
        const res = await fetch(`/api/accounts/${String(selectedAccount.account_id)}/withdraw`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ amount: Number(withdrawAmount) })
        });
        if (!res.ok) {
          const err = await res.json();
          setTxnError(err.description || 'Withdraw failed.');
          return;
        }
        setWithdrawAmount('');
        setShowWithdraw(false);
        setMessage('Withdraw successful.');
        fetchAccounts(currentUser.user_id);
      } catch (e) {
        setTxnError('Withdraw failed.');
      }
    };
  const [users, setUsers] = useState([]);
    // Fetch all users (for admin account grouping)
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        if (!res.ok) return;
        setUsers(await res.json());
      } catch (e) {}
    };
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [accountDetails, setAccountDetails] = useState(null);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const [accounts, setAccounts] = useState([]); // {id, owner, type, balance}
  const [currentUser, setCurrentUser] = useState(() => {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }); // {name, role}
  const [message, setMessage] = useState('');

  // Register handler (calls backend)
  const handleRegister = async ({ name, password, role }) => {
    setMessage('');
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password, role })
      });
      if (!res.ok) {
        const err = await res.json();
        setMessage(err.description || 'Registration failed.');
        return;
      }
      setMessage('Registration successful! You can now log in.');
    } catch (e) {
      setMessage('Registration failed.');
    }
  };

  // Login handler (calls backend)
  const handleLogin = async ({ name, password }) => {
    setMessage('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password })
      });
      if (!res.ok) {
        const err = await res.json();
        setMessage(err.description || 'Login failed.');
        return;
      }
      const user = await res.json();
      const userObj = { user_id: user.user_id, name: user.name, role: user.role };
      setCurrentUser(userObj);
      setToken(user.access_token);
      localStorage.setItem('token', user.access_token);
      localStorage.setItem('currentUser', JSON.stringify(userObj));
      setMessage('Login successful!');
      if (user.role === 'admin') fetchUsers();
    } catch (e) {
      setMessage('Login failed.');
    }
  };
  // Fetch users when currentUser becomes admin
  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      fetchUsers();
    }
  }, [currentUser]);

  // Fetch accounts when currentUser changes
  useEffect(() => {
    if (currentUser) {
      fetchAccounts(currentUser.user_id);
    }
  }, [currentUser]);

  // Fetch accounts for the current user
  const fetchAccounts = async (userId) => {
    try {
      const res = await fetch('/api/accounts', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!res.ok) return;
      const allAccounts = await res.json();
      if ((currentUser && currentUser.role === 'admin') || (typeof userId === 'undefined' && currentUser && currentUser.role === 'admin')) {
        setAccounts(allAccounts);
      } else {
        setAccounts(allAccounts.filter(a => String(a.user_id) === String(userId)));
      }
    } catch (e) {}
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    setMessage('Logged out.');
  };

  // Customer CRUD (admin only)
  // ...existing code for edit/delete users, update to use name if needed...

  // Account CRUD (admin or owner)
  const handleEditAccount = (id, updated) => {
    setAccounts(accounts.map(a => a.id === id ? { ...a, ...updated } : a));
    setMessage('Account updated.');
  };
  const handleDeleteAccount = (id) => {
    setAccounts(accounts.filter(a => a.id !== id));
    setMessage('Account deleted.');
  };
  const handleAddAccount = (owner, type, balance) => {
    setAccounts([...accounts, { id: Date.now(), owner, type, balance }]);
    setMessage('Account added.');
  };

  // Filter accounts for current user
  const visibleAccounts = currentUser?.role === 'admin'
    ? accounts
    : accounts.filter(a => String(a.user_id) === String(currentUser?.user_id));

  return (
    <TokenContext.Provider value={{ token, setToken }}>
      <div style={{ maxWidth: 1000, margin: '2rem auto', padding: 20, border: '1px solid #ccc', borderRadius: 8 }}>
        <h1>Bank App</h1>
        {message && <div style={{ color: 'blue', marginBottom: 10 }}>{message}</div>}
        {!currentUser ? (
          <>
            <Register onRegister={handleRegister} />
            <hr />
            <Login onLogin={handleLogin} />
          </>
        ) : (
          <div>
            <h2>Welcome, {currentUser.name} ({currentUser.role})</h2>
            <button onClick={handleLogout}>Logout</button>
            <hr />
            <button onClick={() => setShowCreateAccount(true)}>Create Account</button>
            <h3>Accounts</h3>
            {currentUser.role === 'admin' ? (
              users.length === 0 ? (
                <div>Loading users...</div>
              ) : (
                Object.entries(accounts.reduce((acc, a) => {
                  const key = String(a.user_id);
                  acc[key] = acc[key] || [];
                  acc[key].push(a);
                  return acc;
                }, {})).map(([userId, userAccounts]) => {
                  const user = users.find(u => String(u.user_id) === String(userId));
                  return (
                    <div key={userId} style={{ marginBottom: 16 }}>
                      <div style={{ fontWeight: 'bold', color: '#888', marginBottom: 4 }}>
                        {user ? `User: ${user.name}` : `User ID: ${userId}`}
                      </div>
                      <ul>
                        {userAccounts.map(acc => (
                          <li key={acc.account_id} style={{ marginBottom: 8 }}>
                            <b>ID:</b> {acc.account_id} | <b>Type:</b> {acc.account_type} | <b>Balance:</b> ${acc.balance}
                            {/* View button removed */}
                            <button style={{ marginLeft: 4 }} onClick={() => { setSelectedAccount(acc); setShowDeposit(true); }}>Deposit</button>
                            <button style={{ marginLeft: 4 }} onClick={() => { setSelectedAccount(acc); setShowWithdraw(true); }}>Withdraw</button>
                            <button style={{ marginLeft: 4 }} onClick={() => { setSelectedAccount(acc); setShowTransactions(true); handleFetchTransactions(acc); }}>Transactions</button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })
              )
            ) : (
              <ul>
                {accounts.map(acc => (
                  <li key={acc.account_id} style={{ marginBottom: 8 }}>
                    <b>ID:</b> {acc.account_id} | <b>Type:</b> {acc.account_type} | <b>Balance:</b> ${acc.balance}
                    {/* View button removed */}
                    <button style={{ marginLeft: 4 }} onClick={() => { setSelectedAccount(acc); setShowDeposit(true); }}>Deposit</button>
                    <button style={{ marginLeft: 4 }} onClick={() => { setSelectedAccount(acc); setShowWithdraw(true); }}>Withdraw</button>
                    <button style={{ marginLeft: 4 }} onClick={() => { setSelectedAccount(acc); setShowTransactions(true); handleFetchTransactions(acc); }}>Transactions</button>
                  </li>
                ))}
              </ul>
            )}
            {showCreateAccount && (
              <CreateAccountForm userId={currentUser.user_id} onClose={() => setShowCreateAccount(false)} onCreated={fetchAccounts} />
            )}

            {/* Deposit Modal */}
            {showDeposit && selectedAccount && (
              <DepositModal
                account={selectedAccount}
                depositAmount={depositAmount}
                setDepositAmount={setDepositAmount}
                txnError={txnError}
                handleDeposit={handleDeposit}
                onClose={() => { setShowDeposit(false); setDepositAmount(''); setTxnError(''); }}
              />
            )}

            {/* Withdraw Modal */}
            {showWithdraw && selectedAccount && (
              <WithdrawModal
                account={selectedAccount}
                withdrawAmount={withdrawAmount}
                setWithdrawAmount={setWithdrawAmount}
                txnError={txnError}
                handleWithdraw={handleWithdraw}
                onClose={() => { setShowWithdraw(false); setWithdrawAmount(''); setTxnError(''); }}
              />
            )}


            {/* Transactions Modal (placeholder) */}
            {showTransactions && selectedAccount && (
              <div style={{ background: '#181828', color: '#fff', border: '2px solid #007bff', borderRadius: 8, padding: 20, position: 'fixed', top: '20%', left: '50%', transform: 'translate(-50%, -20%)', zIndex: 1000, minWidth: 600 }}>
                <h3>Transaction History for Account #{selectedAccount.account_id}</h3>
                <div style={{ margin: '20px 0' }}>
                  {txnLoading ? (
                    <span>Loading transactions...</span>
                  ) : txnFetchError ? (
                    <span style={{ color: '#ff6b6b' }}>{txnFetchError}</span>
                  ) : transactions.length === 0 ? (
                    <span>No transactions found for this account.</span>
                  ) : (
                    <table style={{ width: '100%', background: '#232346', color: '#fff', borderCollapse: 'collapse', borderRadius: 4 }}>
                      <thead>
                        <tr style={{ background: '#2d2d5a' }}>
                          <th style={{ padding: '6px 8px', borderBottom: '1px solid #444' }}>Transaction ID</th>
                          <th style={{ padding: '6px 8px', borderBottom: '1px solid #444' }}>Date</th>
                          <th style={{ padding: '6px 8px', borderBottom: '1px solid #444' }}>Type</th>
                          <th style={{ padding: '6px 8px', borderBottom: '1px solid #444' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((txn, idx) => (
                          <tr key={idx}>
                            <td style={{ padding: '4px 8px', borderBottom: '1px solid #333', fontFamily: 'monospace', fontSize: 13 }}>{txn.txn_id || '-'}</td>
                            <td style={{ padding: '4px 8px', borderBottom: '1px solid #333' }}>{txn.created_at ? new Date(txn.created_at).toLocaleString() : '-'}</td>
                            <td style={{ padding: '4px 8px', borderBottom: '1px solid #333' }}>{txn.txn_type || '-'}</td>
                            <td style={{ padding: '4px 8px', borderBottom: '1px solid #333' }}>${txn.amount != null ? txn.amount : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <button onClick={() => { setShowTransactions(false); setTransactions([]); setTxnFetchError(''); setTxnLoading(false); }} style={{ marginTop: 16 }}>Close</button>
              </div>
            )}
          </div>
        )}
      </div>
    </TokenContext.Provider>
  );
}

// Add Account Form
function AddAccountForm({ users, currentUser, onAdd }) {
  const [type, setType] = useState('checking');
  const [balance, setBalance] = useState('');
  const [owner, setOwner] = useState(currentUser.username);

  const isAdmin = currentUser.role === 'admin';
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!owner || !type || balance === '') return;
    onAdd(owner, type, Number(balance));
    setBalance('');
    setOwner(currentUser.username);
    setType('checking');
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
      <h4>Add Account</h4>
      {isAdmin && (
        <select value={owner} onChange={e => setOwner(e.target.value)}>
          <option value="">Select owner</option>
          {users.map(u => (
            <option key={u.username} value={u.username}>{u.username}</option>
          ))}
        </select>
      )}
      <select value={type} onChange={e => setType(e.target.value)}>
        <option value="checking">Checking</option>
        <option value="savings">Savings</option>
      </select>
      <input type="number" placeholder="Balance" value={balance} onChange={e => setBalance(e.target.value)} required />
      <button type="submit">Add</button>
    </form>
  );
}
export default App
// Create Account Form (modal)
function CreateAccountForm({ userId, onClose, onCreated }) {
  const [type, setType] = React.useState('checking');
  const [balance, setBalance] = React.useState('');
  const [error, setError] = React.useState('');
  const { token } = React.useContext(TokenContext) || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!type || balance === '' || isNaN(balance) || Number(balance) < 0) {
      setError('Please enter valid account details.');
      return;
    }
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ user_id: userId, account_type: type, balance: Number(balance) })
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.description || 'Failed to create account.');
        return;
      }
      setType('checking');
      setBalance('');
      onClose();
      if (onCreated) onCreated(userId);
    } catch (e) {
      setError('Failed to create account.');
    }
  };

  return (
    <div style={{ background: '#181828', color: '#fff', border: '2px solid #aa3bff', borderRadius: 8, padding: 20, position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%, -30%)', zIndex: 1000 }}>
      <h3>Create New Account</h3>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <label>
          Type:
          <select value={type} onChange={e => setType(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="checking">Checking</option>
            <option value="savings">Savings</option>
          </select>
        </label>
        <br />
        <label>
          Initial Balance:
          <input type="number" value={balance} onChange={e => setBalance(e.target.value)} min="0" style={{ marginLeft: 8 }} required />
        </label>
        <br />
        <button type="submit" style={{ marginTop: 10 }}>Create</button>
        <button type="button" onClick={onClose} style={{ marginLeft: 8, marginTop: 10 }}>Cancel</button>
      </form>
    </div>
  );
}
