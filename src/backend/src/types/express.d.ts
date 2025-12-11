// Extend Express Request to include auth
declare namespace Express {
  interface Request {
    auth?: {
      userId: string;
      sessionId: string;
      claims?: any;
    };
  }
}
