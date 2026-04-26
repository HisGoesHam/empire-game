# MTA Ride Tracker

Automatically tracks your weekly MTA rides by monitoring OMNY charges in your bank account. The NYC MTA OMNY system caps weekly fares after **12 paid rides** — every subsequent ride that week is free. This app tells you exactly where you stand.

## How It Works

1. You connect your bank account via [Plaid](https://plaid.com) (the same secure link used by apps like Venmo and Robinhood).
2. The app scans for OMNY/MTA transactions and counts them per week (Monday–Sunday).
3. Your dashboard shows how many paid rides you've taken, how many remain until the cap, and whether free rides have kicked in.
4. Hit **Sync** at any time to pull the latest transactions.

## MTA Weekly Cap

Under the OMNY system, after 12 paid full-fare rides in a Monday–Sunday week, all additional rides are free. The cap resets every Monday. This app helps you know the moment you've hit it.

## Setup

### 1. Get Plaid API credentials

- Sign up at [dashboard.plaid.com](https://dashboard.plaid.com)
- Create an app and copy your **Client ID** and **Secret**
- Use `sandbox` environment to test with fake bank data, `development` for real accounts (requires Plaid approval)

### 2. Configure environment

```bash
cd mta-tracker
cp .env.example .env
# Edit .env with your Plaid credentials and a random JWT_SECRET
```

### 3. Install dependencies

```bash
npm run install:all
```

### 4. Run the app

```bash
npm run dev
```

- Frontend: http://localhost:5173  
- Backend API: http://localhost:3001

## Stack

- **Backend**: Node.js + Express, SQLite (via `better-sqlite3`), Plaid Node SDK
- **Frontend**: React + Vite, `react-plaid-link`
- **Auth**: JWT (30-day tokens)

## MTA Transaction Detection

The sync engine flags transactions as MTA rides if the merchant name contains any of:

`OMNY`, `MTA`, `NYC TRANSIT`, `METRO NORTH`, `METRO-NORTH`, `LIRR`, `LONG ISLAND RAIL`, `NJ TRANSIT`, `PATH TRAIN`

Only positive-amount charges are counted (refunds are excluded).
