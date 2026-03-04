# ♛ Empire — Deploy Guide

A multiplayer party game of nicknames and conquest.

---

## Step 1 — Set up Firebase (free, ~5 min)

1. Go to **https://console.firebase.google.com**
2. Click **"Add project"** → give it a name (e.g. `empire-game`) → Continue
3. Disable Google Analytics if you don't need it → **Create project**
4. Once created, click **"Add app"** (the `</>` web icon)
5. Give it a nickname (e.g. `empire-web`) → **Register app**
6. You'll see a `firebaseConfig` object — **copy all the values**
7. Open `src/firebase.js` and paste each value into the matching field

### Enable Realtime Database
1. In the Firebase console left sidebar → **Build → Realtime Database**
2. Click **"Create database"**
3. Choose a region (any is fine) → **Next**
4. Select **"Start in test mode"** → **Enable**
   *(This allows open reads/writes for 30 days — fine for a party game.
   After 30 days, update the rules to `".read": true, ".write": true` manually.)*

---

## Step 2 — Deploy to Vercel (free, ~3 min)

### Option A: GitHub + Vercel (recommended)

1. Push this folder to a new GitHub repo:
   ```
   git init
   git add .
   git commit -m "initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/empire-game.git
   git push -u origin main
   ```
2. Go to **https://vercel.com** → sign in with GitHub
3. Click **"Add New Project"** → import your repo
4. Leave all settings as default → **Deploy**
5. In ~60 seconds you'll get a live URL like `https://empire-game.vercel.app`

### Option B: Vercel CLI (even faster)

```bash
npm install -g vercel
npm install
vercel
```
Follow the prompts — it deploys automatically.

---

## Step 3 — Share with players

Send everyone the Vercel URL. That's it!

- **Gamemaster** taps "Create Room" → gets a 5-letter code
- **Players** tap "Join Room" → enter the code + their name
- Everyone submits their nickname on their own phone
- Gamemaster reads the list aloud, then the game is played in person

---

## Local development

```bash
npm install
npm run dev
```

Then open http://localhost:5173
