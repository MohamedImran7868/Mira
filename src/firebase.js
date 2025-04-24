import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyAwcK9sQXgx5CFGYAnmswMcn-3Y9pnvyoo",
  authDomain: "mira-7868.firebaseapp.com",
  projectId: "mira-7868",
  storageBucket: "mira-7868.firebasestorage.app",
  messagingSenderId: "182911050195",
  appId: "1:182911050195:web:d85a39c9f25c6f9bee8f26",
  measurementId: "G-GYTW82119F"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);

// Initialize Firebase Auth provider
const provider = new GoogleAuthProvider();
  
// whenever a user interacts with the provider, we force them to select an account
provider.setCustomParameters({   
    prompt : "select_account "
});

const auth2 = getAuth();
//connectAuthEmulator(auth, 'http://127.0.0.1:9099');
export const signInWithGooglePopup = () => signInWithPopup(auth2, provider);

export default firebaseApp;