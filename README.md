# Materii Optionale UVT

A web application for managing odptional courses at West University of Timișoara (UVT).

## Architecture Overview

This project consists of two independent packages:
- **Frontend**: React application in the root directory
- **Backend**: Express.js API server in the `server/` directory

Each package can be developed, built, and deployed independently.

### Project Structure

```
materiioptionale-uvt/
├── src/                          # React application source
│   ├── components/               # React components
│   ├── pages/                    # Page components
│   ├── services/                 # Business logic services
│   │   ├── api.js               # API communication layer
│   │   ├── authService.js       # Authentication services
│   │   └── enrollmentService.js # Course enrollment logic
│   ├── utils/                    # Utility functions
│   │   ├── apiUtils.js          # API helpers and validation
│   │   └── userRoles.js         # User role management
│   ├── firebase/                 # Firebase configuration
│   ├── redux/                    # Redux state management
│   └── providers/                # Context providers
├── server/                       # Express.js server (independent package)
│   ├── controllers/              # Request handlers
│   ├── routes/                   # API routes
│   ├── services/                 # Server-side business logic
│   ├── middleware/               # Express middleware
│   ├── config/                   # Server configuration
│   ├── utils/                    # Server utilities
│   ├── package.json             # Backend dependencies
│   ├── .env                     # Backend environment variables
│   └── README.md                # Backend documentation
├── public/                       # Static assets
├── package.json                  # Frontend dependencies
├── .env                         # Frontend environment variables
└── tailwind.config.js           # Tailwind CSS configuration
```

## Technologies Used

### Frontend
- **React 18** - Modern React with hooks and context
- **Redux Toolkit** - State management
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Lucide React** - Icon library
- **Firebase SDK** - Client-side Firebase operations

### Backend
- **Express.js** - Web application framework
- **Firebase Admin SDK** - Server-side Firebase operations
- **CORS** - Cross-origin resource sharing
- **Body Parser** - Request body parsing
- **OpenAI Integration** - AI-powered features
- **PDF Generation** - Document creation capabilities
- **LaTeX Support** - Academic document processing

### Database & Authentication
- **Firebase Firestore** - NoSQL document database
- **Firebase Authentication** - User authentication
- **Firebase Storage** - File storage

## Installation

### Frontend Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   # Frontend Environment Variables
   # All variables must start with REACT_APP_ to be accessible in React

   # Firebase Client Configuration
   REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   REACT_APP_FIREBASE_APP_ID=your-app-id

   # API Configuration
   REACT_APP_API_BASE_URL=http://localhost:5001/api
   REACT_APP_SERVER_URL=http://localhost:5001

   # App Configuration
   REACT_APP_APP_NAME=MateriiOptionale UVT
   REACT_APP_VERSION=1.0.0
   ```

### Backend Setup

1. **Navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the server directory:
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

   # OpenAI Configuration
   OPENAI_API_KEY=your-openai-api-key
   ```

## Running the Application

### Development Mode

**Start Backend Server:**
```bash
cd server
npm run dev
```
Backend will run on `http://localhost:5001`

**Start Frontend (in a new terminal):**
```bash
npm start
```
Frontend will run on `http://localhost:3000`

### Production Mode

**Start Backend Server:**
```bash
cd server
npm start
```

**Build and Serve Frontend:**
```bash
npm run build
# Use a static file server to serve the build folder
```

### Individual Package Commands

**Frontend:**
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run analyze` - Analyze bundle size

**Backend:**
- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run health` - Check server health

## Deployment

### Frontend Deployment
The frontend can be deployed to any static hosting service (Vercel, Netlify, etc.):
1. Run `npm run build`
2. Deploy the `build/` folder
3. Set environment variables in your hosting provider

### Backend Deployment
The backend can be deployed to any Node.js hosting service:
1. Deploy the `server/` folder
2. Set environment variables
3. Run `npm install && npm start`

## API Endpoints

### User Management
- `POST /api/users/create` - Create new user
- `GET /api/users/:uid` - Get user information
- `PUT /api/users/:uid` - Update user profile

### Course Enrollment
- `POST /api/enrollment/process/:pachetId` - Process enrollments (admin only)
- `POST /api/enrollment/period/:pachetId` - Set enrollment period (admin only)
- `GET /api/enrollment/preferences/:studentId/:pachetId` - Get student preferences
- `POST /api/enrollment/preferences/:studentId/:pachetId` - Set student preferences

## User Roles

1. **Admin** (`@admin.com` emails) - Full system access
2. **Professor** (`name.surname@e-uvt.ro` emails) - Grade management
3. **Student** (`name.surname##@e-uvt.ro` emails) - Course enrollment