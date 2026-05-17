// Simple test script to verify Firebase connection and data fetching
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, orderBy, query } = require('firebase/firestore');

// Firebase config from your config file
const firebaseConfig = {
  apiKey: "AIzaSyBxIT4G14GD2aEKEbgLRwBhx8QxdZc37ls",
  authDomain: "toko-sp.firebaseapp.com",
  projectId: "toko-sp",
  storageBucket: "toko-sp.firebasestorage.app",
  messagingSenderId: "815485205204",
  appId: "1:815485205204:web:58df2e1562547472435941",
  measurementId: "G-1X1D68LG18"
};

async function testNoticesFetch() {
  try {
    console.log('Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('Fetching notices from Firestore...');
    const q = query(
      collection(db, 'Notices'),
      orderBy('date', 'desc')
    );
    
    const snap = await getDocs(q);
    console.log(`Found ${snap.docs.length} notices`);
    
    if (snap.docs.length > 0) {
      console.log('Sample notice data:');
      const firstDoc = snap.docs[0];
      console.log({
        id: firstDoc.id,
        data: firstDoc.data()
      });
    } else {
      console.log('No notices found. You may need to add some sample data to the Notices collection.');
    }
    
    console.log('✅ Firebase connection test successful!');
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
  }
}

testNoticesFetch();
