import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testVisionAPI } from './services/visionService';

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