# Firebase Setup Guide

## Configuration

Firebase has been successfully configured in your project. The configuration file is located at:
- `config/firebase.ts`

## Available Services

The following Firebase services are ready to use:

- **Authentication** (`auth`)
- **Firestore Database** (`db`)
- **Cloud Storage** (`storage`)

## Usage Examples

### Import Firebase Services

```typescript
import { auth, db, storage } from '@/config/firebase';
```

### Authentication Example

```typescript
import { auth } from '@/config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

// Sign up
const signUp = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('User created:', userCredential.user);
  } catch (error) {
    console.error('Sign up error:', error);
  }
};

// Sign in
const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('User signed in:', userCredential.user);
  } catch (error) {
    console.error('Sign in error:', error);
  }
};

// Sign out
const handleSignOut = async () => {
  try {
    await signOut(auth);
    console.log('User signed out');
  } catch (error) {
    console.error('Sign out error:', error);
  }
};
```

### Firestore Database Example

```typescript
import { db } from '@/config/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

// Add a document
const addData = async () => {
  try {
    const docRef = await addDoc(collection(db, 'users'), {
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: new Date()
    });
    console.log('Document written with ID:', docRef.id);
  } catch (error) {
    console.error('Error adding document:', error);
  }
};

// Get all documents
const getData = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    querySnapshot.forEach((doc) => {
      console.log(doc.id, ' => ', doc.data());
    });
  } catch (error) {
    console.error('Error getting documents:', error);
  }
};

// Get a single document
const getUser = async (userId: string) => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log('Document data:', docSnap.data());
    } else {
      console.log('No such document!');
    }
  } catch (error) {
    console.error('Error getting document:', error);
  }
};

// Update a document
const updateUser = async (userId: string) => {
  try {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, {
      name: 'Jane Doe'
    });
    console.log('Document updated');
  } catch (error) {
    console.error('Error updating document:', error);
  }
};

// Delete a document
const deleteUser = async (userId: string) => {
  try {
    await deleteDoc(doc(db, 'users', userId));
    console.log('Document deleted');
  } catch (error) {
    console.error('Error deleting document:', error);
  }
};
```

### Cloud Storage Example

```typescript
import { storage } from '@/config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Upload a file
const uploadFile = async (file: Blob, fileName: string) => {
  try {
    const storageRef = ref(storage, `uploads/${fileName}`);
    const snapshot = await uploadBytes(storageRef, file);
    console.log('Uploaded file:', snapshot);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('File available at:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
  }
};
```

## React Hook Example

Create a custom hook to listen to auth state changes:

```typescript
import { useEffect, useState } from 'react';
import { auth } from '@/config/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, loading };
};
```

## Important Notes

- Firebase is automatically initialized when the app starts (imported in `app/_layout.tsx`)
- Analytics is not enabled for React Native (web only)
- Make sure to set up Firebase Security Rules in the Firebase Console
- For production, consider moving sensitive config to environment variables

## Next Steps

1. Set up Firebase Authentication methods in the Firebase Console
2. Create Firestore collections and set security rules
3. Configure Storage rules if using file uploads
4. Add error handling and loading states to your components
