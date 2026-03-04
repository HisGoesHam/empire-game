import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyCV1h_Mr-Q1AOZYHLCT57_5BvOcNfX8uAY",
  authDomain: "empire-b97dc.firebaseapp.com",
  databaseURL: "https://empire-b97dc-default-rtdb.firebaseio.com",
  projectId: "empire-b97dc",
  storageBucket: "empire-b97dc.firebasestorage.app",
  messagingSenderId: "853860038340",
  appId: "1:853860038340:web:82d9aa7322edaeb474fb91",
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)