# MateriiOptionale UVT - Academic Management System

A full-stack web application for managing optional courses at West University of Timișoara (UVT).

## 🏗️ Project Structure

```
project/
├── backend/           # Express.js server
│   ├── index.js      # Main server file  
│   ├── package.json  # Backend dependencies
│   ├── routes/       # API routes
│   ├── controllers/  # Business logic
│   ├── services/     # External services
│   ├── middleware/   # Custom middleware
│   ├── config/       # Configuration files
│   └── utils/        # Utility functions
├── frontend/         # React application
│   ├── src/          # React source code
│   ├── public/       # Static assets
│   ├── build/        # Production build (generated)
│   └── package.json  # Frontend dependencies
├── vercel.json       # Vercel deployment config
└── package.json      # Root project scripts
```

## 🚀 Vercel Deployment

This project is configured for seamless deployment on Vercel with the following structure:

### Deployment Process

1. **Backend**: Express.js server serves both API routes and static React files
2. **Frontend**: React app builds to `/frontend/build` directory
3. **Static Serving**: Backend serves React static files and handles routing
4. **API Routes**: All API endpoints available under `/api/*`

### Build Configuration

The `vercel.json` configures:
- **Build Source**: `backend/index.js` as the main server
- **Build Command**: Installs dependencies and builds frontend automatically
- **Routing**: All requests routed through the Express server

### Environment Variables

Set these environment variables in Vercel dashboard:
- `NODE_ENV=production`
- `ALLOWED_ORIGINS` (comma-separated list of allowed origins)
- Any other environment-specific variables

## 📦 Development Setup

### Prerequisites
- Node.js 18+ 
- npm

### Installation

1. **Install all dependencies**:
   ```bash
   npm run install:all
   ```

2. **Start development servers**:
   ```bash
   npm run dev
   ```
   
   This starts:
   - Backend server on http://localhost:5001
   - React dev server on http://localhost:3000

### Individual Commands

- **Backend only**: `npm run start:backend`
- **Frontend only**: `npm run start:frontend`  
- **Build frontend**: `npm run build`
- **Health check**: `npm run health`

## 🔧 API Endpoints

- **Health Check**: `GET /health`
- **API Routes**: `GET /api/*` (all API endpoints)
- **Static Files**: All other routes serve React app

## 🎯 Key Features

- **Firebase Integration**: Authentication and data management
- **OpenAI Integration**: AI-powered features
- **PDF Generation**: Academic document creation
- **LaTeX Support**: Mathematical content rendering
- **Redux State Management**: Predictable state updates
- **Responsive Design**: Mobile-first UI with Tailwind CSS

## 📱 Technology Stack

### Frontend
- React 18
- Redux Toolkit
- React Router
- Tailwind CSS
- Framer Motion
- Lucide React Icons

### Backend  
- Express.js
- Firebase Admin SDK
- OpenAI API
- PDF Generation (html-pdf)
- LaTeX Processing (node-latex)

### Deployment
- Vercel (Serverless Functions)
- Automatic builds and deployments
- Environment-based configuration

## 🔐 Security Features

- CORS protection with environment-specific origins
- Request size limits (10MB)
- Error message filtering in production
- Secure environment variable handling

## 📊 Performance Optimizations

- Gzip compression for all responses
- Static file caching
- Efficient bundle splitting
- Memory management patterns
- Request/response optimization

## 🚀 Deployment Instructions

1. **Connect to Vercel**:
   ```bash
   vercel --prod
   ```

2. **Or push to connected Git repository** for automatic deployment

3. **Environment Setup**: Configure environment variables in Vercel dashboard

4. **Domain Configuration**: Set up custom domains if needed

The application will automatically build and deploy with zero configuration required.

## 🛠️ Troubleshooting

### Common Issues

1. **Build Failures**: Check that all environment variables are set
2. **CORS Errors**: Verify `ALLOWED_ORIGINS` includes your domain
3. **Static Files**: Ensure frontend builds successfully to `/frontend/build`

### Development Issues

1. **Port Conflicts**: Backend uses 5001, frontend uses 3000
2. **API Connection**: Check backend health endpoint `/health`
3. **Environment Variables**: Copy `.env.example` to `.env`

For more detailed information, check the individual README files in `backend/` and `frontend/` directories.