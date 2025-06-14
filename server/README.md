# MateriiOptionale UVT - Backend Server

Backend API server for the MateriiOptionale UVT application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the server directory with the following variables:
```env
# Server Configuration
PORT=5001
HOST=0.0.0.0
NODE_ENV=development

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000

# Firebase Admin Configuration
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL=your-service-account-email
FIREBASE_ADMIN_CLIENT_ID=your-client-id
FIREBASE_ADMIN_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_ADMIN_TOKEN_URI=https://oauth2.googleapis.com/token

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Database Configuration (if applicable)
DATABASE_URL=your-database-url

# Other API Keys
API_SECRET_KEY=your-secret-key
```

## Development

Start the development server:
```bash
npm run dev
```

## Production

Start the production server:
```bash
npm start
```

## Health Check

Check if the server is running:
```bash
npm run health
```

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /api/users` - User management
- `GET /api/enrollment` - Course enrollment management

## Port

The server runs on port 5001 by default. You can change this by setting the `PORT` environment variable. 