// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCqAbI06ALNjNgAmZSkHwHQbKJGrBegq2I",
  authDomain: "habittracker-f17a1.firebaseapp.com",
  databaseURL: "https://habittracker-f17a1-default-rtdb.firebaseio.com",
  projectId: "habittracker-f17a1",
  storageBucket: "habittracker-f17a1.firebasestorage.app",
  messagingSenderId: "509985906328",
  appId: "1:509985906328:web:492084622a745187bf7aed",
  measurementId: "G-BF9F0N03ZB"
};

// Initialize Firebase app
const app = firebase.initializeApp(firebaseConfig);

// Initialize Auth and get a reference to the service
const auth = firebase.auth();
const db = firebase.firestore();

// Create Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();