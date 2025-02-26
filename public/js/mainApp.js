// Updated mainApp.js
import { navigateTo } from './router';
import { signOutUser } from './auth';

export function renderMainApp() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <h2>Main App Dashboard</h2>
    <button id="startDailyQuiz">Take Daily Quiz</button>
    <button id="logoutBtn">Logout</button>
    <div id="dailyQuizPage" class="page" style="display:none;">
      <h2>Daily Quiz</h2>
      <p>Daily quiz content will go here.</p>
      <button id="backToDashboard">Back to Dashboard</button>
    </div>
  `;

  document.getElementById('startDailyQuiz').addEventListener('click', () => {
    navigateTo('dailyQuizPage');
  });

  document.getElementById('backToDashboard').addEventListener('click', () => {
    renderMainApp();
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    signOutUser();
  });
}