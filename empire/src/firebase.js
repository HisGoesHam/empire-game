// ─────────────────────────────────────────────────────────────
//  FIREBASE CONFIGURATION
//
//  1. Go to https://console.firebase.google.com
//  2. Create a project (or use an existing one)
//  3. Click "Add app" → Web → register the app
//  4. Copy your firebaseConfig values below
//  5. In the Firebase console, go to Build → Realtime Database
//     → Create database → Start in TEST MODE (for development)
// ─────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey:            "PASTE_YOUR_API_KEY_HERE",
  authDomain:        "PASTE_YOUR_AUTH_DOMAIN_HERE",
  databaseURL:       "PASTE_YOUR_DATABASE_URL_HERE",
  projectId:         "PASTE_YOUR_PROJECT_ID_HERE",
  storageBucket:     "PASTE_YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "PASTE_YOUR_MESSAGING_SENDER_ID_HERE",
  appId:             "PASTE_YOUR_APP_ID_HERE",
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
