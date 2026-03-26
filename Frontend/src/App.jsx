// Create Account Form
function CreateAccountForm({ userId, onClose, onCreated }) {
  const [accountType, setAccountType] = useState('SAVINGS');
  const [balance, setBalance] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!accountType || balance === '') {
      setError('All fields required');
      return;
    }
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, account_type: accountType, balance: Number(balance) })
      });
      if (!res.ok) {
        setError('Failed to create account');
        return;
      }
      setBalance('');
      setAccountType('SAVINGS');
      onCreated(userId);
      onClose();
    } catch (e) {
      setError('Failed to create account');
    }
  };

  return (
    <div style={{ background: '#fff', border: '1px solid #ccc', padding: 20, borderRadius: 8, margin: '20px 0' }}>
      <h3>Create Account</h3>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <label>Account Type: </label>
        <select value={accountType} onChange={e => setAccountType(e.target.value)}>
          <option value="SAVINGS">SAVINGS</option>
          <option value="CHECKING">CHECKING</option>
        </select>
        <br />
        <label>Initial Balance: </label>
        <input type="number" value={balance} onChange={e => setBalance(e.target.value)} required min="0" />
        <br />
        <button type="submit">Create</button>
        <button type="button" onClick={onClose} style={{ marginLeft: 8 }}>Cancel</button>
      </form>
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import Register from './Register';
import Login from './Login';
import Customers from './Customers';
import Accounts from './Accounts';

function App() {
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
          headers: { 'Content-Type': 'application/json' },
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
          headers: { 'Content-Type': 'application/json' },
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
  const [currentUser, setCurrentUser] = useState(null); // {name, role}
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
      setCurrentUser({ user_id: user.user_id, name: user.name, role: user.role });
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
      const res = await fetch('/api/accounts');
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
                          <button style={{ marginLeft: 8 }} onClick={() => setAccountDetails(acc)}>View</button>
                          <button style={{ marginLeft: 4 }} onClick={() => { setSelectedAccount(acc); setShowDeposit(true); }}>Deposit</button>
                          <button style={{ marginLeft: 4 }} onClick={() => { setSelectedAccount(acc); setShowWithdraw(true); }}>Withdraw</button>
                          <button style={{ marginLeft: 4 }} onClick={() => { setSelectedAccount(acc); setShowTransactions(true); }}>Transactions</button>
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
                  <button style={{ marginLeft: 8 }} onClick={() => setAccountDetails(acc)}>View</button>
                  <button style={{ marginLeft: 4 }} onClick={() => { setSelectedAccount(acc); setShowDeposit(true); }}>Deposit</button>
                  <button style={{ marginLeft: 4 }} onClick={() => { setSelectedAccount(acc); setShowWithdraw(true); }}>Withdraw</button>
                  <button style={{ marginLeft: 4 }} onClick={() => { setSelectedAccount(acc); setShowTransactions(true); }}>Transactions</button>
                </li>
              ))}
            </ul>
          )}
          {showCreateAccount && (
            <CreateAccountForm userId={currentUser.user_id} onClose={() => setShowCreateAccount(false)} onCreated={fetchAccounts} />
          )}

          {/* Deposit Modal */}
          {showDeposit && selectedAccount && (
            <div style={{ background: '#fff', border: '2px solid #aa3bff', borderRadius: 8, padding: 20, position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%, -30%)', zIndex: 1000 }}>
              <h3>Deposit to Account #{selectedAccount.account_id}</h3>
              {txnError && <div style={{ color: 'red' }}>{txnError}</div>}
              <input
                type="number"
                placeholder="Amount"
                value={depositAmount}
                min="1"
                onChange={e => setDepositAmount(e.target.value)}
                style={{ marginRight: 8 }}
              />
              <button onClick={handleDeposit}>Deposit</button>
              <button onClick={() => { setShowDeposit(false); setDepositAmount(''); setTxnError(''); }} style={{ marginLeft: 8 }}>Cancel</button>
            </div>
          )}

          {/* Withdraw Modal */}
          {showWithdraw && selectedAccount && (
            <div style={{ background: '#fff', border: '2px solid #aa3bff', borderRadius: 8, padding: 20, position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%, -30%)', zIndex: 1000 }}>
              <h3>Withdraw from Account #{selectedAccount.account_id}</h3>
              {txnError && <div style={{ color: 'red' }}>{txnError}</div>}
              <input
                type="number"
                placeholder="Amount"
                value={withdrawAmount}
                min="1"
                onChange={e => setWithdrawAmount(e.target.value)}
                style={{ marginRight: 8 }}
              />
              <button onClick={handleWithdraw}>Withdraw</button>
              <button onClick={() => { setShowWithdraw(false); setWithdrawAmount(''); setTxnError(''); }} style={{ marginLeft: 8 }}>Cancel</button>
            </div>
          )}
        </div>
      )}
    </div>
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
