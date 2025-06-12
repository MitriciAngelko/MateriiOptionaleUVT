const admin = require('firebase-admin');
require('dotenv').config({ path: '../.env' });

// Debug environment variables
console.log('Firebase Admin SDK Initialization:');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('FIREBASE_CLIENT_EMAIL exists:', !!process.env.FIREBASE_CLIENT_EMAIL);
console.log('FIREBASE_PRIVATE_KEY exists:', !!process.env.FIREBASE_PRIVATE_KEY);

if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  console.error('ERROR: Missing Firebase configuration environment variables!');
  console.error('Make sure .env file exists with the required Firebase configuration.');
  process.exit(1);
}

try {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });

  console.log('Firebase Admin SDK initialized successfully!');
} catch (error) {
  console.error('ERROR initializing Firebase Admin SDK:', error);
  process.exit(1);
}

module.exports = admin;
