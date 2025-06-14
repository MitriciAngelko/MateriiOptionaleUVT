const admin = require('firebase-admin');
require('dotenv').config({ path: '../.env' });

// Environment-aware logger
const logger = {
  info: (message, data = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[FIREBASE] ${message}`, data);
    }
  },
  error: (message, error = {}) => {
    console.error(`[FIREBASE ERROR] ${message}`, error);
  }
};

// Validate required environment variables
const requiredEnvVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  logger.error('Missing Firebase configuration environment variables', { missing: missingEnvVars });
  logger.error('Make sure .env file exists with the required Firebase configuration.');
  process.exit(1);
}

// Debug environment variables (only in development)
logger.info('Firebase Admin SDK Initialization', {
  projectId: process.env.FIREBASE_PROJECT_ID,
  hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
  hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY
});

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

  logger.info('Firebase Admin SDK initialized successfully!');
} catch (error) {
  logger.error('ERROR initializing Firebase Admin SDK', error);
  process.exit(1);
}

module.exports = admin;
