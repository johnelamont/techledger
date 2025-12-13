import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';

// Middleware to require authentication
// Added detailed logging for debugging token validation
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('🔐 Auth middleware - checking authorization header...');
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Auth middleware - no Bearer token found');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('🔑 Auth middleware - token extracted, length:', token.length);

    // Verify token with Clerk
    console.log('🔍 Auth middleware - verifying token with Clerk...');
    const decoded = await clerkClient.verifyToken(token);
    console.log('✅ Auth middleware - token verified successfully:', decoded.sub);

    // Attach user info to request
    req.auth = {
      userId: decoded.sub as string,
      sessionId: decoded.sid as string,
      claims: decoded,
    };

    next();
  } catch (error: any) {
    console.error('❌ Auth middleware error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      name: error.name
    });
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
      details: error.message
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
