// public/js/dailyQuiz.js - Enhanced with sleep tracking and improved UI
console.log('dailyQuiz.js loading started');
window.dailyQuizLoaded = true;
// Unified data fetching function
async function getUserData(dataType) {
  const user = firebase.auth().currentUser;
  if (!user) {
    console.log(`getUserData(${dataType}) - No user logged in`);
    return [];
  }

  try {
    const doc = await firebase
      .firestore()
      .collection('users')
      .doc(user.uid)
      .get();
    if (!doc.exists) {
      console.log(`getUserData(${dataType}) - User document not found`);
      return [];
    }

    const profileData = doc.data().profile;
    if (!profileData) {
      console.log(`getUserData(${dataType}) - Profile data not found`);
      return [];
    }

    // Get the appropriate data based on the requested type
    let result = [];
    switch (dataType) {
      case 'medications':
        result = profileData.medications || [];
        break;
      case 'menstrualSymptoms':
        result = profileData.menstruation?.symptoms || [];
        break;
      case 'habits':
        result = profileData.habits?.items || [];
        break;
      case 'substances':
        result = profileData.substances?.items || [];
        break;
      case 'profile':
        return profileData; // Return the entire profile
      default:
        console.log(`getUserData(${dataType}) - Unknown data type requested`);
        return [];
    }

    console.log(`getUserData(${dataType}) - Data fetched:`, result);
    return result;
  } catch (error) {
    console.error(`Error fetching user ${dataType}:`, error);
    return [];
  }
}

function submitDailyQuiz() {
  console.log('Submitting quiz...');

  const user = firebase.auth().currentUser;
  if (!user) {
    alert('You must be logged in to submit the quiz.');
    return;
  }

  // Prepare data object for Firestore
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const quizDataToSave = {};

  // Process each answer
  for (const [questionId, answerObj] of Object.entries(quizAnswers)) {
    const { answerValue, answerType } = answerObj;

    if (answerType === 'slider' || answerType === 'scale') {
      // Use scalar values directly
      quizDataToSave[questionId] = parseFloat(answerValue);
    } else if (answerType === 'time') {
      quizDataToSave[questionId] = answerValue; // e.g., "22:30"
    } else if (answerType === 'boolean') {
      // Map "yes" to 1, "no" to 0
      quizDataToSave[questionId] = answerValue === 'yes' ? 1 : 0;
    } else if (answerType === 'checklist') {
      // Store each option as 1 or 0
      if (Array.isArray(answerValue)) {
        answerValue.forEach((item) => {
          const key = `${questionId}_${item
            .replace(/\s+/g, '_')
            .toLowerCase()}`;
          quizDataToSave[key] = 1;
        });

        // **NEW: Save unchecked items as 0**
        const allItems = question.options
          ? question.options.map((opt) => opt.value)
          : [];
        allItems.forEach((item) => {
          if (!answerValue.includes(item)) {
            const key = `${questionId}_${item
              .replace(/\s+/g, '_')
              .toLowerCase()}`;
            quizDataToSave[key] = 0;
          }
        });
      }
    } else if (answerType === 'textarea') {
      // Store raw text
      quizDataToSave[questionId] = answerValue.trim();
    }
  }

  // **NEW: Save unanswered questions as 0**
  const allQuestionIds = selectedQuestionsForQuiz.map((q) => q.id);
  allQuestionIds.forEach((questionId) => {
    if (!quizDataToSave.hasOwnProperty(questionId)) {
      quizDataToSave[questionId] = 0; // Default to 0 if unanswered
    }
  });

  // Sleep calculation (preserve existing logic)
  if (quizDataToSave.bedtimeQuestion && quizDataToSave.wakeUpTimeQuestion) {
    const [bedHour, bedMinute] = quizDataToSave.bedtimeQuestion
      .split(':')
      .map(Number);
    const [wakeHour, wakeMinute] = quizDataToSave.wakeUpTimeQuestion
      .split(':')
      .map(Number);

    let sleepMinutes = wakeHour * 60 + wakeMinute - (bedHour * 60 + bedMinute);
    if (sleepMinutes < 0) sleepMinutes += 24 * 60; // Handle overnight sleep

    const sleepHours = (sleepMinutes / 60).toFixed(1);
    quizDataToSave['calculatedSleepHours'] = parseFloat(sleepHours); // e.g., 7.5
  }

  // Add metadata
  quizDataToSave['quizCompleted'] = true;
  quizDataToSave['completedAt'] =
    firebase.firestore.FieldValue.serverTimestamp();

  console.log('Final quiz data to save:', quizDataToSave);

  // Submit to Firestore under dailyLogs
  firebase
    .firestore()
    .collection('users')
    .doc(user.uid)
    .collection('dailyLogs')
    .doc(today)
    .set(quizDataToSave, { merge: true })
    .then(() => {
      console.log('Quiz successfully submitted!');

      // Show success message
      alert('Your quiz has been submitted. Thank you!');

      // Hide quiz container
      const quizContainer = document.getElementById('dailyQuizFullScreen');
      if (quizContainer) {
        quizContainer.style.display = 'none';
        quizContainer.innerHTML = ''; // Clear content
      }

      // Show main app content again
      const appContainer = document.getElementById('app');
      appContainer.style.display = 'block';

      // Optionally reload to update check-in status
      location.reload(); // Or call a function to refresh the main view
    })
    .catch((error) => {
      console.error('Error submitting quiz:', error);
      alert('An error occurred while submitting your quiz. Please try again.');
    });
}

// Module scoped variables
let currentQuestionIndex = 0;
let selectedQuestionsForQuiz = [];
let quizAnswers = {};
let allQuizData = {};
let currentQuizType = 'generalHealthWellbeing';
let currentQuestionGroup = 0;
let questionGroups = [];

// Standard daily questions
const allDailyQuestions = [
  // --- Sleep Questions ---
  {
    id: 'bedtimeQuestion',
    text: 'What time did you go to bed?',
    answerType: 'time',
    tags: ['generalHealthWellbeing', 'sleep', 'objective', 'bedtime'],
    group: 'sleep',
  },
  {
    id: 'wakeUpTimeQuestion',
    text: 'What time did you wake up?',
    answerType: 'time',
    tags: ['generalHealthWellbeing', 'sleep', 'objective', 'wakeUpTime'],
    group: 'sleep',
  },

  {
    id: 'sleepQualityQuestion',
    text: 'How would you rate the quality of your sleep last night?',
    answerType: 'scale',
    options: [
      { value: 1, label: 'Poor' },
      { value: 2, label: 'Below average' },
      { value: 3, label: 'Average' },
      { value: 4, label: 'Good' },
      { value: 5, label: 'Excellent' },
    ],
    tags: ['generalHealthWellbeing', 'sleep', 'subjective', 'quality'],
    group: 'sleep',
  },
  {
    id: 'sleepIssuesChecklist',
    text: 'Did you experience any of these sleep issues?',
    answerType: 'checklist',
    options: [
      {
        value: 'difficulty_falling_asleep',
        label: 'Difficulty falling asleep',
      },
      { value: 'waking_during_night', label: 'Waking up during the night' },
      { value: 'waking_too_early', label: 'Waking up too early' },
      { value: 'not_feeling_rested', label: 'Not feeling rested upon waking' },
      { value: 'oversleeping', label: 'Oversleeping/difficulty waking up' },
      { value: 'nightmares', label: 'Nightmares or bad dreams' },
      { value: 'other', label: 'Other sleep issues' },
    ],
    tags: ['generalHealthWellbeing', 'sleep', 'symptoms', 'checklist'],
    group: 'sleep',
  },

  // --- General Well-being Question ---
  {
    id: 'generalWellbeingQuestion',
    text: 'How do you feel today overall?',
    answerType: 'scale',
    options: [
      { value: 1, label: 'Not well at all' },
      { value: 2, label: 'Below average' },
      { value: 3, label: 'Average' },
      { value: 4, label: 'Good' },
      { value: 5, label: 'Excellent' },
    ],
    tags: ['generalHealthWellbeing', 'overall-feeling', 'subjective'],
    group: 'wellbeing',
  },
  {
    id: 'stressLevelQuestion',
    text: 'What is your stress level today?',
    answerType: 'scale',
    options: [
      { value: 1, label: 'Very low' },
      { value: 2, label: 'Low' },
      { value: 3, label: 'Moderate' },
      { value: 4, label: 'High' },
      { value: 5, label: 'Very high' },
    ],
    tags: ['generalHealthWellbeing', 'stress', 'subjective'],
    group: 'wellbeing',
  },

  // --- Medications ---
  {
    id: 'medicationsTakenChecklist',
    text: 'Please check the medications you took today:',
    answerType: 'checklist',
    tags: [
      'generalHealthWellbeing',
      'medications',
      'medication-tracking',
      'checklist',
    ],
    group: 'medications',
  },

  // --- Menstrual Tracking ---
  {
    id: 'currentlyMenstruatingQuestion',
    text: 'Are you currently menstruating today?',
    answerType: 'boolean',
    tags: ['generalHealthWellbeing', 'menstrual-tracking', 'status'],
    group: 'menstrual',
  },
  {
    id: 'menstrualSymptomsChecklist',
    text: 'Please check any menstrual symptoms you are experiencing today:',
    answerType: 'checklist',
    tags: [
      'generalHealthWellbeing',
      'menstrual-tracking',
      'symptoms',
      'checklist',
    ],
    group: 'menstrual',
  },

  // --- Habits Tracking ---
  {
    id: 'habitsCompletedChecklist',
    text: 'Please check the habits you completed today:',
    answerType: 'checklist',
    tags: [
      'generalHealthWellbeing',
      'daily-habits',
      'habit-tracking',
      'checklist',
    ],
    group: 'habits',
  },

  // --- Substance Use Tracking ---
  {
    id: 'substancesConsumedChecklist',
    text: 'Please check any substances you consumed today:',
    answerType: 'checklist',
    tags: [
      'generalHealthWellbeing',
      'substance-use',
      'substance-tracking',
      'checklist',
    ],
    group: 'substances',
  },
  {
    id: 'hadClassToday',
    text: 'Did you have class today?',
    answerType: 'boolean',
    tags: ['productivity', 'study', 'class-tracking'],
    group: 'productivity',
    conditionalOn: {
      questionId: 'studentTracked', // You may need to define how "Study" tracking is indicated
      value: '1',
    },
  },
  {
    id: 'attendedClass',
    text: 'Did you attend class?',
    answerType: 'boolean',
    tags: ['productivity', 'study', 'class-attendance'],
    group: 'productivity',
    conditionalOn: {
      questionId: 'hadClassToday',
      value: 'yes',
    },
  },

  // --- Productivity Question ---
  {
    id: 'productivityFeelingRatingQuestion',
    text: 'On a scale of 1 to 10, how productive do you *feel* you were overall today?',
    answerType: 'slider',
    min: 1,
    max: 10,
    step: 1,
    defaultValue: 5,
    tags: [
      'generalHealthWellbeing',
      'productivity',
      'overall-feeling',
      'subjective',
    ],
    group: 'productivity',
  },

  // --- Notes ---
  {
    id: 'dailyNotesQuestion',
    text: 'Any additional notes about your day?',
    answerType: 'textarea',
    tags: ['generalHealthWellbeing', 'notes', 'subjective'],
    group: 'notes',
  },
];

// Quiz selection rules
const rules = [
  // --- Sleep Tracking Rules ---
  {
    id: 'rule_bedtime',
    questionId: 'bedtimeQuestion',
    quizType: 'generalHealthWellbeing',
    triggerCondition: (profileData) => true, // Always show bedtime question
  },
  {
    id: 'rule_wakeup_time',
    questionId: 'wakeUpTimeQuestion',
    quizType: 'generalHealthWellbeing',
    triggerCondition: (profileData) => true, // Always show wake-up question
  },
  {
    id: 'rule_sleep_quality',
    questionId: 'sleepQualityQuestion',
    quizType: 'generalHealthWellbeing',
    triggerCondition: (profileData) => true, // Always show sleep questions
  },
  {
    id: 'rule_sleep_issues',
    questionId: 'sleepIssuesChecklist',
    quizType: 'generalHealthWellbeing',
    triggerCondition: (profileData) => true, // Always show sleep questions
  },

  // --- General Wellbeing Rules ---
  {
    id: 'rule_general_wellbeing',
    questionId: 'generalWellbeingQuestion',
    quizType: 'generalHealthWellbeing',
    triggerCondition: (profileData) => true, // Always show wellbeing question
  },
  {
    id: 'rule_stress_level',
    questionId: 'stressLevelQuestion',
    quizType: 'generalHealthWellbeing',
    triggerCondition: (profileData) => true, // Always show stress question
  },

  // --- Medication Tracking Rule ---
  {
    id: 'rule_medications_checklist',
    questionId: 'medicationsTakenChecklist',
    quizType: 'generalHealthWellbeing',
    triggerCondition: (profileData) =>
      profileData.medications && profileData.medications.length > 0,
  },

  // --- Menstrual Tracking Rules ---
  {
    id: 'rule_menstrual_currently_menstruating',
    questionId: 'currentlyMenstruatingQuestion',
    quizType: 'generalHealthWellbeing',
    triggerCondition: (profileData) => {
      console.log(
        'rule_menstrual_currently_menstruating - profileData.menstruation:',
        profileData.menstruation
      );
      const condition =
        profileData.menstruation?.trackMenstruation === 1 &&
        profileData.menstruation?.doesMenstruate === 1;
      console.log(
        'rule_menstrual_currently_menstruating - condition result:',
        condition
      );
      return condition;
    },
  },
  {
    id: 'rule_menstrual_symptoms_checklist',
    questionId: 'menstrualSymptomsChecklist',
    quizType: 'generalHealthWellbeing',
    triggerCondition: (profileData) =>
      profileData.menstruation?.trackMenstruation === 1 &&
      profileData.menstruation?.doesMenstruate === 1 &&
      profileData.menstruation?.symptoms &&
      profileData.menstruation.symptoms.length > 0,
  },

  // --- Daily Habits Rule ---
  {
    id: 'rule_habits_checklist',
    questionId: 'habitsCompletedChecklist',
    quizType: 'generalHealthWellbeing',
    triggerCondition: (profileData) => {
      console.log(
        'rule_habits_checklist - profileData.habits:',
        profileData.habits
      );
      const condition =
        profileData.habits?.track === 1 &&
        profileData.habits?.items &&
        profileData.habits.items.length > 0;
      console.log('rule_habits_checklist - condition result:', condition);
      return condition;
    },
  },

  // --- Substance Use Rules ---
  {
    id: 'rule_substances_checklist',
    questionId: 'substancesConsumedChecklist',
    quizType: 'generalHealthWellbeing',
    triggerCondition: (profileData) => {
      console.log(
        'rule_substances_checklist - profileData.substances:',
        profileData.substances
      );
      const condition = profileData.substances?.track === 1;
      console.log('rule_substances_checklist - condition result:', condition);
      return condition;
    },
  },

  // --- Productivity Rules ---
  {
    id: 'rule_productivity_feeling_rating',
    questionId: 'productivityFeelingRatingQuestion',
    quizType: 'generalHealthWellbeing',
    triggerCondition: (profileData) => {
      console.log(
        'rule_productivity_feeling_rating - profileData.productivity:',
        profileData.productivity
      );
      const condition = profileData.productivity?.track === 1;
      console.log(
        'rule_productivity_feeling_rating - condition result:',
        condition
      );
      return condition;
    },
  },

  {
    id: 'rule_had_class_today',
    questionId: 'hadClassToday',
    quizType: 'generalHealthWellbeing',
    triggerCondition: (profileData) =>
      profileData.productivity?.areas?.includes('Study'),
  },
  {
    id: 'rule_attended_class',
    questionId: 'attendedClass',
    quizType: 'generalHealthWellbeing',
    triggerCondition: (profileData, currentAnswers) =>
      currentAnswers.hadClassToday &&
      currentAnswers.hadClassToday.answerValue === 'yes',
  },

  // --- Notes Rule ---
  {
    id: 'rule_daily_notes',
    questionId: 'dailyNotesQuestion',
    quizType: 'generalHealthWellbeing',
    triggerCondition: (profileData) => true, // Always show notes field
  },
];

// Helper function for displaying error messages
function displayErrorMessage(container, message) {
  container.innerHTML = `
    <div class="error-message">
      <i class="fas fa-exclamation-circle"></i>
      <p>${message}</p>
    </div>`;
  console.error(message);
}

// Initialize quiz data
async function initializeQuiz() {
  try {
    // Get user profile data
    const profileData = await getUserData('profile');
    if (!profileData) {
      console.error('User profile data not found.');
      return null;
    }

    // Generate the dynamic questions and rules
    const dynamicQuestionsAndRules =
      generateDynamicQuestionsAndRules(profileData);

    // Combine with standard questions and rules
    const combinedRules = [...rules, ...dynamicQuestionsAndRules.rules];
    const combinedQuestions = [
      ...allDailyQuestions,
      ...dynamicQuestionsAndRules.questions,
    ];

    console.log('Combined Rules for Evaluation:', combinedRules);
    console.log('Combined Questions for Selection:', combinedQuestions);

    // Select questions based on user profile
    const selectedQuestions = evaluateRulesAndSelectQuestions(
      profileData,
      combinedQuestions,
      combinedRules,
      'generalHealthWellbeing'
    );

    // Order questions by category
    const orderedQuestions = orderQuestionsByCategory(selectedQuestions);
    console.log('Selected Questions After Rule Evaluation:', orderedQuestions);

    // Group questions by category
    questionGroups = groupQuestionsByCategory(orderedQuestions);
    console.log('Question Groups:', questionGroups);

    return {
      profileData,
      questions: orderedQuestions,
      questionGroups: questionGroups,
    };
  } catch (error) {
    console.error('Error initializing quiz:', error);
    return null;
  }
}

// Generate dynamic questions based on user profile
function generateDynamicQuestionsAndRules(profileData) {
  const dynamicQuestions = [];
  const dynamicRules = [];

  // --- Menstrual Tracking - Symptom Severity Questions and Rules ---
  if (
    profileData.menstruation?.trackMenstruation === 1 &&
    profileData.menstruation?.symptoms
  ) {
    profileData.menstruation.symptoms.forEach((symptom) => {
      const questionId = `menstrualSymptomSeverity_${symptom
        .toLowerCase()
        .replace(/ /g, '_')}`;

      dynamicQuestions.push({
        id: questionId,
        text: `On a scale of 1 to 10, how would you rate the severity of your ${symptom} today?`,
        answerType: 'slider',
        min: 1,
        max: 10,
        step: 1,
        defaultValue: 5,
        tags: [
          'generalHealthWellbeing',
          'menstrual-tracking',
          'symptoms',
          'scalar',
          `symptom-${symptom.toLowerCase().replace(/ /g, '_')}`,
        ],
        group: 'menstrual',
        conditionalOn: {
          questionId: 'menstrualSymptomsChecklist',
          value: symptom,
        },
      });

      dynamicRules.push({
        id: `rule_menstrual_symptom_severity_${symptom
          .toLowerCase()
          .replace(/ /g, '_')}`,
        questionId: questionId,
        quizType: 'generalHealthWellbeing',
        triggerCondition: (profileData, currentAnswers) =>
          profileData.menstruation.doesMenstruate === 1 &&
          profileData.menstruation.trackMenstruation === 1 &&
          profileData.menstruation.symptoms.includes(symptom) &&
          currentAnswers &&
          currentAnswers.currentlyMenstruatingQuestion &&
          currentAnswers.currentlyMenstruatingQuestion.answerValue === 'yes' &&
          currentAnswers.menstrualSymptomsChecklist &&
          currentAnswers.menstrualSymptomsChecklist.includes(symptom),
      });
    });
  }

  // --- Health Conditions - Symptom Severity Questions and Rules ---
  if (profileData.conditions?.track === 1 && profileData.conditions?.items) {
    profileData.conditions.items.forEach((condition) => {
      const conditionName = condition.name;
      const symptoms = condition.symptoms;

      symptoms.forEach((symptom) => {
        if (symptom) {
          const questionId = `conditionSymptomSeverity_${conditionName
            .toLowerCase()
            .replace(/ /g, '_')}_${symptom.toLowerCase().replace(/ /g, '_')}`;

          dynamicQuestions.push({
            id: questionId,
            text: `On a scale of 1 to 10, how would you rate the severity of your '${symptom}' related to your condition '${conditionName}' today?`,
            answerType: 'slider',
            min: 1,
            max: 10,
            step: 1,
            defaultValue: 5,
            tags: [
              'generalHealthWellbeing',
              'health-conditions',
              'condition-tracking',
              'symptoms',
              'scalar',
              `condition-${conditionName.toLowerCase().replace(/ /g, '_')}`,
              `symptom-${symptom.toLowerCase().replace(/ /g, '_')}`,
            ],
            group: 'conditions',
          });

          dynamicRules.push({
            id: `rule_condition_symptom_severity_${conditionName
              .toLowerCase()
              .replace(/ /g, '_')}_${symptom.toLowerCase().replace(/ /g, '_')}`,
            questionId: questionId,
            quizType: 'generalHealthWellbeing',
            triggerCondition: (profileData) =>
              profileData.conditions.track === 1 &&
              profileData.conditions.items.some(
                (c) => c.name === conditionName && c.symptoms.includes(symptom)
              ),
          });
        }
      });
    });
  }

  // --- Mental Health - Factor Level Questions and Rules ---
  if (
    profileData.mentalHealth?.track === 1 &&
    profileData.mentalHealth?.factors
  ) {
    profileData.mentalHealth.factors.forEach((factor) => {
      const factorName = factor;
      const questionId = `mentalHealthFactorLevel_${factorName
        .toLowerCase()
        .replace(/ /g, '_')}`;

      dynamicQuestions.push({
        id: questionId,
        text: `On a scale of 1 to 10, how would you rate your ${factorName} today?`,
        answerType: 'slider',
        min: 1,
        max: 10,
        step: 1,
        defaultValue: 5,
        tags: [
          'generalHealthWellbeing',
          'mental-health',
          'mental-health-tracking',
          'subjective',
          `factor-${factorName.toLowerCase().replace(/ /g, '_')}`,
        ],
        group: 'mental-health',
      });

      dynamicRules.push({
        id: `rule_mental_health_factor_level_${factorName
          .toLowerCase()
          .replace(/ /g, '_')}`,
        questionId: questionId,
        quizType: 'generalHealthWellbeing',
        triggerCondition: (profileData) =>
          profileData.mentalHealth.track === 1 &&
          profileData.mentalHealth.factors.includes(factorName),
      });
    });
  }

  // --- Productivity - Hours Questions and Rules ---
  if (
    profileData.productivity?.track === 1 &&
    profileData.productivity?.areas
  ) {
    profileData.productivity.areas.forEach((area) => {
      const areaName = area;
      const questionId = `productivityHours_${areaName
        .toLowerCase()
        .replace(/ /g, '_')}`;

      dynamicQuestions.push({
        id: questionId,
        text: `Approximately how many hours did you dedicate to ${areaName} today?`,
        answerType: 'slider',
        min: 0,
        max: 12,
        step: 0.5,
        defaultValue: 2,
        tags: [
          'generalHealthWellbeing',
          'productivity',
          'productivity-tracking',
          'objective',
          `area-${areaName.toLowerCase().replace(/ /g, '_')}`,
        ],
        group: 'productivity',
      });

      dynamicRules.push({
        id: `rule_productivity_hours_${areaName
          .toLowerCase()
          .replace(/ /g, '_')}`,
        questionId: questionId,
        quizType: 'generalHealthWellbeing',
        triggerCondition: (profileData) =>
          profileData.productivity.track === 1 &&
          profileData.productivity.areas.includes(areaName),
      });
    });
  }

  return { questions: dynamicQuestions, rules: dynamicRules };
}

// Evaluate rules and select relevant questions
function evaluateRulesAndSelectQuestions(
  profileData,
  allQuestions,
  rules,
  quizType
) {
  const selectedQuestions = [];
  console.log('Evaluating rules...');

  for (const rule of rules) {
    console.log('Evaluating rule:', rule.id);

    if (
      rule.quizType === quizType &&
      rule.triggerCondition(profileData, quizAnswers)
    ) {
      console.log('Rule triggered:', rule.id);
      const question = allQuestions.find((q) => q.id === rule.questionId);

      if (question && !selectedQuestions.includes(question)) {
        selectedQuestions.push(question);
        console.log('Question selected:', question.id);
      }
    } else {
      console.log('Rule NOT triggered:', rule.id);
    }
  }

  return selectedQuestions;
}

// Order questions by category for better user experience
function orderQuestionsByCategory(questions) {
  const categoryOrder = [
    'sleep',
    'wellbeing',
    'medications',
    'menstrual-tracking',
    'health-conditions',
    'daily-habits',
    'substance-use',
    'mental-health',
    'productivity',
    'notes',
  ];

  // Create a mapping of group to order
  const groupOrder = {
    sleep: 1,
    wellbeing: 2,
    'mental-health': 3,
    productivity: 4,
    medications: 5,
    conditions: 6,
    substances: 7,
    habits: 8,
    menstrual: 9,
    notes: 0,
  };

  // Sort questions by their group order
  return questions.sort((a, b) => {
    const aOrder = groupOrder[a.group] || 999;
    const bOrder = groupOrder[b.group] || 999;
    return aOrder - bOrder;
  });
}

// Group questions by category
function groupQuestionsByCategory(questions) {
  const groups = {};

  // Group questions by their group property
  questions.forEach((question) => {
    const group = question.group || 'other';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(question);
  });

  // Convert to array of groups
  return Object.entries(groups).map(([name, questions]) => ({
    name,
    title: formatGroupTitle(name),
    questions,
  }));
}

// Format group title for display
function formatGroupTitle(groupName) {
  const titles = {
    sleep: 'Sleep',
    wellbeing: 'General Well-being',
    medications: 'Medications',
    menstrual: 'Menstrual Tracking',
    conditions: 'Health Conditions',
    habits: 'Daily Habits',
    substances: 'Substance Use',
    'mental-health': 'Mental Health',
    productivity: 'Productivity',
    notes: 'Daily Notes',
  };

  return (
    titles[groupName] || groupName.charAt(0).toUpperCase() + groupName.slice(1)
  );
}

// Display a group of related questions
function displayQuestionGroup(groupIndex, container) {
  if (groupIndex < 0 || groupIndex >= questionGroups.length) {
    // All groups completed
    container.innerHTML = `
      <div class="quiz-complete">
        <h3>Quiz Completed!</h3>
        <p>Thank you for completing your daily check-in.</p>
        <button id="submitQuizBtn" class="submit-quiz-btn">Submit Quiz</button>
      </div>`;
    document
      .getElementById('submitQuizBtn')
      .addEventListener('click', submitDailyQuiz);
    return;
  }

  const group = questionGroups[groupIndex];

  let groupHTML = `
    <div class="question-group">
      <h3 class="group-title">${group.title}</h3>
  `;

  // Add all questions in this group
  group.questions.forEach((question, index) => {
    const isConditional = question.conditionalOn !== undefined;

    groupHTML += `
      <div class="question-item ${
        isConditional ? 'conditional-question hidden' : ''
      }" 
           id="question-${question.id}" 
           ${
             isConditional
               ? `data-conditional-on="${question.conditionalOn.questionId}" data-conditional-value="${question.conditionalOn.value}"`
               : ''
           }>
        <p class="question-text">${question.text}</p>
    `;

    if (question.answerType === 'slider') {
      groupHTML += `
        <div class="slider-container">
          <input type="range" id="answer-${question.id}" 
            min="${question.min}" max="${question.max}" 
            step="${question.step}" value="${question.defaultValue}"
            class="styled-slider">
          <div class="slider-value">
            <span id="slider-value-${question.id}">${question.defaultValue}</span>
          </div>
        </div>`;
    } else if (question.answerType === 'time') {
      const defaultTime = '22:00'; // Default time value if needed
      groupHTML += `
        <div class="time-input-container">
          <input type="time" id="answer-${question.id}" value="${defaultTime}" required>
        </div>`;
    } else if (question.answerType === 'scale') {
      groupHTML += `<div class="scale-options">`;
      question.options.forEach((option) => {
        groupHTML += `
          <label class="scale-option">
            <input type="radio" name="answer-${question.id}" value="${option.value}">
            <span class="scale-label">${option.label}</span>
          </label>`;
      });
      groupHTML += `</div>`;
    } else if (question.answerType === 'boolean') {
      groupHTML += `
        <div class="boolean-options">
          <label class="boolean-option">
            <input type="radio" name="answer-${question.id}" value="yes" class="toggle-conditional" data-question-id="${question.id}">
            <span class="boolean-label">Yes</span>
          </label>
          <label class="boolean-option">
            <input type="radio" name="answer-${question.id}" value="no" class="toggle-conditional" data-question-id="${question.id}">
            <span class="boolean-label">No</span>
          </label>
        </div>`;
    } else if (question.answerType === 'checklist') {
      groupHTML += `<div id="checklist-container-${question.id}" class="checklist-container"></div>`;
    } else if (question.answerType === 'textarea') {
      groupHTML += `
        <div class="textarea-container">
          <textarea id="answer-${question.id}" placeholder="Enter your notes here..."></textarea>
        </div>`;
    }

    groupHTML += `
      </div>
    `;
  });

  groupHTML += `
      <div class="navigation-buttons">
        ${
          groupIndex > 0
            ? '<button id="prevGroupBtn" class="prev-btn">Previous</button>'
            : ''
        }
        <button id="nextGroupBtn" class="next-btn">${
          groupIndex === questionGroups.length - 1 ? 'Complete' : 'Next'
        }</button>
      </div>
    </div>
  `;

  container.innerHTML = groupHTML;

  // Initialize each question component
  group.questions.forEach((question) => {
    if (question.answerType === 'slider') {
      const slider = document.getElementById(`answer-${question.id}`);
      const valueDisplay = document.getElementById(
        `slider-value-${question.id}`
      );

      if (slider && valueDisplay) {
        slider.addEventListener('input', function () {
          valueDisplay.textContent = this.value;
        });
      }
    }

    if (
      question.answerType === 'scale' &&
      question.options &&
      question.options.length > 0
    ) {
      const defaultOption =
        question.options[Math.floor(question.options.length / 2)];
      const defaultInput = document.querySelector(
        `input[name="answer-${question.id}"][value="${defaultOption.value}"]`
      );
      if (defaultInput) defaultInput.checked = true;
    } else if (question.answerType === 'boolean') {
      const defaultInput = document.querySelector(
        `input[name="answer-${question.id}"][value="no"]`
      );
      if (defaultInput) defaultInput.checked = true;
    }

    if (question.answerType === 'checklist') {
      setTimeout(() => {
        renderChecklist(question, `checklist-container-${question.id}`);
      }, 0);
    }
  });

  // Add event listeners for conditional questions
  const checkboxes = container.querySelectorAll(
    '.checklist-item input[type="checkbox"]'
  );
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', function () {
      handleConditionalQuestions();
    });
  });

  const toggles = container.querySelectorAll('.toggle-conditional');
  toggles.forEach((toggle) => {
    toggle.addEventListener('change', function () {
      handleConditionalQuestions();
      
      // Special handling for menstrual symptoms
      if (this.name === 'answer-currentlyMenstruatingQuestion') {
        const symptomsContainer = document.getElementById('checklist-container-menstrualSymptomsChecklist');
        if (symptomsContainer) {
          renderChecklist({ id: 'menstrualSymptomsChecklist' }, 'checklist-container-menstrualSymptomsChecklist');
        }
      }
    });
  });

  const nextButton = document.getElementById('nextGroupBtn');
  if (nextButton) {
    nextButton.addEventListener('click', function () {
      console.log(`Next button clicked for group ${groupIndex}`);

      const currentGroup = questionGroups[groupIndex];
      let allValid = true;

      // Validate all questions in the current group
      currentGroup.questions.forEach((question) => {
        const isValid = validateQuestion(question);
        console.log(`Question ${question.id} is valid: ${isValid}`);
        if (!isValid) {
          allValid = false;
        }
      });
      // Run conditional logic check after rendering
      handleConditionalQuestions();

      console.log(
        `All questions in group ${groupIndex} are valid: ${allValid}`
      );

      if (allValid) {
        console.log(`Saving answers for group ${groupIndex}`);
        saveGroupAnswers(currentGroup);
        currentQuestionGroup++;
        console.log(`Moving to group ${currentQuestionGroup}`);
        displayQuestionGroup(currentQuestionGroup, container);
      } else {
        console.log(`Validation failed for group ${groupIndex}`);
        alert('Please answer all questions before proceeding.');
      }
    });
  }

  if (groupIndex > 0) {
    document
      .getElementById('prevGroupBtn')
      .addEventListener('click', function () {
        saveGroupAnswers(group);
        currentQuestionGroup--;
        displayQuestionGroup(currentQuestionGroup, container);
      });
  }
}

function validateQuestion(question) {
  let isValid = false;

  console.log(
    `Validating question: ${question.id} (Type: ${question.answerType})`
  );

  if (question.answerType === 'checklist') {
    const checkboxes = document.querySelectorAll(
      `input[name="answer-${question.id}"]:checked`
    );

    // Require at least one item to be selected
    isValid = checkboxes.length > 0;

    console.log(
      `Checklist validation: ${isValid} (Checked: ${checkboxes.length})`
    );

    // Special handling if "None" is selected - uncheck other options
    checkboxes.forEach((checkbox) => {
      if (checkbox.value.toLowerCase() === 'none') {
        const allCheckboxes = document.querySelectorAll(
          `input[name="answer-${question.id}"]`
        );
        allCheckboxes.forEach((cb) => {
          if (cb.value.toLowerCase() !== 'none') {
            cb.checked = false; // Uncheck all others
          }
        });
      }
    });
  } else if (question.answerType === 'slider') {
    const slider = document.getElementById(`answer-${question.id}`);
    isValid = slider && slider.value !== undefined;
    console.log(`Slider validation: ${isValid} (Value: ${slider?.value})`);
  } else if (question.answerType === 'scale') {
    const checkedElement = document.querySelector(
      `input[name="answer-${question.id}"]:checked`
    );
    isValid = checkedElement !== null;
    console.log(
      `Scale validation: ${isValid} (Selected: ${checkedElement?.value})`
    );
  } else if (question.answerType === 'boolean') {
    const booleanInput = document.querySelector(
      `input[name="answer-${question.id}"]:checked`
    );
    isValid = booleanInput !== null;
    console.log(
      `Boolean validation: ${isValid} (Selected: ${booleanInput?.value})`
    );
  } else if (question.answerType === 'time') {
    const timeInput = document.getElementById(`answer-${question.id}`);
    isValid = timeInput && timeInput.value !== '';
    console.log(`Time validation: ${isValid} (Value: ${timeInput?.value})`);
  }

  console.log(`Question ${question.id} is valid: ${isValid}`);

  // Highlight the question if it's invalid
  const questionElement = document.getElementById(`question-${question.id}`);
  if (questionElement) {
    if (!isValid) {
      questionElement.classList.add('invalid-question');
    } else {
      questionElement.classList.remove('invalid-question');
    }
  }

  return isValid;
}

async function renderChecklist(question, containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container with ID ${containerId} not found.`);
    return;
  }

  console.log(`Rendering checklist for question: ${question.id}`);

  container.innerHTML = ''; // Clear existing content
  let items = [];

  if (question.options) {
    items = question.options;
  } else {
    const dataTypeMap = {
      medicationsTakenChecklist: 'medications',
      menstrualSymptomsChecklist: 'menstrualSymptoms',
      habitsCompletedChecklist: 'habits',
      substancesConsumedChecklist: 'substances',
      sleepIssuesChecklist: 'sleepIssues',
    };

    const dataType = dataTypeMap[question.id];
    if (dataType) {
      console.log(`Fetching ${dataType}...`);
      items = await getUserData(dataType);
      console.log(`${dataType} fetched:`, items);
    }
  }

  if (items && items.length > 0) {
    console.log(`Rendering ${items.length} items for checklist.`);
    renderChecklistItems(container, question.id, items, question);
  } else {
    console.log(`No items found for checklist.`);
    container.innerHTML = '<p>No items to display in this checklist.</p>';
  }
}
// Render individual checklist items
function renderChecklistItems(container, questionId, items, question) {
  if (questionId === 'menstrualSymptomsChecklist') {
    // Add conditional behavior for menstrual symptoms
    const menstruatingYes = document.querySelector('input[name="answer-currentlyMenstruatingQuestion"][value="yes"]');
    if (!menstruatingYes || !menstruatingYes.checked) {
      container.innerHTML = '';
      container.closest('.question-item')?.classList.add('hidden');
      return;
    }
    container.closest('.question-item')?.classList.remove('hidden');
    
    // Hide the question title
    const questionText = container.closest('.question-item')?.querySelector('.question-text');
    if (questionText) {
      questionText.style.display = 'none';
    }
  }
  
  container.innerHTML = ''; // Clear existing content

  items.forEach((item) => {
    // Handle both simple strings and objects
    const itemText =
      typeof item === 'object' ? item.label || item.name || item.value : item;
    const itemValue = typeof item === 'object' ? item.value || item.name : item;
    const itemUnit = typeof item === 'object' ? item.unit : ''; // Optional unit

    const sanitizedValue = itemValue.toString().replace(/\s+/g, '_');

    const checkboxDiv = document.createElement('div');
    checkboxDiv.className = 'checklist-item';

    const checkboxId = `checkbox-${questionId}-${sanitizedValue}`;

    checkboxDiv.innerHTML = `
      <label for="${checkboxId}" class="checkbox-label">
        <input type="checkbox" id="${checkboxId}" 
          name="answer-${questionId}" value="${itemValue}" class="item-checkbox"
          data-question-id="${questionId}" data-item-value="${itemValue}">
        <span class="checkbox-text">${itemText}</span>
      </label>
    `;

    // Handle substances with amount input
    if (questionId === 'substancesConsumedChecklist') {
      checkboxDiv.innerHTML += `
        <div id="amount-${sanitizedValue}" class="substance-amount" style="display: none;">
          <label>How much ${itemText} did you consume in ${itemUnit}?</label>
          <input type="number" id="amount-input-${sanitizedValue}" min="0" step="0.1">
        </div>
      `;
    }

    // Add presence confirmation and severity slider for menstrual symptoms
    if (questionId === 'menstrualSymptomsChecklist') {
      const presenceDiv = document.createElement('div');
      presenceDiv.className = 'symptom-presence';
      presenceDiv.id = `presence-${sanitizedValue}`;
      presenceDiv.style.display = 'none';
      presenceDiv.innerHTML = `
        <div class="presence-options">
          <label>Is this symptom present today?</label>
          <div>
            <input type="radio" name="presence-${sanitizedValue}" value="yes" id="presence-yes-${sanitizedValue}">
            <label for="presence-yes-${sanitizedValue}">Yes</label>
            <input type="radio" name="presence-${sanitizedValue}" value="no" id="presence-no-${sanitizedValue}">
            <label for="presence-no-${sanitizedValue}">No</label>
          </div>
        </div>
      `;
      
      const severityDiv = document.createElement('div');
      severityDiv.className = 'severity-slider';
      severityDiv.id = `severity-${sanitizedValue}`;
      severityDiv.style.display = 'none';
      severityDiv.innerHTML = `
        <label>Severity (1-10):</label>
        <input type="range" min="1" max="10" value="5" step="1" 
          id="severity-input-${sanitizedValue}" class="styled-slider">
        <span class="severity-value" id="severity-value-${sanitizedValue}">5</span>
      `;
      
      checkboxDiv.appendChild(presenceDiv);
      checkboxDiv.appendChild(severityDiv);
      
      // Add event listener for presence radio buttons
      presenceDiv.addEventListener('change', function(e) {
        if (e.target.type === 'radio') {
          severityDiv.style.display = e.target.value === 'yes' ? 'block' : 'none';
        }
      });
    }

    container.appendChild(checkboxDiv);

    // Event listener for checkbox changes
    const checkbox = checkboxDiv.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', function () {
      // Show/hide presence confirmation for menstrual symptoms
      if (questionId === 'menstrualSymptomsChecklist') {
        const presenceDiv = document.getElementById(`presence-${sanitizedValue}`);
        const severityDiv = document.getElementById(`severity-${sanitizedValue}`);
        if (presenceDiv) {
          presenceDiv.style.display = this.checked ? 'block' : 'none';
          // Reset and hide severity when unchecked
          if (!this.checked) {
            const radioButtons = presenceDiv.querySelectorAll('input[type="radio"]');
            radioButtons.forEach(radio => radio.checked = false);
            if (severityDiv) {
              severityDiv.style.display = 'none';
            }
          }
        }
      }
      const amountDiv = document.getElementById(`amount-${sanitizedValue}`);
      if (amountDiv) {
        amountDiv.style.display = this.checked ? 'block' : 'none';
      }

      // Handle "None" logic to deselect others
      if (itemValue.toLowerCase() === 'none' && this.checked) {
        const otherCheckboxes = container.querySelectorAll(
          `input[name="answer-${questionId}"]`
        );
        otherCheckboxes.forEach((cb) => {
          if (cb !== this) {
            cb.checked = false;
            const relatedAmountDiv = document.getElementById(
              `amount-${cb.value}`
            );
            if (relatedAmountDiv) relatedAmountDiv.style.display = 'none';
          }
        });
      }

      // Uncheck "None" if another item is selected
      if (itemValue.toLowerCase() !== 'none' && this.checked) {
        const noneCheckbox = container.querySelector(`input[value="none"]`);
        if (noneCheckbox) noneCheckbox.checked = false;
      }
    });
  });
}

// Get the selected values from a checklist
function getChecklistAnswers(questionId) {
  const checkedItems = [];
  const checkboxes = document.querySelectorAll(
    `input[name="${questionId}"]:checked`
  );

  checkboxes.forEach((checkbox) => {
    checkedItems.push(checkbox.value);
  });

  return checkedItems;
}

function saveGroupAnswers(group) {
  console.log(`Saving answers for group: ${group.title}`);

  group.questions.forEach((question) => {
    let answerValue;

    if (question.answerType === 'slider') {
      const element = document.getElementById(`answer-${question.id}`);
      answerValue = element ? parseFloat(element.value) : 0;
    } else if (question.answerType === 'scale') {
      const checkedElement = document.querySelector(
        `input[name="answer-${question.id}"]:checked`
      );
      answerValue = checkedElement ? parseFloat(checkedElement.value) : 0;
    } else if (question.answerType === 'boolean') {
      const checkedElement = document.querySelector(
        `input[name="answer-${question.id}"]:checked`
      );
      answerValue = checkedElement
        ? checkedElement.value === 'yes'
          ? 1
          : 0
        : 0;
    } else if (question.answerType === 'time') {
      const element = document.getElementById(`answer-${question.id}`);
      answerValue = element ? element.value : '00:00';
    } else if (question.answerType === 'checklist') {
      const checkedItems = getChecklistAnswers(question.id);
      answerValue = checkedItems;

      // Save both checked and unchecked items
      const allItems = question.options
        ? question.options.map((opt) => opt.value)
        : [];

      allItems.forEach((item) => {
        const sanitizedItem = item.replace(/\s+/g, '_').toLowerCase();
        const key = `${question.id}_${sanitizedItem}`;
        const isChecked = checkedItems.includes(item);
        
        // Save presence as 0/1
        quizAnswers[key] = {
          answerValue: isChecked ? 1 : 0,
          answerType: 'checklist',
        };
        
        // Save severity for menstrual symptoms
        if (question.id === 'menstrualSymptomsChecklist' && isChecked) {
          const severityInput = document.getElementById(`severity-input-${sanitizedItem}`);
          if (severityInput) {
            quizAnswers[`${key}_severity`] = {
              answerValue: parseInt(severityInput.value),
              answerType: 'scalar'
            };
          }
        }
      });

      // Special handling for "None" option
      if (checkedItems.includes('none')) {
        allItems.forEach((item) => {
          if (item.toLowerCase() !== 'none') {
            const key = `${question.id}_${item
              .replace(/\s+/g, '_')
              .toLowerCase()}`;
            quizAnswers[key] = {
              answerValue: 0,
              answerType: 'checklist',
            };
          }
        });
      }
    } else if (question.answerType === 'textarea') {
      const element = document.getElementById(`answer-${question.id}`);
      answerValue = element ? element.value.trim() : '';
    }

    if (answerValue !== undefined) {
      quizAnswers[question.id] = {
        answerValue: answerValue,
        answerType: question.answerType,
      };
      console.log(`Saved answer for ${question.id}:`, answerValue);
    }
  });

  console.log(`Answers saved for group:`, quizAnswers);
}

// Handle showing/hiding of conditional questions
function handleConditionalQuestions() {
  const conditionalQuestions = document.querySelectorAll(
    '.conditional-question'
  );

  conditionalQuestions.forEach((questionElement) => {
    const dependsOnQuestionId = questionElement.getAttribute(
      'data-conditional-on'
    );
    const dependsOnValue = questionElement.getAttribute(
      'data-conditional-value'
    );

    console.log(`Evaluating condition for question: ${questionElement.id}`);
    console.log(
      `Depends on: ${dependsOnQuestionId} with value: ${dependsOnValue}`
    );

    // Handle Boolean (radio button) dependencies
    const booleanInput = document.querySelector(
      `input[name="answer-${dependsOnQuestionId}"]:checked`
    );
    const booleanValue = booleanInput ? booleanInput.value : null;

    console.log(`Found boolean value: ${booleanValue}`);

    if (booleanValue === dependsOnValue) {
      questionElement.classList.remove('hidden');
      console.log(`Showing question: ${questionElement.id}`);
    } else {
      questionElement.classList.add('hidden');
      console.log(`Hiding question: ${questionElement.id}`);
    }

    // Handle Checklist dependencies (if needed)
    const checklistContainer = document.getElementById(
      `checklist-container-${dependsOnQuestionId}`
    );
    if (checklistContainer) {
      const isChecked =
        checklistContainer.querySelector(
          `input[value="${dependsOnValue}"]:checked`
        ) !== null;
      console.log(`Checklist dependency checked: ${isChecked}`);

      if (isChecked) {
        questionElement.classList.remove('hidden');
      } else {
        questionElement.classList.add('hidden');
      }
    }
  });
}

// Move to the next question and save current answer
window.nextQuestion = function (quizType) {
  const currentQuestion = selectedQuestionsForQuiz[currentQuestionIndex];
  let answerValue;

  // Get answer based on question type
  if (currentQuestion.answerType === 'slider') {
    answerValue = parseFloat(
      document.getElementById(`answer-${currentQuestion.id}`).value
    );
  } else if (
    currentQuestion.answerType === 'scale' ||
    currentQuestion.answerType === 'boolean'
  ) {
    const checkedElement = document.querySelector(
      `input[name="answer-${currentQuestion.id}"]:checked`
    );
    answerValue = checkedElement ? checkedElement.value : null;
  } else if (currentQuestion.answerType === 'checklist') {
    answerValue = getChecklistAnswers(currentQuestion.id);
  } else if (currentQuestion.answerType === 'textarea') {
    answerValue = document.getElementById(`answer-${currentQuestion.id}`).value;
  }

  // Save answer
  quizAnswers[currentQuestion.id] = {
    answerValue: answerValue,
    answerType: currentQuestion.answerType,
  };

  console.log(`Answer recorded for ${currentQuestion.id}:`, answerValue);

  // Move to next question
  currentQuestionIndex++;
  displayQuestion(
    currentQuestionIndex,
    document.getElementById('dailyQuizContainer'),
    selectedQuestionsForQuiz,
    quizType
  );
};
function renderDailyQuiz() {
  console.log('renderDailyQuiz called');

  // Hide main app content
  const appContainer = document.getElementById('app');
  appContainer.style.display = 'none';

  // Show quiz container
  let quizContainer = document.getElementById('dailyQuizFullScreen');
  if (!quizContainer) {
    quizContainer = document.createElement('div');
    quizContainer.id = 'dailyQuizFullScreen';
    document.body.appendChild(quizContainer);
  }

  quizContainer.style.display = 'block';
  quizContainer.innerHTML = '<p>Loading quiz...</p>';

  // Initialize quiz
  initializeQuiz().then((quizData) => {
    if (!quizData) {
      quizContainer.innerHTML = '<p>Error loading the quiz.</p>';
      return;
    }
    displayQuestionGroup(0, quizContainer);
  });
}

// Attach to window so app.js can call it
window.renderDailyQuiz = renderDailyQuiz;
