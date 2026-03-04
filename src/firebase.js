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

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCV1h_Mr-Q1AOZYHLCT57_5BvOcNfX8uAY",
  authDomain: "empire-b97dc.firebaseapp.com",
  databaseURL: "https://empire-b97dc-default-rtdb.firebaseio.com",
  projectId: "empire-b97dc",
  storageBucket: "empire-b97dc.firebasestorage.app",
  messagingSenderId: "853860038340",
  appId: "1:853860038340:web:82d9aa7322edaeb474fb91",
  measurementId: "G-05V5G6N9H0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
