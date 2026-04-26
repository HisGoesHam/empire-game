import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import RideCounter from './RideCounter';
import PlaidConnect from './PlaidConnect';
import RideList from './RideList';

export default function Dashboard({ email, onLogout }) {
  const [weekData, setWeekData] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [history, setHistory] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [week, accts, hist] = await Promise.all([
        api.rides.getWeek(),
        api.plaid.getAccounts(),
        api.rides.getHistory(),
      ]);
      setWeekData(week);
      setAccounts(accts);
      setHistory(hist);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSync() {
    setSyncing(true);
    setSyncMsg('');
    try {
      const result = await api.plaid.sync();
      setSyncMsg(`Synced — ${result.new_rides} new ride${result.new_rides !== 1 ? 's' : ''} found.`);
      await loadData();
    } catch (err) {
      setSyncMsg(err.message);
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading your rides…</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="topbar">
        <div className="topbar-left">
          <span className="topbar-logo">🚇</span>
          <h1>MTA Ride Tracker</h1>
        </div>
        <div className="topbar-right">
          <span className="topbar-email">{email}</span>
          <button className="btn-signout" onClick={onLogout}>Sign Out</button>
        </div>
      </header>

      <main className="main">
        {weekData && (
          <RideCounter
            paidCount={weekData.paid_count}
            freeCount={weekData.free_count}
            ridesUntilCap={weekData.rides_until_cap}
            capReached={weekData.cap_reached}
            weekStart={weekData.week_start}
          />
        )}

        <div className="card">
          {accounts.length === 0 ? (
            <div className="connect-prompt">
              <h2>Connect Your Bank</h2>
              <p>
                Link your bank account to automatically detect OMNY/MTA charges and track your weekly rides.
                Your credentials are never stored — Plaid handles the secure connection.
              </p>
              <PlaidConnect onConnected={() => { loadData(); handleSync(); }} />
            </div>
          ) : (
            <div className="sync-bar">
              <div className="accounts-row">
                {accounts.map(a => (
                  <span key={a.id} className="account-chip">
                    🏦 {a.institution_name}
                    {a.synced_at && (
                      <span className="chip-time"> · {timeAgo(a.synced_at)}</span>
                    )}
                  </span>
                ))}
                <PlaidConnect onConnected={() => { loadData(); handleSync(); }} small />
              </div>
              <div className="sync-row">
                <button className="btn-sync" onClick={handleSync} disabled={syncing}>
                  {syncing ? '⟳ Syncing…' : '⟳ Sync Now'}
                </button>
                {syncMsg && <span className="sync-msg">{syncMsg}</span>}
              </div>
            </div>
          )}
        </div>

        {weekData?.rides?.length > 0 && (
          <RideList rides={weekData.rides} title="This Week's Rides" />
        )}

        {history.length > 0 && (
          <div className="card history-card">
            <h2>Weekly History</h2>
            <div className="history-grid">
              {history.map(week => (
                <div key={week.week_start} className="history-item">
                  <div className="hi-week">{formatWeek(week.week_start)}</div>
                  <div className="hi-stats">
                    <span className="hi-paid">{week.paid_rides} paid</span>
                    {week.free_rides > 0 && (
                      <span className="hi-free">{week.free_rides} free</span>
                    )}
                  </div>
                  <div className="hi-spent">${parseFloat(week.total_spent || 0).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatWeek(weekStart) {
  return new Date(weekStart + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  }) + ' week';
}
