import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAB6XbdgmfcBB0YT8ZkNqMpvhYmLmWPjWw",
  authDomain: "mesaparados-4a0bf.firebaseapp.com",
  projectId: "mesaparados-4a0bf",
  storageBucket: "mesaparados-4a0bf.firebasestorage.app",
  messagingSenderId: "750936723749",
  appId: "1:750936723749:web:95768956b0520a08ab4acc"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
