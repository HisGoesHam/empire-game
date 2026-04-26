const BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...options.headers,
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  auth: {
    login: (email, password) =>
      request('/auth/login', { method: 'POST', body: { email, password } }),
    register: (email, password) =>
      request('/auth/register', { method: 'POST', body: { email, password } }),
  },
  plaid: {
    createLinkToken: () => request('/plaid/create-link-token', { method: 'POST' }),
    exchangeToken: (public_token, institution_name) =>
      request('/plaid/exchange-token', { method: 'POST', body: { public_token, institution_name } }),
    sync: () => request('/plaid/sync', { method: 'POST' }),
    getAccounts: () => request('/plaid/accounts'),
  },
  rides: {
    getWeek: (week) => request('/rides/week' + (week ? `?week=${week}` : '')),
    getHistory: () => request('/rides/history'),
  },
};
