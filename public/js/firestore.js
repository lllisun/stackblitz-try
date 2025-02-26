// src/firestore.js
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Check if user profile exists
export async function checkIfUserExists(uid) {
  const userDoc = doc(db, "users", uid);
  const docSnap = await getDoc(userDoc);
  return docSnap.exists() ? docSnap.data() : null;
}

// Save Registration Data
export async function saveUserProfile(uid, profileData) {
  const userDoc = doc(db, "users", uid);
  await setDoc(userDoc, { profile: profileData }, { merge: true });
}

// Save Daily Quiz Data
export async function saveDailyQuiz(uid, quizData) {
  const today = new Date().toISOString().split('T')[0];
  const logDoc = doc(db, "users", uid, "dailyLogs", today);
  await setDoc(logDoc, quizData, { merge: true });
}
