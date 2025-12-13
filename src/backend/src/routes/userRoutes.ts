/**
 * User Routes
 * 
 * REST API endpoints for user management
 * Base path: /api/users
 */

import express, { Request, Response } from 'express';
import * as queries from '../db/queries';
import { validateEmail, validateRequired } from '../utils/validation';
import { NotFoundError, ValidationError } from '../utils/errors';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// ============================================================================
// USER ENDPOINTS
// ============================================================================

/**
 * GET /api/users
 * Get all users with pagination
 * 
 * Query params:
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 * - orderBy: string (default: 'created_at')
 * - orderDirection: 'ASC' | 'DESC' (default: 'DESC')
 */
router.get('/users', requireAuth, async (req: Request, res: Response) => {
  try {
    const options = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      orderBy: req.query.orderBy as string | undefined,
      orderDirection: req.query.orderDirection as 'ASC' | 'DESC' | undefined,
    };

    const result = await queries.getUsers(options);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('GET /api/users error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch users',
    });
  }
});

/**
 * GET /api/users/me
 * Get current authenticated user profile
 * This automatically creates a database user record on first login
 * This must come BEFORE /users/:id to avoid route collision
 */
router.get('/users/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.auth?.userId;

    if (!clerkUserId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    // Fetch user data from Clerk to get email and name
    const { clerkClient } = await import('@clerk/clerk-sdk-node');
    const clerkUser = await clerkClient.users.getUser(clerkUserId);

    // Get or create user in our database
    const user = await queries.getOrCreateUserFromClerk(
      clerkUserId,
      clerkUser.emailAddresses[0]?.emailAddress || null,
      clerkUser.firstName && clerkUser.lastName
        ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
        : clerkUser.firstName || clerkUser.lastName || clerkUser.username || 'User'
    );

    res.json({
      success: true,
      data: {
        ...user,
        clerkUserId,
        sessionId: req.auth?.sessionId,
      },
    });
  } catch (error: any) {
    console.error('GET /api/users/me error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch current user',
    });
  }
});

/**
 * GET /api/users/:id
 * Get a single user by ID
 */
router.get('/users/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID',
      });
    }

    const user = await queries.getUserById(userId);

    res.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error(`GET /api/users/${req.params.id} error:`, error);

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch user',
    });
  }
});

/**
 * GET /api/users/email/:email
 * Get a user by email address
 */
router.get('/users/email/:email', requireAuth, async (req: Request, res: Response) => {
  try {
    const email = req.params.email;

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
    }

    const user = await queries.getUserByEmail(email);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error(`GET /api/users/email/${req.params.email} error:`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch user',
    });
  }
});

/**
 * POST /api/users
 * Create a new user
 * 
 * Body:
 * - email: string (required)
 * - name: string (required)
 */
router.post('/users', async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;

    // Validate required fields
    validateRequired(['email', 'name'], req.body);

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
    }

    // Check if user with email already exists
    const existingUser = await queries.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists',
      });
    }

    // Create user
    const user = await queries.createUser({ email, name });

    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully',
    });
  } catch (error: any) {
    console.error('POST /api/users error:', error);

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create user',
    });
  }
});

/**
 * PUT /api/users/:id
 * Update a user
 * 
 * Body:
 * - email: string (optional)
 * - name: string (optional)
 */
router.put('/users/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID',
      });
    }

    const { email, name } = req.body;

    // Validate at least one field is provided
    if (!email && !name) {
      return res.status(400).json({
        success: false,
        error: 'At least one field (email or name) must be provided',
      });
    }

    // Validate email format if provided
    if (email && !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
    }

    // Check if new email is already taken by another user
    if (email) {
      const existingUser = await queries.getUserByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({
          success: false,
          error: 'Email already in use by another user',
        });
      }
    }

    // Update user
    const updatedUser = await queries.updateUser(userId, { email, name });

    res.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    });
  } catch (error: any) {
    console.error(`PUT /api/users/${req.params.id} error:`, error);

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update user',
    });
  }
});

/**
 * DELETE /api/users/:id
 * Delete a user (and all associated data via CASCADE)
 */
router.delete('/users/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID',
      });
    }

    await queries.deleteUser(userId);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    console.error(`DELETE /api/users/${req.params.id} error:`, error);

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete user',
    });
  }
});

export default router;
