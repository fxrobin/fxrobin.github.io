// Outils communs aux pages enseignant (régie et écran projeté).
import {
  auth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, useEmulators,
} from './firebase.js';
import { show } from './ui.js';

export const TEACHER = 'fxrobin@gmail.com';
export const $ = (id) => document.getElementById(id);
export const el = (tag, props = {}, ...children) => {
  const n = Object.assign(document.createElement(tag), props);
  n.append(...children);
  return n;
};

/** Adresse d'une page voisine, en gardant le mode émulateur. */
export const pageUrl = (file) => new URL(`./${file}${useEmulators() ? '?emu=1' : ''}`, location.href).href;
export const studentUrl = () => pageUrl('');

/** QR code de la page élève (bibliothèque qrcode-generator chargée par la page). */
export function qrSvg() {
  const qr = qrcode(0, 'M');
  qr.addData(studentUrl());
  qr.make();
  const box = el('div', { className: 'qr' });
  box.innerHTML = qr.createSvgTag({ cellSize: 8, margin: 2, scalable: true });
  return box;
}

/**
 * Connexion Google réservée à l'enseignant (les règles Firebase le vérifient aussi).
 * Les fenêtres d'un même navigateur partagent la session : la seconde page s'ouvre déjà connectée.
 */
export function teacherLogin(pages, onReady) {
  $('login-btn').addEventListener('click', () => signInWithPopup(auth, new GoogleAuthProvider()).catch((e) => {
    $('login-msg').textContent = `Connexion impossible : ${e.code || e.message}`;
  }));
  onAuthStateChanged(auth, (user) => {
    if (!user || user.isAnonymous) {
      $('login-msg').textContent = '';
      return show(pages, 'login');
    }
    if (user.email !== TEACHER || !user.emailVerified) {
      $('login-msg').textContent = `Accès réservé à l'enseignant (connecté en tant que ${user.email}).`;
      signOut(auth);
      return show(pages, 'login');
    }
    onReady();
  });
}
