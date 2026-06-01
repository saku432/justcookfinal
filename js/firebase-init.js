// ============================================================
// JustCook — Firebase Configuration
// ============================================================
// HOW TO USE:
//   1. Go to https://console.firebase.google.com
//   2. Create a project → Add Web App → copy the config below
//   3. Enable Firestore Database (Build > Firestore)
//   4. Enable Authentication > Email/Password (for admin login)
//   5. Replace the dummy values below with your real keys
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged }
    from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
    getFirestore,
    collection, addDoc, getDocs, getDoc, doc, updateDoc,
    query, where, orderBy, limit,
    onSnapshot, serverTimestamp, setDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ── YOUR FIREBASE CONFIG ──────────────────────────────────
const firebaseConfig = {
    apiKey:            "AIzaSyBGBxYgrLBhfKlY6HodJUaklNvhqeClRTY",
    authDomain:        "justcook-4f983.firebaseapp.com",
    projectId:         "justcook-4f983",
    storageBucket:     "justcook-4f983.firebasestorage.app",
    messagingSenderId: "770641045350",
    appId:             "1:770641045350:web:b908f47a12396802b60aa7",
    measurementId:     "G-76Z73Y2XP3"
};

// ── Init ──────────────────────────────────────────────────
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── Expose to window (used by non-module page scripts) ───
window.firebaseAuth = auth;
window.firebaseDb   = db;

window.Firebase = {
    // Firestore helpers
    db, collection, addDoc, getDocs, getDoc, doc, updateDoc,
    query, where, orderBy, limit,
    onSnapshot, serverTimestamp, setDoc, deleteDoc,
    // Auth helpers
    auth, signInWithEmailAndPassword, signOut, onAuthStateChanged
};

// ── Auth state listener ───────────────────────────────────
onAuthStateChanged(auth, (user) => {
    window._fbUser = user || null;
    window.dispatchEvent(new CustomEvent('fb-auth-changed', { detail: { user } }));
});

export { auth, db };
