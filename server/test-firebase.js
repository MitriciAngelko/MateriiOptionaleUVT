// Firebase Admin SDK Test Script
require('dotenv').config();
const admin = require('./config/firebase');

console.log('Starting Firebase Admin SDK test...');
console.log('Environment variables:');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('FIREBASE_CLIENT_EMAIL exists:', !!process.env.FIREBASE_CLIENT_EMAIL);
console.log('FIREBASE_PRIVATE_KEY exists:', !!process.env.FIREBASE_PRIVATE_KEY);
console.log('FIREBASE_STORAGE_BUCKET exists:', !!process.env.FIREBASE_STORAGE_BUCKET);

// Try to list users
admin.auth().listUsers(10)
  .then((listUsersResult) => {
    console.log('Successfully listed users:');
    listUsersResult.users.forEach((userRecord) => {
      console.log('User:', userRecord.toJSON());
    });
    
    // If you want to test user deletion, uncomment this section and replace UID
    /*
    const testUid = 'REPLACE_WITH_TEST_USER_UID';
    console.log(`Attempting to delete user: ${testUid}`);
    return admin.auth().deleteUser(testUid);
    */
  })
  .then(() => {
    // Will only run if deleteUser is uncommented
    // console.log('Successfully deleted test user');
  })
  .catch((error) => {
    console.error('Error:', error);
  }); 