import { initializeApp } from "firebase/app";
import { initializeAuth } from "firebase/auth";
//import { getReactNativePersistence, initializeAuth } from 'firebase/auth/react-native';
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

export const app = initializeApp(firebaseConfig);
/* export const auth = initializeAuth(app, {
  //persistence: getReactNativePersistence(AsyncStorage),
}); */

export const auth = initializeAuth(app);
export const db = getFirestore(app);
export default db;
