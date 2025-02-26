// src/userProfile.js
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

// Save user registration info (preferences)
export async function saveUserProfile(preferences) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const userDocRef = doc(db, 'users', user.uid);

    await setDoc(userDocRef, {
      profile: preferences,
      createdAt: serverTimestamp(),
    }, { merge: true });

    console.log("User profile saved successfully!");
  } catch (error) {
    console.error("Error saving user profile:", error);
  }
}
