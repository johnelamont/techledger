import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testVisionAPI } from './services/visionService';
import uploadRoutes from './routes/uploadRoutes';
import linksRoutes from './routes/linksRoutes';  
import userRoutes from './routes/userRoutes';
import systemRoutes from './routes/systemRoutes';
import actionRoutes from './routes/actionRoutes';
import screenshotRoutes from './routes/screenshotRoutes';
import roleRoutes from './routes/roleRoutes';
import taskRoutes from './routes/taskRoutes';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true // ADD THIS - Important for auth cookies
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', uploadRoutes);
app.use('/api', linksRoutes); 
app.use('/api', userRoutes);
app.use('/api', systemRoutes);
app.use('/api', actionRoutes);
app.use('/api', screenshotRoutes)
app.use('/api', roleRoutes);
app.use('/api', taskRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'TechLedger API is running',
    timestamp: new Date().toISOString()
  });
});

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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});