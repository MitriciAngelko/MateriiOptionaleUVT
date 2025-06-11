# Materii Optionale UVT

A web application for managing optional courses at West University of Timișoara (UVT).

## Architecture Overview

This project has been refactored from a separated frontend/backend structure to a unified full-stack application, preparing it for Next.js migration.

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
├── server/                       # Express.js server (temporary)
│   ├── controllers/              # Request handlers
│   ├── routes/                   # API routes
│   ├── services/                 # Server-side business logic
│   ├── middleware/               # Express middleware
│   ├── config/                   # Server configuration
│   └── utils/                    # Server utilities
├── public/                       # Static assets
├── package.json                  # Unified dependencies
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

### Backend (Temporary)
- **Express.js** - Web application framework
- **Firebase Admin SDK** - Server-side Firebase operations
- **CORS** - Cross-origin resource sharing
- **Body Parser** - Request body parsing

### Database & Authentication
- **Firebase Firestore** - NoSQL document database
- **Firebase Authentication** - User authentication
- **Firebase Storage** - File storage

### Additional Features
- **OpenAI Integration** - AI-powered features
- **PDF Generation** - Document creation capabilities
- **LaTeX Support** - Academic document processing

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd materiioptionale-uvt
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   # Firebase Client Configuration
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id

   # Firebase Admin SDK (Server-side)
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
   FIREBASE_STORAGE_BUCKET=your_project.appspot.com

   # API Configuration
   REACT_APP_API_URL=http://localhost:5001/api
   PORT=5001

   # OpenAI Integration
   OPENAI_API_KEY=your_openai_api_key
   ```

## Running the Application

### Development Mode

**Option 1: Run both frontend and backend simultaneously**
```bash
npm run dev
```

**Option 2: Run separately**
```bash
# Terminal 1 - Start the Express server
npm run server

# Terminal 2 - Start the React development server
npm start
```

### Production Mode
```bash
# Build the React application
npm run build

# Start the Express server
npm run server
```

## API Endpoints

### User Management
- `POST /api/users/create` - Create new user
- `GET /api/users/:uid` - Get user information
- `PUT /api/users/:uid` - Update user profile
- `PUT /api/users/:uid/media` - Update student academic average

### Course Enrollment
- `POST /api/enrollment/process/:pachetId` - Process enrollments (admin only)
- `POST /api/enrollment/period/:pachetId` - Set enrollment period (admin only)
- `GET /api/enrollment/preferences/:studentId/:pachetId` - Get student preferences
- `POST /api/enrollment/preferences/:studentId/:pachetId` - Set student preferences
- `GET /api/enrollment/status/:pachetId` - Check enrollment status

## User Roles

The application supports three user roles:

1. **Admin** (`@admin.com` emails)
   - Process course enrollments
   - Set enrollment periods
   - Manage all users

2. **Professor** (`name.surname@e-uvt.ro` emails)
   - Update student grades
   - View enrollment statistics

3. **Student** (`name.surname##@e-uvt.ro` emails)
   - Set course preferences
   - View enrollment status

## Migration to Next.js

This structure is designed to easily migrate to Next.js:

1. **API Routes**: Move `server/routes/*` to `pages/api/*`
2. **Components**: Keep `src/components/*` as `components/*`
3. **Pages**: Convert `src/pages/*` to Next.js pages
4. **Services**: Keep business logic in `lib/` or `utils/`

### Next.js Migration Steps

1. Create a new Next.js project
2. Move React components to `components/`
3. Convert pages to Next.js page structure
4. Move API routes to `pages/api/`
5. Update imports and configuration
6. Deploy on Vercel or similar platform

## Features

### Current Features
- User authentication with Firebase
- Role-based access control
- Course preference management
- Automated course allocation based on grades
- Enrollment period management
- Academic record tracking

### Planned Features
- Quiz/Assessment system
- Enhanced reporting
- PDF generation for enrollment confirmations
- Email notifications
- Course evaluation system

## Development Guidelines

### Code Organization
- Use functional components with hooks
- Implement proper error handling
- Follow Redux Toolkit patterns
- Use TypeScript-ready code structure

### Firebase Usage
- Client-side operations use Firebase SDK
- Server-side operations use Firebase Admin SDK
- Implement proper security rules

### Styling
- Use Tailwind CSS utility classes
- Implement responsive design
- Follow UX best practices

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with proper testing
4. Submit a pull request

## License

This project is developed for educational purposes at West University of Timișoara.