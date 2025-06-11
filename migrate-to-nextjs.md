# Migration Guide: React App to Next.js

This guide will help you migrate the current unified React application to Next.js.

## Prerequisites

- Node.js 14+ installed
- Current project structure already unified (completed)

## Step 1: Create Next.js Project

```bash
# Create new Next.js project
npx create-next-app@latest materiioptionale-nextjs --typescript --tailwind --eslint --app --src-dir --import-alias="@/*"

# Navigate to new project
cd materiioptionale-nextjs
```

## Step 2: Copy Configuration Files

```bash
# From current project root, copy these files to Next.js project:
cp tailwind.config.js ../materiioptionale-nextjs/
cp .env ../materiioptionale-nextjs/
cp .gitignore ../materiioptionale-nextjs/
```

## Step 3: Update Package.json Dependencies

Add these dependencies to the Next.js project:

```json
{
  "dependencies": {
    "@reduxjs/toolkit": "^2.3.0",
    "axios": "^1.7.7",
    "firebase": "^11.0.2",
    "firebase-admin": "^13.0.0",
    "framer-motion": "^11.11.17",
    "lucide-react": "^0.460.0",
    "react-redux": "^9.1.2",
    "html-pdf": "^3.0.1",
    "node-latex": "^3.1.0",
    "openai": "^4.72.0"
  }
}
```

## Step 4: File Migration Map

### Components (Direct Copy)
```bash
# Copy all components
cp -r src/components/* ../materiioptionale-nextjs/src/components/

# Copy utilities
cp -r src/utils/* ../materiioptionale-nextjs/src/utils/

# Copy Redux store
cp -r src/redux/* ../materiioptionale-nextjs/src/redux/
cp -r src/store/* ../materiioptionale-nextjs/src/store/

# Copy providers
cp -r src/providers/* ../materiioptionale-nextjs/src/providers/
```

### Pages (Convert to Next.js format)
```bash
# Copy pages as starting point
cp -r src/pages/* ../materiioptionale-nextjs/src/app/
```

Then convert each page to Next.js App Router format:

**Before (React Router):**
```jsx
// src/pages/Dashboard.js
import React from 'react';

const Dashboard = () => {
  return <div>Dashboard Content</div>;
};

export default Dashboard;
```

**After (Next.js App Router):**
```jsx
// src/app/dashboard/page.js
export default function Dashboard() {
  return <div>Dashboard Content</div>;
}
```

### API Routes (Convert to Next.js API)
```bash
# Create API directory
mkdir -p ../materiioptionale-nextjs/src/app/api
```

**Convert each API route:**

**Before (Express):**
```javascript
// server/routes/userRoutes.js
router.post('/create', verifyToken, createUser);
router.get('/:uid', verifyToken, getUserInfo);
```

**After (Next.js API):**
```javascript
// src/app/api/users/create/route.js
import { verifyToken } from '@/middleware/auth';
import { createUser } from '@/controllers/userController';

export async function POST(request) {
  try {
    const token = request.headers.get('authorization');
    const isValid = await verifyToken(token);
    if (!isValid) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const result = await createUser(request);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// src/app/api/users/[uid]/route.js
export async function GET(request, { params }) {
  const { uid } = params;
  // Implementation here
}
```

### Firebase Configuration
```bash
# Copy Firebase config
cp src/firebase.js ../materiioptionale-nextjs/src/lib/firebase.js
cp server/config/firebase.js ../materiioptionale-nextjs/src/lib/firebase-admin.js
```

### Services and Business Logic
```bash
# Copy services
cp -r src/services/* ../materiioptionale-nextjs/src/lib/services/

# Copy server controllers and adapt them
cp -r server/controllers/* ../materiioptionale-nextjs/src/lib/controllers/
cp -r server/middleware/* ../materiioptionale-nextjs/src/lib/middleware/
```

## Step 5: Update Import Paths

Use Next.js alias system (@/*) and update imports:

**Before:**
```javascript
import { db } from '../firebase/firebase';
import { createUser } from '../../services/api';
```

**After:**
```javascript
import { db } from '@/lib/firebase';
import { createUser } from '@/lib/services/api';
```

## Step 6: Configure Next.js

### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  env: {
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  },
}

module.exports = nextConfig
```

### src/app/layout.js
```jsx
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/providers/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Materii Optionale UVT',
  description: 'Optional courses management for UVT',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

## Step 7: API Route Examples

### User Management API
```javascript
// src/app/api/users/create/route.js
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    const body = await request.json();
    const { uid, email } = body;
    
    // Create user logic here
    const userRef = adminDb.collection('users').doc(uid);
    await userRef.set({
      uid,
      email,
      role: determineRole(email),
      createdAt: new Date().toISOString()
    });
    
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

### Enrollment API
```javascript
// src/app/api/enrollment/process/[pachetId]/route.js
import { alocaMateriiPreferate } from '@/lib/services/enrollmentService';

export async function POST(request, { params }) {
  try {
    const { pachetId } = params;
    const results = await alocaMateriiPreferate(pachetId);
    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

## Step 8: Update Client-Side Services

Update API calls to use Next.js API routes:

```javascript
// src/lib/services/api.js
const API_URL = '/api'; // No longer need full URL

export const createUser = async (token, userData = {}) => {
  const response = await fetch(`${API_URL}/users/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(userData)
  });
  
  if (!response.ok) throw new Error('Failed to create user');
  return response.json();
};
```

## Step 9: Testing and Deployment

1. **Test locally:**
   ```bash
   npm run dev
   ```

2. **Build for production:**
   ```bash
   npm run build
   ```

3. **Deploy to Vercel:**
   ```bash
   npx vercel
   ```

## Step 10: Cleanup

After successful migration and testing:

1. Remove old project structure
2. Update documentation
3. Update deployment pipelines
4. Archive old repository if needed

## Benefits After Migration

- **Server-side rendering** for better SEO
- **API routes** in the same codebase
- **Automatic code splitting**
- **Built-in optimizations**
- **Easy deployment** on Vercel
- **Better developer experience**

## Common Issues and Solutions

### 1. Import Errors
- Use `@/` alias for cleaner imports
- Check file extensions (.js vs .jsx)

### 2. API Route Issues
- Ensure proper HTTP methods (GET, POST, etc.)
- Use `params` for dynamic routes
- Handle errors properly

### 3. Firebase Admin SDK
- Use only in API routes (server-side)
- Keep client SDK for client-side operations

### 4. Environment Variables
- Prefix client variables with `NEXT_PUBLIC_`
- Server variables don't need prefix

This migration will result in a more maintainable, performant, and scalable application ready for modern deployment platforms. 