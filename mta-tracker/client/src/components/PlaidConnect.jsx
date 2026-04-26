import React, { useState, useEffect, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { api } from '../api';

export default function PlaidConnect({ onConnected, small }) {
  const [linkToken, setLinkToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function fetchLinkToken() {
    setLoading(true);
    setError('');
    try {
      const data = await api.plaid.createLinkToken();
      setLinkToken(data.link_token);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  const onSuccess = useCallback(
    async (public_token, metadata) => {
      try {
        await api.plaid.exchangeToken(public_token, metadata.institution?.name);
        onConnected?.();
      } catch (err) {
        setError(err.message);
      }
    },
    [onConnected]
  );

  const { open, ready } = usePlaidLink({ token: linkToken, onSuccess });

  useEffect(() => {
    if (linkToken && ready) {
      open();
      setLoading(false);
    }
  }, [linkToken, ready, open]);

  return (
    <div>
      <button
        className={small ? 'btn-link-small' : 'btn-link'}
        onClick={fetchLinkToken}
        disabled={loading}
        type="button"
      >
        {loading ? 'Opening…' : small ? '+ Add Account' : '🔗 Connect Bank Account'}
      </button>
      {error && <p className="error" style={{ marginTop: '0.5rem' }}>{error}</p>}
    </div>
  );
}
