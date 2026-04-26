const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'rides.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bank_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    access_token TEXT NOT NULL,
    item_id TEXT UNIQUE NOT NULL,
    institution_name TEXT,
    cursor TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    synced_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS rides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    account_id INTEGER NOT NULL REFERENCES bank_accounts(id),
    transaction_id TEXT UNIQUE NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    merchant_name TEXT,
    description TEXT,
    is_free INTEGER DEFAULT 0,
    week_start TEXT NOT NULL,
    ride_number_in_week INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

module.exports = db;
