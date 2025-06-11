require('dotenv').config();
const admin = require('../config/firebase');

const setAdminRole = async (uid) => {
  try {
    await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
    console.log('Admin role assigned successfully!');
  } catch (error) {
    console.error('Error assigning admin role:', error);
  }
};

setAdminRole('VLyCKtwa9AZ6skxAroonhJmeemB2');