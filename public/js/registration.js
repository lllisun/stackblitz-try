// src/registration.js

function renderRegistrationForm() {
  const form = document.getElementById('registrationForm');
  form.innerHTML = `
    <h2>🧪 Enhanced Registration Quiz</h2>
    <form id="registrationFormContent">
      <!-- Diet & Hydration -->
      <h3>Diet & Hydration</h3>
      <label>Do you want to track your diet and hydration?
        <select id="trackDiet">
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </label>
      <div id="dietSection" style="display:none;">
        <label><input type="checkbox" value="Water Intake"> Water Intake</label><br>
        <label><input type="checkbox" value="Calories"> Calories</label><br>
        <label><input type="checkbox" value="Fruits/Vegetables"> Fruits/Vegetables</label><br>
      </div>

      <!-- Physical Activity -->
      <h3>Physical Activity</h3>
      <label>Do you want to track physical activity?
        <select id="trackActivity">
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </label>
      <div id="activitySection" style="display:none;">
        <div id="activityList">
          <h4>Add Activities:</h4>
          <div class="activity-entry">
            <input type="text" placeholder="Activity Name" class="activity-name">
            <div class="activity-tracking-options">
              <label><input type="checkbox" class="track-duration"> Track Duration</label>
              <label><input type="checkbox" class="track-intensity"> Track Intensity</label>
            </div>
            <button type="button" class="remove-activity">Remove</button>
          </div>
        </div>
        <button type="button" id="addActivity">Add Another Activity</button>
      </div>

      <!-- Medication Tracking -->
      <h3>Medication Tracking</h3>
      <label>Do you take any medications?
        <select id="takesMedications">
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </label>
      <div id="medicationSection" style="display:none;">
        <div id="medicationsList">
          <h4>Add Medications:</h4>
          <div class="medication-entry">
            <input type="text" placeholder="Medication Name" class="medication-name">
            <button type="button" class="remove-medication">Remove</button>
          </div>
        </div>
        <button type="button" id="addMedication">Add Another Medication</button>
      </div>

      <!-- Menstrual Tracking -->
      <h3>Menstrual Tracking</h3>
      <label>Do you menstruate?
        <select id="doesMenstruate">
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </label>
      <div id="menstrualTrackingSection" style="display:none;">
        <label>Would you like to track your menstrual cycle?
          <select id="trackMenstruation">
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </label>
        <div id="menstrualSymptomsSection" style="display:none;">
          <h4>Track Menstrual Symptoms:</h4>
          <label><input type="checkbox" value="Cramps"> Cramps</label><br>
          <label><input type="checkbox" value="Bloating"> Bloating</label><br>
          <label><input type="checkbox" value="Headaches"> Headaches</label><br>
        </div>
      </div>

      <!-- Health Conditions -->
      <h3>Health Conditions</h3>
      <label>Do you want to track specific health conditions?
        <select id="trackConditions">
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </label>
      <div id="conditionsSection" style="display:none;">
        <div id="conditionsList">
          <h4>Add Conditions:</h4>
          <div class="condition-entry">
            <input type="text" placeholder="Condition Name" class="condition-name">
            <input type="text" placeholder="Symptoms (comma-separated)" class="condition-symptoms">
            <button type="button" class="remove-condition">Remove</button>
          </div>
        </div>
        <button type="button" id="addCondition">Add Another Condition</button>
      </div>

      <!-- Daily Habits -->
      <h3>Daily Habits</h3>
      <label>Do you want to track daily habits?
        <select id="trackHabits">
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </label>
      <div id="habitsSection" style="display:none;">
        <div id="habitsList">
          <h4>Add Habits:</h4>
          <div class="habit-entry">
            <input type="text" placeholder="Habit (e.g., brush teeth, study)" class="habit-name">
            <button type="button" class="remove-habit">Remove</button>
          </div>
        </div>
        <button type="button" id="addHabit">Add Another Habit</button>
      </div>

      <!-- Substance Tracking -->
      <h3>Substance Use</h3>
      <label>Do you want to track substance use?
        <select id="trackSubstances">
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </label>
      <div id="substancesSection" style="display:none;">
      <div id="substancesList">
      <h4>Substances:</h4>
      <div class="substance-entry">
        <input type="text" placeholder="Substance Name" class="substance-name">
        <select class="substance-unit">
          <option value="grams">Grams</option>
          <option value="ounces">Ounces</option>
          <option value="liters">Liters</option>
          <option value="cups">Cups</option>
        </select>
        <button type="button" class="remove-substance">Remove</button>
      </div>
    </div>
        <button type="button" id="addSubstance">Add Other Substance</button>
      </div>

      <!-- Mental Health -->
      <h3>Mental Health</h3>
      <label>Do you want detailed mental health tracking?
        <select id="trackMentalHealth">
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </label>
      <div id="mentalHealthSection" style="display:none;">
        <div id="mentalHealthList">
          <h4>Track Mental Health Factors:</h4>
          <label><input type="checkbox" value="Anxiety"> Anxiety Level</label><br>
          <label><input type="checkbox" value="Depression"> Depression Level</label><br>
          <label><input type="checkbox" value="Focus"> Focus/Concentration</label><br>
          <label><input type="checkbox" value="Social"> Social Interaction</label><br>
          <div class="mentalhealth-entry">
            <input type="text" placeholder="Other factor to track" class="factor-name">
            <button type="button" class="remove-factor">Remove</button>
          </div>
        </div>
        <button type="button" id="addMentalFactor">Add Other Factor</button>
      </div>

      <!-- Productivity -->
      <h3>Productivity</h3>
      <label>Do you want to track productivity?
        <select id="trackProductivity">
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </label>
      
      <!-- Student Tracking -->
<h3>Student Tracking</h3>
<label>Are you a student?
  <select id="isStudent">
    <option value="no">No</option>
    <option value="yes">Yes</option>
  </select>
</label>


      <!-- Submit Button -->
      <button type="submit">Submit Registration</button>
    </form>
    <p id="quizFeedback" class="feedback"></p>
  `;

  // Attach Event Listeners
  attachEventListeners();
}

// Attach dynamic event listeners for showing/hiding fields
function attachEventListeners() {
  // Prevent form submission on enter
  document
    .getElementById('registrationFormContent')
    .addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        return false;
      }
    });
  // Existing toggles
  document.getElementById('trackDiet').addEventListener('change', (e) => {
    document.getElementById('dietSection').style.display =
      e.target.value === 'yes' ? 'block' : 'none';
  });

  document.getElementById('trackActivity').addEventListener('change', (e) => {
    document.getElementById('activitySection').style.display =
      e.target.value === 'yes' ? 'block' : 'none';
  });

  document
    .getElementById('takesMedications')
    .addEventListener('change', (e) => {
      document.getElementById('medicationSection').style.display =
        e.target.value === 'yes' ? 'block' : 'none';
    });

  document.getElementById('doesMenstruate').addEventListener('change', (e) => {
    document.getElementById('menstrualTrackingSection').style.display =
      e.target.value === 'yes' ? 'block' : 'none';
  });

  document
    .getElementById('trackMenstruation')
    .addEventListener('change', (e) => {
      document.getElementById('menstrualSymptomsSection').style.display =
        e.target.value === 'yes' ? 'block' : 'none';
    });

  // New toggles
  document.getElementById('trackConditions').addEventListener('change', (e) => {
    document.getElementById('conditionsSection').style.display =
      e.target.value === 'yes' ? 'block' : 'none';
  });

  document.getElementById('trackHabits').addEventListener('change', (e) => {
    document.getElementById('habitsSection').style.display =
      e.target.value === 'yes' ? 'block' : 'none';
  });

  document.getElementById('trackSubstances').addEventListener('change', (e) => {
    document.getElementById('substancesSection').style.display =
      e.target.value === 'yes' ? 'block' : 'none';
  });

  document
    .getElementById('trackMentalHealth')
    .addEventListener('change', (e) => {
      document.getElementById('mentalHealthSection').style.display =
        e.target.value === 'yes' ? 'block' : 'none';
    });

  document
    .getElementById('trackProductivity')
    .addEventListener('change', (e) => {
      document.getElementById('productivitySection').style.display =
        e.target.value === 'yes' ? 'block' : 'none';
    });

  // Add buttons handlers
  document.getElementById('addActivity').addEventListener('click', () => {
    const list = document.getElementById('activityList');
    const entry = list.querySelector('.activity-entry').cloneNode(true);
    entry.querySelector('.activity-name').value = '';
    entry.querySelector('.track-duration').checked = false;
    entry.querySelector('.track-intensity').checked = false;
    list.appendChild(entry);
    entry
      .querySelector('.remove-activity')
      .addEventListener('click', function () {
        this.closest('.activity-entry').remove();
      });
  });

  document.getElementById('addMedication').addEventListener('click', () => {
    const list = document.getElementById('medicationsList');
    const entry = list.querySelector('.medication-entry').cloneNode(true);
    entry.querySelector('.medication-name').value = '';
    list.appendChild(entry);
    entry
      .querySelector('.remove-medication')
      .addEventListener('click', function () {
        this.closest('.medication-entry').remove();
      });
  });

  document.getElementById('addCondition').addEventListener('click', () => {
    const list = document.getElementById('conditionsList');
    const entry = list.querySelector('.condition-entry').cloneNode(true);
    entry.querySelector('.condition-name').value = '';
    entry.querySelector('.condition-symptoms').value = '';
    list.appendChild(entry);
    entry
      .querySelector('.remove-condition')
      .addEventListener('click', function () {
        this.closest('.condition-entry').remove();
      });
  });

  document.getElementById('addHabit').addEventListener('click', () => {
    const list = document.getElementById('habitsList');
    const entry = list.querySelector('.habit-entry').cloneNode(true);
    entry.querySelector('.habit-name').value = '';
    list.appendChild(entry);
    entry.querySelector('.remove-habit').addEventListener('click', function () {
      this.closest('.habit-entry').remove();
    });
  });

  document.getElementById('addSubstance').addEventListener('click', () => {
    const list = document.getElementById('substancesList');
    const entry = list.querySelector('.substance-entry').cloneNode(true);
    entry.querySelector('.substance-name').value = '';
    list.appendChild(entry);
    entry
      .querySelector('.remove-substance')
      .addEventListener('click', function () {
        this.closest('.substance-entry').remove();
      });
  });

  document.getElementById('addMentalFactor').addEventListener('click', () => {
    const list = document.getElementById('mentalHealthList');
    const entry = list.querySelector('.mentalhealth-entry').cloneNode(true);
    entry.querySelector('.factor-name').value = '';
    list.appendChild(entry);
    entry
      .querySelector('.remove-factor')
      .addEventListener('click', function () {
        this.closest('.mentalhealth-entry').remove();
      });
  });

  // Add initial remove button handlers
  document.querySelectorAll('.remove-activity').forEach((button) => {
    button.addEventListener('click', function () {
      this.closest('.activity-entry').remove();
    });
  });

  document.querySelectorAll('.remove-medication').forEach((button) => {
    button.addEventListener('click', function () {
      this.closest('.medication-entry').remove();
    });
  });

  document.querySelectorAll('.remove-condition').forEach((button) => {
    button.addEventListener('click', function () {
      this.closest('.condition-entry').remove();
    });
  });

  document.querySelectorAll('.remove-habit').forEach((button) => {
    button.addEventListener('click', function () {
      this.closest('.habit-entry').remove();
    });
  });

  document.querySelectorAll('.remove-substance').forEach((button) => {
    button.addEventListener('click', function () {
      this.closest('.substance-entry').remove();
    });
  });

  document.querySelectorAll('.remove-factor').forEach((button) => {
    button.addEventListener('click', function () {
      this.closest('.mentalhealth-entry').remove();
    });
  });

  // Submit Form Handler
  document
    .getElementById('registrationFormContent')
    .addEventListener('submit', async (e) => {
      e.preventDefault();
      await submitRegistration();
    });
}

// Helper function to collect checked values from a section
function collectChecked(sectionId) {
  const checkedItems = [];
  const checkboxes = document.querySelectorAll(
    `#${sectionId} input[type=checkbox]:checked`
  );
  checkboxes.forEach((cb) => checkedItems.push(cb.value));
  return checkedItems;
}

// Helper function to collect medications
function collectMedications() {
  const meds = [];
  const medElements = document.querySelectorAll('.medication-name');
  medElements.forEach((input) => {
    if (input.value.trim() !== '') {
      meds.push(input.value.trim());
    }
  });
  return meds;
}

// Helper function to collect conditions
function collectConditions() {
  const conditions = [];
  const entries = document.querySelectorAll('.condition-entry');
  entries.forEach((entry) => {
    const name = entry.querySelector('.condition-name').value.trim();
    const symptoms = entry.querySelector('.condition-symptoms').value;
    if (name) {
      conditions.push({
        name: name,
        symptoms: symptoms
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      });
    }
  });
  return conditions;
}

// Helper function to collect habits
function collectHabits() {
  const habits = [];
  const entries = document.querySelectorAll('.habit-name');
  entries.forEach((input) => {
    const habit = input.value.trim();
    if (habit) {
      habits.push(habit);
    }
  });
  return habits;
}

// Helper function to collect substances
function collectSubstances() {
  const substances = [];
  document.querySelectorAll('.substance-entry').forEach((entry) => {
    const name = entry.querySelector('.substance-name').value.trim();
    const unit = entry.querySelector('.substance-unit').value;
    if (name) {
      substances.push({ name, unit });
    }
  });
  return substances;
}
// Helper function to collect mental health factors
function collectMentalHealthFactors() {
  const factors = collectChecked('mentalHealthList');
  const customFactors = [];
  document.querySelectorAll('.factor-name').forEach((input) => {
    const factor = input.value.trim();
    if (factor) {
      customFactors.push(factor);
    }
  });
  return [...factors, ...customFactors];
}

function collectActivities() {
  const activities = [];
  const activityEntries = document.querySelectorAll('.activity-entry');
  activityEntries.forEach((entry) => {
    const name = entry.querySelector('.activity-name').value.trim();
    if (name) {
      activities.push({
        name: name,
        trackDuration: entry.querySelector('.track-duration').checked,
        trackIntensity: entry.querySelector('.track-intensity').checked,
      });
    }
  });
  return activities;
}

// Helper function to collect productivity areas
function collectProductivityAreas() {
  return collectChecked('productivityList');
}

async function submitRegistration() {
  const user = firebase.auth().currentUser;

  const profileData = {
    // Original data - CONVERTED TO 0/1
    diet: document.getElementById('trackDiet').value === 'yes' ? 1 : 0,
    activity: document.getElementById('trackActivity').value === 'yes' ? 1 : 0,
    studentTracked:
      document.getElementById('isStudent').value === 'yes' ? 1 : 0,
    medications: collectMedications(),
    menstruation: {
      doesMenstruate:
        document.getElementById('doesMenstruate').value === 'yes' ? 1 : 0,
      trackMenstruation:
        document.getElementById('trackMenstruation').value === 'yes' ? 1 : 0,
      symptoms: collectChecked('menstrualSymptomsSection'),
    },
    // New data - CONVERTED TO 0/1
    conditions: {
      track: document.getElementById('trackConditions').value === 'yes' ? 1 : 0,
      items: collectConditions(),
    },
    habits: {
      track: document.getElementById('trackHabits').value === 'yes' ? 1 : 0,
      items: collectHabits(),
    },
    substances: {
      track: document.getElementById('trackSubstances').value === 'yes' ? 1 : 0,
      items: collectSubstances(),
    },
    mentalHealth: {
      track:
        document.getElementById('trackMentalHealth').value === 'yes' ? 1 : 0,
      factors: collectMentalHealthFactors(),
    },
    productivity: {
      track:
        document.getElementById('trackProductivity').value === 'yes' ? 1 : 0,
      areas: collectProductivityAreas(),
    },
  };

  try {
    await firebase.firestore().collection('users').doc(user.uid).set(
      {
        profile: profileData,
      },
      { merge: true }
    );

    document.getElementById('quizFeedback').innerText = 'Registration Saved!';
    window.location.reload();
  } catch (error) {
    console.error('Error saving registration:', error);
    document.getElementById('quizFeedback').innerText =
      'Error saving registration!';
  }
}
