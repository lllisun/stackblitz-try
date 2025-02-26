// Enhanced app.js with improved design and functionality

// Listen for auth state changes
function addQuizButtonListeners() {
  const dailyQuizBtn = document.getElementById('dailyQuizBtn');

  if (dailyQuizBtn) {
    dailyQuizBtn.addEventListener('click', () => {
      console.log('app.js: About to call renderDailyQuiz().');
      if (typeof window.renderDailyQuiz === 'function') {
        console.log(
          'app.js: renderDailyQuiz IS defined (just before calling).'
        );
        // Add loading animation
        dailyQuizBtn.innerHTML =
          '<span class="loading-spinner"></span> Loading Quiz...';
        dailyQuizBtn.disabled = true;

        // Show quiz with slight delay for better UX
        setTimeout(() => {
          window.renderDailyQuiz();
          dailyQuizBtn.innerHTML = 'Take Daily Quiz';
          dailyQuizBtn.disabled = false;
        }, 300);
      } else {
        console.error(
          'app.js: renderDailyQuiz is NOT defined (just before calling)!'
        );
        showNotification(
          'Error loading quiz. Please refresh the page.',
          'error'
        );
      }
    });
  }
}

// Show notification
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach((notification) => notification.remove());

  // Create notification
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <span class="notification-message">${message}</span>
    <button class="close-btn">&times;</button>
  `;

  // Add to DOM
  document.body.appendChild(notification);

  // Add close button functionality
  notification.querySelector('.close-btn').addEventListener('click', () => {
    notification.classList.add('notification-hiding');
    setTimeout(() => notification.remove(), 300);
  });

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.classList.add('notification-hiding');
      setTimeout(() => {
        if (document.body.contains(notification)) {
          notification.remove();
        }
      }, 300);
    }
  }, 5000);
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return date.toLocaleDateString(undefined, options);
}

// Render the logged in user view with today's data
function renderLoggedInView(user, userData) {
  const appContainer = document.getElementById('app');
  const today = new Date().toISOString().split('T')[0];
  const currentDate = formatDate(today);

  // First render the basic structure with improved layout
  appContainer.innerHTML = `
    <header class="app-header">
      <h2>Welcome, ${user.displayName || 'User'}</h2>
      <p class="current-date">${currentDate}</p>
    </header>
    
    <div id="todaysCheckIn">
      <h3>Today's Check-In</h3>
      <div id="checkInStatus">
        <div class="loader-container">
          <div class="loader"></div>
          <p>Loading today's data...</p>
        </div>
      </div>
    </div>
    
    <div class="actions-container">
      <button id="dailyQuizBtn" class="quiz-button">Take Daily Quiz</button>
      <button id="viewHistoryBtn" class="history-button">View History</button>
      <button id="logoutBtn">Logout</button>
    </div>
    
    <div id="dailyQuizContainer" style="display: none;"></div>
    <div id="historyContainer" style="display: none;"></div>
  `;

  // Set up button event listeners
  addQuizButtonListeners();

  // History button listener
  document.getElementById('viewHistoryBtn').addEventListener('click', () => {
    const historyContainer = document.getElementById('historyContainer');
    const dailyQuizContainer = document.getElementById('dailyQuizContainer');

    if (historyContainer.style.display === 'none') {
      historyContainer.style.display = 'block';
      dailyQuizContainer.style.display = 'none';
      renderHistory(user.uid);
      document.getElementById('viewHistoryBtn').textContent = 'Hide History';
    } else {
      historyContainer.style.display = 'none';
      document.getElementById('viewHistoryBtn').textContent = 'View History';
    }
  });

  // Logout button listener
  document.getElementById('logoutBtn').addEventListener('click', () => {
    firebase
      .auth()
      .signOut()
      .then(() => {
        console.log('User signed out');
        showNotification('Successfully logged out', 'success');
      })
      .catch((error) => {
        console.error('Sign out error:', error);
        showNotification('Error signing out', 'error');
      });
  });
}

// Render user history view
async function renderHistory(userId) {
  const historyContainer = document.getElementById('historyContainer');
  historyContainer.innerHTML = '<div class="loader"></div>';

  try {
    // Get user's daily logs
    const logsSnapshot = await firebase
      .firestore()
      .collection('users')
      .doc(userId)
      .collection('dailyLogs')
      .orderBy('date', 'desc')
      .limit(14) // Last two weeks
      .get();

    if (logsSnapshot.empty) {
      historyContainer.innerHTML = '<p>No history available yet.</p>';
      return;
    }

    // Generate history UI
    let historyHTML = `
      <div class="history-section">
        <h3>Your Recent Check-Ins</h3>
        <div class="history-grid">
    `;

    logsSnapshot.forEach((doc) => {
      const data = doc.data();
      const date = data.date;
      const formattedDate = formatDate(date);

      // Calculate summary data
      const wellbeing = data.wellbeing || 0;
      const sleepHours = data.sleep?.hours || 0;
      const sleepQuality = data.sleep?.quality || 0;
      const stressLevel = data.stressLevel || 0;

      // Generate wellbeing emoji
      let wellbeingEmoji = '😐';
      if (wellbeing >= 4) wellbeingEmoji = '😊';
      if (wellbeing >= 5) wellbeingEmoji = '😄';
      if (wellbeing <= 2) wellbeingEmoji = '😔';
      if (wellbeing <= 1) wellbeingEmoji = '😢';

      historyHTML += `
        <div class="history-card" data-date="${date}">
          <div class="history-date">${formattedDate}</div>
          <div class="history-summary">
            <div class="wellbeing-indicator">${wellbeingEmoji}</div>
            <div class="sleep-info">
              <span class="sleep-hours">${sleepHours}h</span>
              <div class="sleep-quality-indicator" style="width: ${
                sleepQuality * 20
              }%"></div>
            </div>
            <div class="stress-indicator" style="height: ${
              stressLevel * 20
            }%"></div>
          </div>
          <button class="view-details-btn" data-date="${date}">View Details</button>
        </div>
      `;
    });

    historyHTML += `
        </div>
      </div>
      <div id="historyDetails" class="history-details"></div>
    `;

    historyContainer.innerHTML = historyHTML;

    // Add event listeners to view detail buttons
    document.querySelectorAll('.view-details-btn').forEach((btn) => {
      btn.addEventListener('click', function () {
        const date = this.getAttribute('data-date');
        showHistoryDetail(userId, date);
      });
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    historyContainer.innerHTML =
      '<p>Error loading history. Please try again.</p>';
  }
}

// Show detailed history for a specific date
async function showHistoryDetail(userId, date) {
  const detailsContainer = document.getElementById('historyDetails');
  detailsContainer.innerHTML = '<div class="loader"></div>';

  try {
    const docRef = firebase
      .firestore()
      .collection('users')
      .doc(userId)
      .collection('dailyLogs')
      .doc(date);

    const doc = await docRef.get();
    if (!doc.exists) {
      detailsContainer.innerHTML = '<p>No data available for this date.</p>';
      return;
    }

    const data = doc.data();
    const formattedDate = formatDate(date);

    // Generate formatted detail view
    let detailsHTML = `
      <h3>Details for ${formattedDate}</h3>
      <div class="details-container">
    `;

    // Add wellbeing data
    detailsHTML += `
      <div class="detail-section">
        <h4>Wellbeing & Stress</h4>
        <p>Wellbeing: <strong>${getWellbeingText(data.wellbeing)}</strong></p>
        <p>Stress Level: <strong>${getStressText(data.stressLevel)}</strong></p>
      </div>
    `;

    // Add sleep data
    if (data.sleep) {
      detailsHTML += `
        <div class="detail-section">
          <h4>Sleep</h4>
          <p>Sleep Duration: <strong>${data.sleep.hours} hours</strong></p>
          <p>Sleep Quality: <strong>${getSleepQualityText(
            data.sleep.quality
          )}</strong></p>
      `;

      // Add sleep issues if any
      const sleepIssueKeys = Object.keys(data).filter((key) =>
        key.startsWith('sleepIssuesChecklist_')
      );
      if (sleepIssueKeys.length > 0) {
        detailsHTML += `<p>Sleep Issues:</p><ul>`;
        sleepIssueKeys.forEach((key) => {
          if (data[key] === 1) {
            const issue = key
              .replace('sleepIssuesChecklist_', '')
              .replace(/_/g, ' ');
            detailsHTML += `<li>${issue}</li>`;
          }
        });
        detailsHTML += `</ul>`;
      }

      detailsHTML += `</div>`;
    }

    // Add habits data if any
    const habitKeys = Object.keys(data).filter((key) =>
      key.startsWith('habitsCompletedChecklist_')
    );
    if (habitKeys.length > 0) {
      detailsHTML += `
        <div class="detail-section">
          <h4>Habits Completed</h4>
          <ul>
      `;

      habitKeys.forEach((key) => {
        if (data[key] === 1) {
          const habit = key
            .replace('habitsCompletedChecklist_', '')
            .replace(/_/g, ' ');
          detailsHTML += `<li>${habit}</li>`;
        }
      });

      detailsHTML += `
          </ul>
        </div>
      `;
    }

    // Add substances data if any
    const substanceKeys = Object.keys(data).filter((key) =>
      key.startsWith('substancesConsumedChecklist_')
    );
    if (substanceKeys.length > 0) {
      detailsHTML += `
        <div class="detail-section">
          <h4>Substances Consumed</h4>
          <ul>
      `;

      substanceKeys.forEach((key) => {
        if (data[key] === 1) {
          const substance = key
            .replace('substancesConsumedChecklist_', '')
            .replace(/_/g, ' ');
          const amountKey = `substanceAmount_${substance.replace(/ /g, '_')}`;

          if (data[amountKey]) {
            detailsHTML += `<li>${substance} - Amount: ${data[amountKey]}</li>`;
          } else {
            detailsHTML += `<li>${substance}</li>`;
          }
        }
      });

      detailsHTML += `
          </ul>
        </div>
      `;
    }

    // Add notes if any
    if (data.notes) {
      detailsHTML += `
        <div class="detail-section">
          <h4>Notes</h4>
          <p class="notes-text">${data.notes}</p>
        </div>
      `;
    }

    detailsHTML += `
      </div>
      <button id="closeDetailsBtn" class="close-details-btn">Close Details</button>
    `;

    detailsContainer.innerHTML = detailsHTML;

    // Add event listener to close button
    document.getElementById('closeDetailsBtn').addEventListener('click', () => {
      detailsContainer.innerHTML = '';
    });
  } catch (error) {
    console.error('Error fetching history details:', error);
    detailsContainer.innerHTML =
      '<p>Error loading details. Please try again.</p>';
  }
}

// Helper functions for text display
function getWellbeingText(value) {
  const wellbeingText = {
    1: 'not well at all',
    2: 'below average',
    3: 'average',
    4: 'good',
    5: 'excellent',
  };
  return wellbeingText[value] || 'unknown';
}

function getSleepQualityText(value) {
  const sleepText = {
    1: 'poor',
    2: 'below average',
    3: 'average',
    4: 'good',
    5: 'excellent',
  };
  return sleepText[value] || 'unknown';
}

function getStressText(value) {
  const stressText = {
    1: 'very low',
    2: 'low',
    3: 'moderate',
    4: 'high',
    5: 'very high',
  };
  return stressText[value] || 'unknown';
}

// Firebase auth state change listener
firebase.auth().onAuthStateChanged((user) => {
  const appContainer = document.getElementById('app');

  if (user) {
    // User is signed in
    console.log('User is signed in:', user);

    // Check if user has completed registration
    firebase
      .firestore()
      .collection('users')
      .doc(user.uid)
      .get()
      .then((doc) => {
        if (doc.exists && doc.data().profile) {
          // User has a profile, render the logged in view
          renderLoggedInView(user, doc.data());

          // Check for today's data
          const today = new Date().toISOString().split('T')[0];
          firebase
            .firestore()
            .collection('users')
            .doc(user.uid)
            .collection('dailyLogs')
            .doc(today)
            .onSnapshot(
              (dailyDoc) => {
                const checkInStatus = document.getElementById('checkInStatus');
                const dailyQuizBtn = document.getElementById('dailyQuizBtn');

                if (dailyDoc.exists && dailyDoc.data().quizCompleted) {
                  // User has completed today's check-in
                  const data = dailyDoc.data();

                  const wellbeingText = getWellbeingText(data.wellbeing);
                  const sleepText = getSleepQualityText(data.sleep?.quality);
                  const stressText = getStressText(data.stressLevel);

                  // Generate emoji indicators
                  let wellbeingEmoji = '😐';
                  if (data.wellbeing >= 4) wellbeingEmoji = '😊';
                  if (data.wellbeing >= 5) wellbeingEmoji = '😄';
                  if (data.wellbeing <= 2) wellbeingEmoji = '😔';
                  if (data.wellbeing <= 1) wellbeingEmoji = '😢';

                  let sleepEmoji = '😴';
                  if (data.sleep?.quality <= 2) sleepEmoji = '🥱';
                  if (data.sleep?.quality >= 4) sleepEmoji = '💤';

                  let stressEmoji = '😌';
                  if (data.stressLevel >= 4) stressEmoji = '😓';
                  if (data.stressLevel >= 5) stressEmoji = '😰';

                  checkInStatus.innerHTML = `
                      <div class="status-overview">
                          <div class="status-card">
                              <span class="status-emoji">${wellbeingEmoji}</span>
                              <p>You're feeling <strong>${wellbeingText}</strong> today</p>
                          </div>
                          
                          <div class="status-card">
                              <span class="status-emoji">${sleepEmoji}</span>
                              <p>You slept for <strong>${
                                data.sleep?.hours || 0
                              } hours</strong> and the quality was <strong>${sleepText}</strong></p>
                          </div>
                          
                          <div class="status-card">
                              <span class="status-emoji">${stressEmoji}</span>
                              <p>Your stress level is <strong>${stressText}</strong></p>
                          </div>
                      </div>
                      ${
                        data.notes
                          ? `<div class="notes-section"><p>Notes: <em>"${data.notes}"</em></p></div>`
                          : ''
                      }
                  `;

                  const retakeLink = document.createElement('p');
                  retakeLink.className = 'retake-link';
                  retakeLink.innerHTML =
                    '<a href="#" id="retakeQuizLink">Retake today\'s check-in</a>';
                  checkInStatus.appendChild(retakeLink);

                  document
                    .getElementById('retakeQuizLink')
                    .addEventListener('click', (e) => {
                      e.preventDefault();
                      const dailyQuizBtn =
                        document.getElementById('dailyQuizBtn');
                      const dailyQuizContainer =
                        document.getElementById('dailyQuizContainer');

                      if (dailyQuizContainer) {
                        dailyQuizContainer.style.display = 'block';
                        dailyQuizContainer.innerHTML =
                          '<div class="loader"></div><p>Loading quiz...</p>';
                      }

                      // Try both approaches to ensure the quiz loads
                      if (typeof window.renderDailyQuiz === 'function') {
                        window.renderDailyQuiz();
                      } else if (dailyQuizBtn) {
                        dailyQuizBtn.click(); // Fallback to clicking the button
                      }
                    });

                  // Hide the quiz button
                  if (dailyQuizBtn) {
                    dailyQuizBtn.style.display = 'none';
                  }
                } else {
                  // User hasn't completed today's check-in or data was deleted
                  checkInStatus.innerHTML = `
                    <div class="empty-status">
                      <div class="empty-icon">📋</div>
                      <p>You haven't completed today's check-in yet.</p>
                      <p>Click the button below to record how you're doing today!</p>
                    </div>
                  `;

                  // Show the quiz button
                  if (dailyQuizBtn) {
                    dailyQuizBtn.style.display = 'block';
                    // Re-add the event listener to ensure it works
                    addQuizButtonListeners();
                  }
                }
              },
              (error) => {
                console.error("Error fetching today's data:", error);
                document.getElementById('checkInStatus').innerHTML =
                  "<p class='error'>Error loading today's data.</p>";
              }
            );
        } else {
          // User needs to complete registration
          appContainer.innerHTML = `
            <div class="registration-container">
              <h2>Complete Your Profile</h2>
              <p>Please complete your profile to continue using Habit Tracker.</p>
              <div id="registrationForm"></div>
            </div>
          `;
          renderRegistrationForm();
        }
      })
      .catch((error) => {
        console.error('Error checking user profile:', error);
        showNotification('Error loading profile data', 'error');
      });
  } else {
    // No user is signed in
    console.log('No user signed in');
    appContainer.innerHTML = `
      <div class="welcome-container">
        <h2>Welcome to Habit Tracker</h2>
        <p class="welcome-text">Track your daily habits, health metrics, and well-being in one place</p>
        <div class="features-container">
          <div class="feature-card">
            <div class="feature-icon">🛌</div>
            <h3>Track Sleep</h3>
            <p>Monitor your sleep patterns and quality</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">💪</div>
            <h3>Build Habits</h3>
            <p>Build and maintain positive daily habits</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3>Track Progress</h3>
            <p>See trends and patterns in your well-being</p>
          </div>
        </div>
        <button id="googleLoginBtn" class="login-button">Sign in with Google</button>
      </div>
    `;

    // Add Google sign-in handler
    document.getElementById('googleLoginBtn').addEventListener('click', () => {
      const provider = new firebase.auth.GoogleAuthProvider();

      firebase
        .auth()
        .signInWithPopup(provider)
        .then((result) => {
          // This gives you a Google Access Token
          const credential = result.credential;
          const token = credential.accessToken;
          const user = result.user;
          console.log('Successfully signed in:', user);
          showNotification('Successfully signed in!', 'success');
        })
        .catch((error) => {
          console.error('Sign in error:', error);
          showNotification('Sign in failed. Please try again.', 'error');
        });
    });
  }
});

// Initialize additional styles
function initializeAdditionalStyles() {
  // Check if styles already exist
  if (document.getElementById('app-additional-styles')) return;

  // Create style element
  const styleElement = document.createElement('style');
  styleElement.id = 'app-additional-styles';

  // Add CSS rules
  styleElement.textContent = `
    /* Additional styles for enhanced UI */
    .status-overview {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      margin: 15px 0;
    }
    
    .status-card {
      flex: 1;
      min-width: 200px;
      margin: 10px;
      padding: 15px;
      background-color: #f9f9f9;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
      text-align: center;
    }
    
    .status-emoji {
      font-size: 32px;
      display: block;
      margin-bottom: 10px;
    }
    
    .empty-status {
      text-align: center;
      padding: 20px;
    }
    
    .empty-icon {
      font-size: 48px;
      margin-bottom: 15px;
    }
    
    .retake-link {
      text-align: center;
      margin-top: 20px;
    }
    
    .retake-link a {
      color: #3498db;
      text-decoration: none;
      font-weight: 500;
    }
    
    .retake-link a:hover {
      text-decoration: underline;
    }
    
    .welcome-container {
      text-align: center;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .welcome-text {
      font-size: 18px;
      color: #7f8c8d;
      margin-bottom: 30px;
    }
    
    .features-container {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      margin: 30px 0;
    }
    
    .feature-card {
      flex: 1;
      min-width: 220px;
      margin: 15px;
      padding: 20px;
      background-color: white;
      border-radius: 10px;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }
    
    .feature-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
    }
    
    .feature-icon {
      font-size: 36px;
      margin-bottom: 15px;
    }
    
    .feature-card h3 {
      margin-bottom: 10px;
      color: #2c3e50;
    }
    
    .login-button {
      padding: 15px 30px;
      font-size: 18px;
      margin-top: 20px;
    }
    
    .notes-section {
      background-color: #f8f9fa;
      border-left: 3px solid #3498db;
      padding: 10px 15px;
      margin-top: 15px;
      border-radius: 0 5px 5px 0;
    }
    
    .notes-section p {
      font-style: italic;
      color: #7f8c8d;
    }
    
    .app-header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .current-date {
      color: #7f8c8d;
      font-size: 16px;
      margin-top: -15px;
    }
    
    .actions-container {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
    }
    
    .history-button {
      background-color: #9b59b6;
    }
    
    .history-button:hover {
      background-color: #8e44ad;
    }
    
    .loader {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      animation: spin 2s linear infinite;
      margin: 20px auto;
    }
    
    .loader-container {
      text-align: center;
      padding: 20px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .notification {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      background-color: #2ecc71;
      color: white;
      border-radius: 5px;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-width: 250px;
      max-width: 350px;
      animation: slideIn 0.3s ease-out forwards;
    }
    
    .notification.error {
      background-color: #e74c3c;
    }
    
    .notification.info {
      background-color: #3498db;
    }
    
    .close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 0 5px;
      margin: 0;
      box-shadow: none;
    }
    
    .notification-hiding {
      animation: slideOut 0.3s ease-in forwards;
    }
    
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    
    /* History view styles */
    .history-section {
      margin: 30px 0;
    }
    
    .history-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }
    
    .history-card {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      padding: 15px;
      transition: all 0.3s ease;
    }
    
    .history-card:hover {
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
    }
    
    .history-date {
      font-weight: 500;
      margin-bottom: 10px;
      color: #2c3e50;
      border-bottom: 1px solid #eee;
      padding-bottom: 5px;
    }
    
    .history-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 50px;
      margin-bottom: 15px;
    }
    
    .wellbeing-indicator {
      font-size: 24px;
      flex: 1;
      text-align: center;
    }
    
    .sleep-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .sleep-hours {
      font-size: 14px;
      margin-bottom: 5px;
    }
    
    .sleep-quality-indicator {
      height: 5px;
      background-color: #3498db;
      border-radius: 2px;
    }
    
    .stress-indicator {
      width: 10px;
      background-color: #e74c3c;
      border-radius: 2px;
      align-self: flex-end;
    }
    
    .view-details-btn {
      width: 100%;
      padding: 8px;
      background-color: #3498db;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .view-details-btn:hover {
      background-color: #2980b9;
    }
    
    .history-details {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      margin: 20px 0;
      padding: 20px;
      animation: fadeIn 0.3s ease;
    }
    
    .detail-section {
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid #eee;
    }
    
    .detail-section:last-child {
      border-bottom: none;
    }
    
    .detail-section h4 {
      color: #3498db;
      margin-bottom: 10px;
    }
    
    .close-details-btn {
      background-color: #7f8c8d;
      color: white;
      border: none;
      padding: 8px 15px;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .close-details-btn:hover {
      background-color: #95a5a6;
    }
    
    /* Responsive design for mobile */
    @media (max-width: 768px) {
      .status-card {
        min-width: 100%;
        margin: 5px 0;
      }
      
      .feature-card {
        min-width: 100%;
        margin: 10px 0;
      }
      
      .history-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      }
    }
  `;

  // Add the styles to the document
  document.head.appendChild(styleElement);
}

// Initialize the additional styles when the page loads
window.addEventListener('DOMContentLoaded', () => {
  initializeAdditionalStyles();
});

// Log that the file is fully loaded
console.log('app.js: Enhanced version fully loaded with all functions defined');
