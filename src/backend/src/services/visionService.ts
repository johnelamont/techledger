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