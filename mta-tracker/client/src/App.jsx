import React, { useState } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [email, setEmail] = useState(() => localStorage.getItem('email'));

  function handleLogin(data) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('email', data.email);
    setToken(data.token);
    setEmail(data.email);
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    setToken(null);
    setEmail(null);
  }

  if (!token) return <Auth onLogin={handleLogin} />;
  return <Dashboard email={email} onLogout={handleLogout} />;
}
