// Correctly import Firebase methods
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { renderRegistrationForm } from './registration.js';
import { renderMainApp } from './mainApp.js';
import { firebaseConfig } from './firebaseConfig.js';
import { checkIfUserExists } from './firestore.js';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Entry point: Check authentication state
onAuthStateChanged(auth, (user) => {
  appContainer.innerHTML = '';

  if (user) {
    appContainer.innerHTML = `<h2>Welcome, ${user.displayName}</h2><button id="logoutBtn">Logout</button>`;
    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await auth.signOut();
      location.reload();
    });
  } else {
    appContainer.innerHTML = `<button id="googleLoginBtn">Login with Google</button>`;
    document
      .getElementById('googleLoginBtn')
      .addEventListener('click', async () => {
        const provider = new GoogleAuthProvider();
        try {
          await signInWithPopup(auth, provider);
        } catch (error) {
          console.error('Login Failed:', error);
        }
      });
  }
});

// Function to render Google Login Button
function renderLogin() {
  const appContainer = document.getElementById('app');
  appContainer.innerHTML = `
    <h2>Login</h2>
    <button id="googleLoginBtn">Login with Google</button>
  `;

  document
    .getElementById('googleLoginBtn')
    .addEventListener('click', async () => {
      const provider = new GoogleAuthProvider();
      try {
        await signInWithPopup(auth, provider);
      } catch (error) {
        console.error('Login Failed:', error);
      }
    });
}
