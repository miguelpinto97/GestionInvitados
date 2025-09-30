import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC6Di7CyehlsNI08PGpBHU75VJhVMWxEJs",
  authDomain: "invitadosboda-e1314.firebaseapp.com",
  projectId: "invitadosboda-e1314",
  storageBucket: "invitadosboda-e1314.firebasestorage.app",
  messagingSenderId: "159250168397",
  appId: "1:159250168397:web:aa693cd4472ba0bf2f3a04",
  measurementId: "G-6Y772NVW4S"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
