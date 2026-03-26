import React, { useState } from 'react';

export default function Customers({ users, onEdit, onDelete, currentUser }) {
  const isAdmin = currentUser.role === 'admin';
  const [editUser, setEditUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('customer');

  const handleEdit = (user) => {
    setEditUser(user.name);
    setEditName(user.name);
    setEditRole(user.role);
  };

  const handleSave = () => {
    onEdit(editUser, { name: editName, role: editRole });
    setEditUser(null);
  };

  return (
    <div>
      <h3>Customers</h3>
      <ul>
        {users.map(user => (
          <li key={user.name}>
            {editUser === user.name ? (
              <>
                <input value={editName} onChange={e => setEditName(e.target.value)} />
                <select value={editRole} onChange={e => setEditRole(e.target.value)}>
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
                <button onClick={handleSave}>Save</button>
                <button onClick={() => setEditUser(null)}>Cancel</button>
              </>
            ) : (
              <>
                {user.name} ({user.role})
                {isAdmin && (
                  <>
                    <button onClick={() => handleEdit(user)}>Edit</button>
                    <button onClick={() => onDelete(user.name)}>Delete</button>
                  </>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
