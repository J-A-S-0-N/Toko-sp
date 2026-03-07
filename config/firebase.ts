import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBxIT4G14GD2aEKEbgLRwBhx8QxdZc37ls",
  authDomain: "toko-sp.firebaseapp.com",
  projectId: "toko-sp",
  storageBucket: "toko-sp.firebasestorage.app",
  messagingSenderId: "815485205204",
  appId: "1:815485205204:web:58df2e1562547472435941",
  measurementId: "G-1X1D68LG18"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export default db;
