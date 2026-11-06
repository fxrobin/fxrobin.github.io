// Initialisation Firebase partagée par la page élève et la page prof.
// ?emu=1 dans l'URL : utilise les émulateurs locaux (auth :9099, database :9000).
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import {
  getAuth, connectAuthEmulator, signInAnonymously, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut,
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {
  getDatabase, connectDatabaseEmulator, ref, onValue, set, update, get, remove, serverTimestamp, runTransaction,
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js';

const config = {
  apiKey: 'AIzaSyC4jxkAigXA4at6ayh2Befb1aO_huqDUEM',
  authDomain: 'quizz-insa.firebaseapp.com',
  databaseURL: 'https://quizz-insa-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'quizz-insa',
  storageBucket: 'quizz-insa.firebasestorage.app',
  messagingSenderId: '230344289140',
  appId: '1:230344289140:web:178e5d860ff1409c56da21',
};

export function useEmulators() {
  return new URLSearchParams(location.search).get('emu') === '1';
}

const emu = useEmulators();
const host = location.hostname;

export const app = initializeApp(emu
  ? { ...config, projectId: 'demo-quizz', databaseURL: `http://${host}:9000?ns=demo-quizz-default-rtdb` }
  : config);
export const auth = getAuth(app);
export const db = getDatabase(app);

if (emu) {
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  connectDatabaseEmulator(db, host, 9000);
}

let offset = 0;
onValue(ref(db, '.info/serverTimeOffset'), (snap) => { offset = snap.val() || 0; });

/** Heure locale corrigée par l'écart avec le serveur Firebase (ms). */
export function serverNow() {
  return Date.now() + offset;
}

export {
  ref, onValue, set, update, get, remove, serverTimestamp, runTransaction,
  signInAnonymously, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut,
};
