export const environment = {
  production: true,
  apiUrl: 'https://library-backend-7uet.onrender.com',
  // Borrowing pages exist but are hidden from navigation; flip to true to turn the feature back on.
  borrowingEnabled: false,
  firebase: {
    apiKey: 'YOUR_KEY',
    authDomain: 'YOUR_PROJECT.firebaseapp.com',
    projectId: 'YOUR_PROJECT',
    storageBucket: 'YOUR_PROJECT.appspot.com',
    messagingSenderId: '...',
    appId: '...'
  }
};
