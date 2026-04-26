import React from 'react';

const CAP = 12;

export default function RideCounter({ paidCount, freeCount, ridesUntilCap, capReached, weekStart }) {
  const progress = Math.min(paidCount / CAP, 1);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const weekLabel = weekStart
    ? 'Week of ' +
      new Date(weekStart + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : '';

  return (
    <div className={`counter-card${capReached ? ' cap-reached' : ''}`}>
      <div className="counter-inner">
        <div className="progress-ring-wrap">
          <svg width="200" height="200" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="14" />
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={capReached ? '#10b981' : '#2563eb'}
              strokeWidth="14"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
              style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease' }}
            />
          </svg>
          <div className="ring-center">
            <span className="ring-num">{paidCount}</span>
            <span className="ring-denom">/ {CAP}</span>
            <span className="ring-label">paid rides</span>
          </div>
        </div>

        <div className="counter-status">
          <p className="week-label">{weekLabel}</p>
          {capReached ? (
            <div>
              <div className="cap-badge">🎉 Cap Reached!</div>
              <p className="cap-msg">Every ride is free for the rest of this week.</p>
              {freeCount > 0 && (
                <p className="free-tally">
                  {freeCount} free ride{freeCount !== 1 ? 's' : ''} taken so far
                </p>
              )}
            </div>
          ) : (
            <div>
              <p className="until-cap">
                <strong>{ridesUntilCap}</strong> ride{ridesUntilCap !== 1 ? 's' : ''} until free rides
              </p>
              <div className="pip-row" aria-label={`${paidCount} of ${CAP} rides taken`}>
                {Array.from({ length: CAP }).map((_, i) => (
                  <div key={i} className={`pip${i < paidCount ? ' pip-on' : ''}`} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
