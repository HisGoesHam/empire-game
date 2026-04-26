const express = require('express');
const { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } = require('plaid');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

const plaidConfig = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});
const plaid = new PlaidApi(plaidConfig);

const MTA_PATTERNS = [
  'OMNY', 'MTA', 'NYC TRANSIT', 'METRO NORTH', 'METRO-NORTH',
  'LIRR', 'LONG ISLAND RAIL', 'NJ TRANSIT', 'PATH TRAIN',
];

function isMtaRide(tx) {
  const name = (tx.merchant_name || tx.name || '').toUpperCase();
  return MTA_PATTERNS.some(p => name.includes(p)) && tx.amount > 0;
}

// Returns the Monday of the week for a given YYYY-MM-DD date string
function getWeekStart(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return monday.toISOString().split('T')[0];
}

// Recalculates ride_number_in_week and is_free for all of a user's rides.
// Called after every sync so the 12-ride cap is always accurate.
function recalcWeekRideNumbers(userId) {
  const rides = db.prepare(`
    SELECT id, week_start FROM rides
    WHERE user_id = ?
    ORDER BY week_start, date, id
  `).all(userId);

  const byWeek = {};
  for (const ride of rides) {
    (byWeek[ride.week_start] = byWeek[ride.week_start] || []).push(ride.id);
  }

  const update = db.prepare('UPDATE rides SET ride_number_in_week = ?, is_free = ? WHERE id = ?');
  const batchUpdate = db.transaction((groups) => {
    for (const ids of Object.values(groups)) {
      ids.forEach((id, i) => {
        const num = i + 1;
        update.run(num, num > 12 ? 1 : 0, id);
      });
    }
  });
  batchUpdate(byWeek);
}

router.post('/create-link-token', auth, async (req, res) => {
  try {
    const response = await plaid.linkTokenCreate({
      user: { client_user_id: req.user.id.toString() },
      client_name: 'MTA Ride Tracker',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    });
    res.json({ link_token: response.data.link_token });
  } catch (err) {
    console.error('Plaid link token error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to create Plaid link token' });
  }
});

router.post('/exchange-token', auth, async (req, res) => {
  const { public_token, institution_name } = req.body;
  if (!public_token) return res.status(400).json({ error: 'public_token required' });

  try {
    const response = await plaid.itemPublicTokenExchange({ public_token });
    const { access_token, item_id } = response.data;

    const existing = db.prepare('SELECT id FROM bank_accounts WHERE item_id = ?').get(item_id);
    if (!existing) {
      db.prepare(`
        INSERT INTO bank_accounts (user_id, access_token, item_id, institution_name)
        VALUES (?, ?, ?, ?)
      `).run(req.user.id, access_token, item_id, institution_name || 'Unknown Bank');
    }
    res.json({ success: true, institution_name });
  } catch (err) {
    console.error('Plaid exchange error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to link bank account' });
  }
});

router.post('/sync', auth, async (req, res) => {
  const accounts = db.prepare('SELECT * FROM bank_accounts WHERE user_id = ?').all(req.user.id);
  if (!accounts.length) return res.status(400).json({ error: 'No bank accounts connected' });

  let newRidesTotal = 0;

  for (const account of accounts) {
    try {
      let cursor = account.cursor || undefined;
      let hasMore = true;
      let newRides = 0;

      while (hasMore) {
        const response = await plaid.transactionsSync({
          access_token: account.access_token,
          cursor,
          options: { days_requested: 90 },
        });

        const { added, modified, removed, next_cursor, has_more } = response.data;
        cursor = next_cursor;
        hasMore = has_more;

        // Upsert added/modified MTA transactions
        const upsert = db.prepare(`
          INSERT OR REPLACE INTO rides
            (user_id, account_id, transaction_id, amount, date, merchant_name, description, week_start)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const tx of [...added, ...modified]) {
          if (!isMtaRide(tx)) continue;
          upsert.run(
            req.user.id,
            account.id,
            tx.transaction_id,
            tx.amount,
            tx.date,
            tx.merchant_name || null,
            tx.name || null,
            getWeekStart(tx.date)
          );
          newRides++;
        }

        // Remove deleted transactions
        for (const tx of removed) {
          db.prepare('DELETE FROM rides WHERE transaction_id = ?').run(tx.transaction_id);
        }
      }

      db.prepare('UPDATE bank_accounts SET cursor = ?, synced_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(cursor, account.id);

      newRidesTotal += newRides;
    } catch (err) {
      console.error(`Sync error for account ${account.id}:`, err.response?.data || err.message);
    }
  }

  // Recompute ride numbers and free-ride flags after all accounts are synced
  recalcWeekRideNumbers(req.user.id);

  res.json({ new_rides: newRidesTotal });
});

router.get('/accounts', auth, (req, res) => {
  const accounts = db.prepare(`
    SELECT id, institution_name, synced_at, created_at
    FROM bank_accounts WHERE user_id = ?
    ORDER BY created_at
  `).all(req.user.id);
  res.json(accounts);
});

module.exports = router;
