# TechLedger Local Development Setup Guide

**Platform:** Windows 11  
**Node Version:** v20.15.0 ✅  
**Python Version:** 3.9.11 ✅  
**Date Created:** 2025-11-01  
**Estimated Setup Time:** 2-3 hours

---

## Prerequisites Check

You already have:
- ✅ Node.js v20.15.0 (perfect for this project)
- ✅ Python 3.9.11 (needed for some tooling)
- ✅ Windows 11

---

## Part 1: Install PostgreSQL (30 minutes)

### Option A: PostgreSQL Native Install (Recommended for Beginners)

1. **Download PostgreSQL 16** for Windows:
   - Visit: https://www.postgresql.org/download/windows/
   - Download the installer from EnterpriseDB
   - Choose PostgreSQL 16.x (latest stable)

2. **Run Installer:**
   - Double-click the downloaded `.exe`
   - Installation directory: Keep default (`C:\Program Files\PostgreSQL\16`)
   - Components: Select all (PostgreSQL Server, pgAdmin 4, Stack Builder, Command Line Tools)
   - Data directory: Keep default
   - **Password:** Choose a strong password and SAVE IT (e.g., `techledger_dev_2025`)
   - Port: Keep default `5432`
   - Locale: Keep default

3. **Verify Installation:**
   ```bash
   # Open Command Prompt or PowerShell
   psql --version
   # Should output: psql (PostgreSQL) 16.x
   ```

4. **Create Development Database:**
   ```bash
   # Login to PostgreSQL (use password from step 2)
   psql -U postgres
   
   # In psql prompt:
   CREATE DATABASE techledger_dev;
   CREATE USER techledger WITH PASSWORD 'local_dev_password_123';
   GRANT ALL PRIVILEGES ON DATABASE techledger_dev TO techledger;
   \q
   ```

5. **Test Connection:**
   ```bash
   psql -U techledger -d techledger_dev
   # Enter password: local_dev_password_123
   # Should connect successfully
   \q
   ```

### Option B: PostgreSQL via Docker (For Advanced Users)

Only choose this if you're comfortable with Docker:

1. **Install Docker Desktop for Windows:**
   - Download from: https://www.docker.com/products/docker-desktop/
   - Install and restart computer
   - Start Docker Desktop

2. **Run PostgreSQL Container:**
   ```bash
   docker run --name techledger-postgres ^
     -e POSTGRES_USER=techledger ^
     -e POSTGRES_PASSWORD=local_dev_password_123 ^
     -e POSTGRES_DB=techledger_dev ^
     -p 5432:5432 ^
     -d postgres:16
   ```

3. **Verify:**
   ```bash
   docker ps  # Should see techledger-postgres running
   ```

---

## Part 2: Project Structure Setup (15 minutes)

1. **Create Project Root:**
   ```bash
   # Navigate to where you want your project
   cd C:\Users\YourUsername\Documents
   
   # Create project folder
   mkdir techledger
   cd techledger
   ```

2. **Initialize Git:**
   ```bash
   git init
   
   # Create .gitignore
   echo node_modules/ > .gitignore
   echo .env >> .gitignore
   echo .env.local >> .gitignore
   echo dist/ >> .gitignore
   echo build/ >> .gitignore
   echo uploads/ >> .gitignore
   echo *.log >> .gitignore
   ```

3. **Create Folder Structure:**
   ```bash
   mkdir backend
   mkdir frontend
   mkdir docs
   mkdir uploads
   ```

Your structure should look like:
```
techledger/
├── backend/          (Node.js + Express API)
├── frontend/         (React + TypeScript)
├── docs/            (ADRs, notes, documentation)
├── uploads/         (Local file storage for development)
└── .gitignore
```

---

## Part 3: Backend Setup (30 minutes)

### 3.1 Initialize Backend

```bash
cd backend
npm init -y
```

### 3.2 Install Core Dependencies

```bash
# Core framework
npm install express cors dotenv

# Database
npm install pg

# File uploads
npm install multer

# Validation & utilities
npm install express-validator

# Development tools
npm install --save-dev nodemon typescript @types/node @types/express @types/cors @types/multer
```

### 3.3 Initialize TypeScript

```bash
npx tsc --init
```

Edit `backend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### 3.4 Create Backend Structure

```bash
mkdir src
mkdir src\routes
mkdir src\controllers
mkdir src\services
mkdir src\db
mkdir src\types
```

### 3.5 Create Environment File

Create `backend/.env`:
```env
# Database
DATABASE_URL=postgresql://techledger:local_dev_password_123@localhost:5432/techledger_dev

# Server
PORT=3001
NODE_ENV=development

# File Upload
UPLOAD_DIR=../uploads
MAX_FILE_SIZE=10485760

# Google Cloud Vision (will add API key later)
GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_APPLICATION_CREDENTIALS=

# Cors
FRONTEND_URL=http://localhost:5173
```

### 3.6 Create Basic Server

Create `backend/src/server.ts`:
```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'TechLedger API is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});
```

### 3.7 Create Database Connection

Create `backend/src/db/connection.ts`:
```typescript
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
  } else {
    console.log('✅ Database connected at:', res.rows[0].now);
  }
});

export default pool;
```

### 3.8 Update package.json Scripts

Edit `backend/package.json`, add to "scripts":
```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

### 3.9 Test Backend

```bash
# From backend directory
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:3001
📊 Environment: development
✅ Database connected at: [timestamp]
```

Test in browser: http://localhost:3001/health

---

## Part 4: Frontend Setup (30 minutes)

### 4.1 Create React App with Vite

```bash
# From techledger root directory
cd ..
npm create vite@latest frontend -- --template react-ts
```

Answer prompts:
- ✔ Select a framework: › **React**
- ✔ Select a variant: › **TypeScript**

### 4.2 Install Frontend Dependencies

```bash
cd frontend
npm install

# UI/UX libraries
npm install axios react-router-dom

# Development tools
npm install --save-dev @types/react-router-dom
```

### 4.3 Create Frontend Environment File

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:3001
```

### 4.4 Update Vite Config

Edit `frontend/vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})
```

### 4.5 Create Basic API Client

Create `frontend/src/services/api.ts`:
```typescript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
```

### 4.6 Update App Component

Replace `frontend/src/App.tsx`:
```typescript
import { useEffect, useState } from 'react'
import './App.css'
import { healthCheck } from './services/api'

function App() {
  const [apiStatus, setApiStatus] = useState<string>('Checking...');

  useEffect(() => {
    const checkAPI = async () => {
      try {
        const data = await healthCheck();
        setApiStatus(`✅ Connected: ${data.message}`);
      } catch (error) {
        setApiStatus('❌ Backend not responding');
      }
    };
    checkAPI();
  }, []);

  return (
    <div className="App">
      <h1>TechLedger</h1>
      <h2>Local Development Environment</h2>
      <p>API Status: {apiStatus}</p>
      <div className="card">
        <h3>Environment Check:</h3>
        <ul style={{ textAlign: 'left' }}>
          <li>Frontend: Running on http://localhost:5173</li>
          <li>Backend: Running on http://localhost:3001</li>
          <li>Database: PostgreSQL on localhost:5432</li>
        </ul>
      </div>
    </div>
  )
}

export default App
```

### 4.7 Start Frontend

```bash
# From frontend directory
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

Visit: http://localhost:5173/

You should see "✅ Connected" if backend is running!

---

## Part 5: Database Schema Setup (30 minutes)

### 5.1 Create Initial Schema

Create `backend/src/db/schema.sql`:
```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Systems table (top level - e.g., "Salesforce", "QuickBooks")
CREATE TABLE systems (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Actions table (atomic documentation units)
CREATE TABLE actions (
    id SERIAL PRIMARY KEY,
    system_id INTEGER REFERENCES systems(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    steps JSONB,
    screenshots JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Screenshots table
CREATE TABLE screenshots (
    id SERIAL PRIMARY KEY,
    action_id INTEGER REFERENCES actions(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255),
    ocr_data JSONB,
    vision_data JSONB,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roles table (for role-based navigation)
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table (for task-based navigation)
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role-Task junction table (many-to-many)
CREATE TABLE role_tasks (
    id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    UNIQUE(role_id, task_id)
);

-- Task-Action junction table (many-to-many)
CREATE TABLE task_actions (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    action_id INTEGER REFERENCES actions(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    notes TEXT,
    UNIQUE(task_id, action_id)
);

-- Create indexes for common queries
CREATE INDEX idx_actions_system_id ON actions(system_id);
CREATE INDEX idx_screenshots_action_id ON screenshots(action_id);
CREATE INDEX idx_role_tasks_role_id ON role_tasks(role_id);
CREATE INDEX idx_role_tasks_task_id ON role_tasks(task_id);
CREATE INDEX idx_task_actions_task_id ON task_actions(task_id);
CREATE INDEX idx_task_actions_action_id ON task_actions(action_id);
```

### 5.2 Run Schema

```bash
# From techledger root
psql -U techledger -d techledger_dev -f backend/src/db/schema.sql

# Or if you saved your postgres password:
set PGPASSWORD=local_dev_password_123
psql -U techledger -d techledger_dev -f backend/src/db/schema.sql
```

### 5.3 Verify Tables Created

```bash
psql -U techledger -d techledger_dev

# In psql:
\dt

# Should see: users, systems, actions, screenshots, roles, tasks, role_tasks, task_actions
\q
```

---

## Part 6: Google Cloud Vision API Setup (30 minutes)

### 6.1 Create Google Cloud Project

1. Go to: https://console.cloud.google.com/
2. Sign in with Google account (free tier includes $300 credit)
3. Click "Select a project" → "New Project"
   - Project name: `techledger-dev`
   - Click "Create"

### 6.2 Enable Vision API

1. In Google Cloud Console, go to: **APIs & Services** → **Library**
2. Search for: "Cloud Vision API"
3. Click on it → Click "Enable"
4. Wait 1-2 minutes for activation

### 6.3 Create Service Account & Download Credentials

1. Go to: **APIs & Services** → **Credentials**
2. Click "+ CREATE CREDENTIALS" → "Service Account"
3. Service account details:
   - Name: `techledger-vision-dev`
   - ID: (auto-generated)
   - Click "Create and Continue"
4. Grant access:
   - Role: **Project** → **Editor** (or specific: Cloud Vision AI Service Agent)
   - Click "Continue" → "Done"
5. Click on the service account you just created
6. Go to "Keys" tab → "Add Key" → "Create new key"
7. Key type: **JSON** → Click "Create"
8. Save the downloaded JSON file as: `techledger\backend\google-vision-credentials.json`

⚠️ **IMPORTANT:** Add to `.gitignore`:
```bash
# From techledger root
echo google-vision-credentials.json >> .gitignore
echo backend/google-vision-credentials.json >> backend/.gitignore
```

### 6.4 Update Backend Environment

Edit `backend/.env`:
```env
# Add/update these lines:
GOOGLE_CLOUD_PROJECT_ID=techledger-dev
GOOGLE_APPLICATION_CREDENTIALS=./google-vision-credentials.json
```

### 6.5 Install Vision API Client

```bash
cd backend
npm install @google-cloud/vision
```

### 6.6 Create Vision Service

Create `backend/src/services/visionService.ts`:
```typescript
import vision from '@google-cloud/vision';
import dotenv from 'dotenv';

dotenv.config();

const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

export interface OCRResult {
  fullText: string;
  words: Array<{
    text: string;
    confidence: number;
    boundingBox: any;
  }>;
}

export const analyzeImage = async (imagePath: string): Promise<OCRResult> => {
  try {
    const [result] = await client.textDetection(imagePath);
    const detections = result.textAnnotations;

    if (!detections || detections.length === 0) {
      return {
        fullText: '',
        words: [],
      };
    }

    // First detection is the full text
    const fullText = detections[0].description || '';

    // Rest are individual words
    const words = detections.slice(1).map((text) => ({
      text: text.description || '',
      confidence: text.confidence || 0,
      boundingBox: text.boundingPoly,
    }));

    return {
      fullText,
      words,
    };
  } catch (error) {
    console.error('Vision API Error:', error);
    throw error;
  }
};

export const testVisionAPI = async (): Promise<boolean> => {
  try {
    // Simple test - try to initialize client
    console.log('Testing Vision API connection...');
    const test = await client.textDetection('https://via.placeholder.com/300');
    console.log('✅ Vision API connected successfully');
    return true;
  } catch (error: any) {
    console.error('❌ Vision API connection failed:', error.message);
    return false;
  }
};
```

### 6.7 Add Vision API Test Endpoint

Update `backend/src/server.ts`, add before `app.listen`:
```typescript
import { testVisionAPI } from './services/visionService';

// Test Vision API
app.get('/api/vision/test', async (req, res) => {
  try {
    const isConnected = await testVisionAPI();
    res.json({
      status: isConnected ? 'connected' : 'failed',
      message: isConnected
        ? 'Vision API is working'
        : 'Vision API connection failed',
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});
```

### 6.8 Test Vision API

Restart backend (`npm run dev`), then visit:
http://localhost:3001/api/vision/test

Should see: `{ "status": "connected", "message": "Vision API is working" }`

---

## Part 7: File Upload Setup (20 minutes)

### 7.1 Create Upload Route

Create `backend/src/routes/uploadRoutes.ts`:
```typescript
import express from 'express';
import multer from 'multer';
import path from 'path';
import { analyzeImage } from '../services/visionService';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Upload endpoint
router.post('/upload', upload.single('screenshot'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('📁 File uploaded:', req.file.filename);

    // Analyze with Vision API
    console.log('🔍 Analyzing with Vision API...');
    const ocrResult = await analyzeImage(req.file.path);

    res.json({
      success: true,
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        path: req.file.path,
      },
      ocr: {
        fullText: ocrResult.fullText,
        wordCount: ocrResult.words.length,
      },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: error.message,
    });
  }
});

export default router;
```

### 7.2 Register Upload Routes

Update `backend/src/server.ts`, add after middleware:
```typescript
import uploadRoutes from './routes/uploadRoutes';

// Routes
app.use('/api', uploadRoutes);
```

### 7.3 Create Upload UI Component

Create `frontend/src/components/UploadForm.tsx`:
```typescript
import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('screenshot', file);

    try {
      const response = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Upload Screenshot</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ marginBottom: '10px' }}
        />
        <button
          type="submit"
          disabled={!file || uploading}
          style={{
            padding: '10px 20px',
            backgroundColor: file ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            cursor: file ? 'pointer' : 'not-allowed',
          }}
        >
          {uploading ? 'Uploading...' : 'Upload & Analyze'}
        </button>
      </form>

      {error && (
        <div style={{ color: 'red', marginTop: '20px' }}>
          Error: {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '20px', textAlign: 'left' }}>
          <h3>✅ Upload Successful!</h3>
          <p><strong>Filename:</strong> {result.file.originalName}</p>
          <p><strong>Size:</strong> {(result.file.size / 1024).toFixed(2)} KB</p>
          <p><strong>Words Detected:</strong> {result.ocr.wordCount}</p>
          <div style={{
            backgroundColor: '#f5f5f5',
            padding: '15px',
            borderRadius: '5px',
            marginTop: '10px',
            maxHeight: '200px',
            overflow: 'auto',
          }}>
            <strong>Extracted Text:</strong>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
              {result.ocr.fullText || '(No text detected)'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadForm;
```

### 7.4 Update App to Use Upload Form

Update `frontend/src/App.tsx`:
```typescript
import { useEffect, useState } from 'react'
import './App.css'
import { healthCheck } from './services/api'
import UploadForm from './components/UploadForm'

function App() {
  const [apiStatus, setApiStatus] = useState<string>('Checking...');

  useEffect(() => {
    const checkAPI = async () => {
      try {
        const data = await healthCheck();
        setApiStatus(`✅ Connected: ${data.message}`);
      } catch (error) {
        setApiStatus('❌ Backend not responding');
      }
    };
    checkAPI();
  }, []);

  return (
    <div className="App">
      <h1>TechLedger MVP</h1>
      <p style={{ fontSize: '14px', color: '#666' }}>API Status: {apiStatus}</p>
      <hr />
      <UploadForm />
    </div>
  )
}

export default App
```

---

## Part 8: Testing Your Setup (15 minutes)

### 8.1 Start All Services

Open **three** terminal windows:

**Terminal 1 - Backend:**
```bash
cd C:\Users\YourUsername\Documents\techledger\backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd C:\Users\YourUsername\Documents\techledger\frontend
npm run dev
```

**Terminal 3 - Database Check:**
```bash
psql -U techledger -d techledger_dev
SELECT COUNT(*) FROM users;  -- Should return 0
\q
```

### 8.2 Test Full Flow

1. Open browser: http://localhost:5173
2. Take a screenshot (Win + Shift + S)
3. Save screenshot to Desktop
4. Drag screenshot into the upload area
5. Click "Upload & Analyze"
6. Wait 2-5 seconds
7. See extracted text!

### 8.3 Expected Results

✅ Frontend shows "✅ Connected"  
✅ Backend console shows "Database connected"  
✅ Upload succeeds  
✅ OCR text appears  

---

## Common Issues & Fixes

### Issue: PostgreSQL won't start
**Fix:**
```bash
# Check if running
net start postgresql-x64-16

# Or restart
net stop postgresql-x64-16
net start postgresql-x64-16
```

### Issue: Port 5432 already in use
**Fix:**
```bash
# Find what's using port
netstat -ano | findstr :5432

# Kill process (replace PID)
taskkill /PID [PID] /F
```

### Issue: "Cannot find module '@google-cloud/vision'"
**Fix:**
```bash
cd backend
npm install @google-cloud/vision
```

### Issue: CORS errors in browser
**Fix:** Check `backend/.env` has:
```
FRONTEND_URL=http://localhost:5173
```

### Issue: Vision API "403 Forbidden"
**Fix:**
1. Check Google Cloud Console → APIs & Services → Vision API is **Enabled**
2. Check service account has Editor role
3. Check credentials file path in `.env`

---

## Next Steps

Now that your local environment is working:

1. ✅ Create a test user in database
2. ✅ Add more upload tests with different screenshots
3. ✅ Start building the Q&A interface for training
4. ✅ Create your first Action in the database
5. 📝 Document any custom setup steps you needed

---

## Environment Summary

**What's Running:**
- PostgreSQL: `localhost:5432`
- Backend API: `http://localhost:3001`
- Frontend: `http://localhost:5173`
- Google Vision API: Cloud (free tier)

**Project Structure:**
```
C:\Users\YourUsername\Documents\techledger\
├── backend/
│   ├── src/
│   ├── node_modules/
│   ├── google-vision-credentials.json (SECRET!)
│   └── .env (SECRET!)
├── frontend/
│   ├── src/
│   └── node_modules/
├── uploads/ (gitignored)
└── docs/
```

**Credentials to Save:**
- PostgreSQL password: `local_dev_password_123`
- Google Cloud project: `techledger-dev`
- Service account JSON: `backend/google-vision-credentials.json`

---

## Backup & Version Control

```bash
# From techledger root

# First commit
git add .
git commit -m "Initial local dev setup"

# Create GitHub repo and push
git remote add origin https://github.com/yourusername/techledger.git
git push -u origin main
```

**NEVER COMMIT:**
- `.env` files
- `google-vision-credentials.json`
- `node_modules/`
- `uploads/` directory

---

## Success! 🎉

Your local development environment is ready. You can now:
- Upload screenshots
- Extract text with Vision API
- Store data in PostgreSQL
- Build the collaborative AI training system

**Time to start coding the core features!**
