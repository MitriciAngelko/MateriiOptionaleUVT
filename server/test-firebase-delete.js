// Firebase Admin SDK Delete User Test Script
require('dotenv').config({ path: '../.env' });
const admin = require('./config/firebase');

const testUserUid = process.argv[2]; // Get the UID from command line argument

if (!testUserUid) {
  console.error('ERROR: No user UID provided');
  console.log('Usage: node test-firebase-delete.js <USER_UID>');
  process.exit(1);
}

console.log(`Starting Firebase Admin SDK delete test for user: ${testUserUid}...`);

// Try to get user first to confirm it exists
admin.auth().getUser(testUserUid)
  .then((userRecord) => {
    console.log('User exists:', userRecord.toJSON());
    
    // Now try to delete the user
    console.log(`Attempting to delete user: ${testUserUid}`);
    return admin.auth().deleteUser(testUserUid);
  })
  .then(() => {
    console.log(`SUCCESS: User ${testUserUid} was successfully deleted!`);
  })
  .catch((error) => {
    console.error('ERROR:', error);
  }); 