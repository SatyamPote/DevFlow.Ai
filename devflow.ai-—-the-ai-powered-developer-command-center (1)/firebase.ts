// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBCTVaWbBoAoOY83rCHe0gTBF_WlLNNxRY",
  authDomain: "dev-flow-a64f6.firebaseapp.com",
  projectId: "dev-flow-a64f6",
  storageBucket: "dev-flow-a64f6.firebasestorage.app",
  messagingSenderId: "475221429769",
  appId: "1:475221429769:web:8bef514b34a6362d7332d8",
  measurementId: "G-3R4TGBS150"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);