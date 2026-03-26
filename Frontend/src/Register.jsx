import React, { useState } from 'react';

export default function Register({ onRegister }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !password) return;
    onRegister({ name, password, role });
    setName('');
    setPassword('');
    setRole('customer');
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={e => setName(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      <select value={role} onChange={e => setRole(e.target.value)}>
        <option value="customer">Customer</option>
        <option value="admin">Admin</option>
      </select>
      <button type="submit">Register</button>
    </form>
  );
}
