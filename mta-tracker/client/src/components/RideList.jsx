import React from 'react';

export default function RideList({ rides, title }) {
  return (
    <div className="card ride-list">
      <h2>{title}</h2>
      <div className="ride-rows">
        {rides.map(ride => (
          <div key={ride.id} className={`ride-row${ride.is_free ? ' ride-free' : ''}`}>
            <span className="ride-icon">🚇</span>
            <div className="ride-info">
              <span className="ride-desc">{ride.merchant_name || ride.description || 'MTA Ride'}</span>
              <span className="ride-date">{formatDate(ride.date)}</span>
            </div>
            <div className="ride-right">
              <span className="ride-num">#{ride.ride_number_in_week}</span>
              {ride.is_free ? (
                <span className="ride-amount ride-amount-free">FREE</span>
              ) : (
                <span className="ride-amount">${parseFloat(ride.amount).toFixed(2)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
