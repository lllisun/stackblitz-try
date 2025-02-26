// auth.js

async function googleLogin() {
  try {
      const result = await firebase.auth().signInWithPopup(googleProvider);
      const user = result.user;
      const additionalInfo = result._tokenResponse;
      const isNewUser = additionalInfo.isNewUser;

      if (isNewUser) {
          showPage('registrationPage');
      } else {
          const userProfile = await checkIfUserExists(user.uid);
          if (userProfile) {
              showPage('mainAppPage');
          } else {
              showPage('registrationPage');
          }
      }
  } catch (error) {
      console.error("Google login failed:", error);
      alert("Login failed. Please try again.");
  }
}

function signOutUser() {
  firebase.auth().signOut()
      .then(() => {
          showPage('loginPage');
      })
      .catch((error) => {
          console.error("Logout failed:", error);
      });
}