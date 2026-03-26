import React, { useState } from 'react';

export default function Accounts({ accounts, onEdit, onDelete, currentUser }) {
  const [editId, setEditId] = useState(null);
  const [editType, setEditType] = useState('checking');
  const [editBalance, setEditBalance] = useState('');

  const handleEdit = (acc) => {
    setEditId(acc.id);
    setEditType(acc.type);
    setEditBalance(acc.balance);
  };

  const handleSave = () => {
    onEdit(editId, { type: editType, balance: editBalance });
    setEditId(null);
  };

  // Group accounts by owner for admin, or just show for customer
  let grouped = {};
  if (currentUser.role === 'admin') {
    accounts.forEach(acc => {
      if (!grouped[acc.owner]) grouped[acc.owner] = [];
      grouped[acc.owner].push(acc);
    });
  } else {
    grouped[currentUser.name] = accounts;
  }

  return (
    <div>
      <h3>Accounts</h3>
      {Object.keys(grouped).map(owner => (
        <div key={owner} style={{ marginBottom: 16, border: '1px solid #eee', borderRadius: 6, padding: 8 }}>
          <div style={{ fontWeight: 'bold', color: '#555', marginBottom: 4 }}>
            {currentUser.role === 'admin' ? `User: ${owner}` : 'Your Accounts'}
          </div>
          <ul>
            {grouped[owner].map(acc => (
              <li key={acc.id} style={{ marginBottom: 4 }}>
                {editId === acc.id ? (
                  <>
                    <select value={editType} onChange={e => setEditType(e.target.value)}>
                      <option value="checking">Checking</option>
                      <option value="savings">Savings</option>
                    </select>
                    <input type="number" value={editBalance} onChange={e => setEditBalance(e.target.value)} />
                    <button onClick={handleSave}>Save</button>
                    <button onClick={() => setEditId(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <span style={{ fontWeight: 500 }}>{acc.type}</span> - ${acc.balance}
                    <button onClick={() => handleEdit(acc)} style={{ marginLeft: 8 }}>Edit</button>
                    <button onClick={() => onDelete(acc.id)} style={{ marginLeft: 4 }}>Delete</button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
