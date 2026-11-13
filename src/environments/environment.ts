export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000',
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
