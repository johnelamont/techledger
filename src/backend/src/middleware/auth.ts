import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';

// Middleware to require authentication
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'No authentication token provided' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token with Clerk
    const decoded = await clerkClient.verifyToken(token);
    
    // Attach user info to request
    req.auth = {
      userId: decoded.sub as string,
      sessionId: decoded.sid as string,
      claims: decoded,
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid or expired token' 
    });
  }
};

// Optional: Middleware to get auth if present (but don't require it)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = await clerkClient.verifyToken(token);
      
      req.auth = {
        userId: decoded.sub as string,
        sessionId: decoded.sid as string,
        claims: decoded,
      };
    }
  } catch (error) {
    // Ignore errors for optional auth
    console.log('Optional auth failed, continuing without auth');
  }
  
  next();
};
