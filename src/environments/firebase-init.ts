// src/firebase-init.ts
import { initializeApp } from 'firebase/app';

export const firebaseStorage = {
   apiKey: '...',
   authDomain: '...',
   projectId: '...',
   storageBucket: 'your-bucket.appspot.com',
   messagingSenderId: '...',
   appId: '...'
};

export const firebaseApp = initializeApp(firebaseStorage);
