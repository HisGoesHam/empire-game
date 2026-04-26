const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

function getCurrentWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Roll back to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().split('T')[0];
}

router.get('/week', auth, (req, res) => {
  const weekStart = req.query.week || getCurrentWeekStart();

  const rides = db.prepare(`
    SELECT r.*, ba.institution_name
    FROM rides r
    JOIN bank_accounts ba ON r.account_id = ba.id
    WHERE r.user_id = ? AND r.week_start = ?
    ORDER BY r.date, r.id
  `).all(req.user.id, weekStart);

  const paidRides = rides.filter(r => !r.is_free).length;
  const freeRides = rides.filter(r => r.is_free).length;

  res.json({
    week_start: weekStart,
    rides,
    paid_count: paidRides,
    free_count: freeRides,
    total_count: rides.length,
    rides_until_cap: Math.max(0, 12 - paidRides),
    cap_reached: paidRides >= 12,
  });
});

router.get('/history', auth, (req, res) => {
  const weeks = db.prepare(`
    SELECT
      week_start,
      COUNT(*) as total_rides,
      SUM(CASE WHEN is_free = 0 THEN 1 ELSE 0 END) as paid_rides,
      SUM(CASE WHEN is_free = 1 THEN 1 ELSE 0 END) as free_rides,
      SUM(CASE WHEN is_free = 0 THEN amount ELSE 0 END) as total_spent
    FROM rides
    WHERE user_id = ?
    GROUP BY week_start
    ORDER BY week_start DESC
    LIMIT 12
  `).all(req.user.id);

  res.json(weeks);
});

module.exports = router;
