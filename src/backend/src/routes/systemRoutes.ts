/**
 * System Routes
 * 
 * REST API endpoints for system management
 * Base path: /api/systems
 */

import express, { Request, Response } from 'express';
import * as queries from '../db/queries';
import { validateRequired, validatePositiveInteger } from '../utils/validation';
import { NotFoundError, ValidationError } from '../utils/errors';

const router = express.Router();

// ============================================================================
// SYSTEM ENDPOINTS
// ============================================================================

/**
 * GET /api/systems/:id
 * Get a single system by ID
 */
router.get('/systems/:id', async (req: Request, res: Response) => {
  try {
    const systemId = parseInt(req.params.id);

    if (isNaN(systemId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid system ID',
      });
    }

    const system = await queries.getSystemById(systemId);

    res.json({
      success: true,
      data: system,
    });
  } catch (error: any) {
    console.error(`GET /api/systems/${req.params.id} error:`, error);

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch system',
    });
  }
});

/**
 * GET /api/users/:userId/systems
 * Get all systems for a specific user
 * 
 * Query params:
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 * - orderBy: string (default: 'created_at')
 * - orderDirection: 'ASC' | 'DESC' (default: 'DESC')
 */
router.get('/users/:userId/systems', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID',
      });
    }

    const options = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      orderBy: req.query.orderBy as string | undefined,
      orderDirection: req.query.orderDirection as 'ASC' | 'DESC' | undefined,
    };

    const result = await queries.getSystemsByUserId(userId, options);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error(`GET /api/users/${req.params.userId}/systems error:`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch systems',
    });
  }
});

/**
 * POST /api/systems
 * Create a new system
 * 
 * Body:
 * - user_id: number (required)
 * - name: string (required)
 * - description: string (optional)
 */
router.post('/systems', async (req: Request, res: Response) => {
  try {
    const { user_id, name, description } = req.body;

    // Validate required fields
    validateRequired(['user_id', 'name'], req.body);

    // Validate user_id is a positive integer
    if (!validatePositiveInteger(user_id)) {
      return res.status(400).json({
        success: false,
        error: 'user_id must be a positive integer',
      });
    }

    // Verify user exists
    try {
      await queries.getUserById(user_id);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }
      throw error;
    }

    // Create system
    const system = await queries.createSystem({
      user_id,
      name,
      description,
    });

    res.status(201).json({
      success: true,
      data: system,
      message: 'System created successfully',
    });
  } catch (error: any) {
    console.error('POST /api/systems error:', error);

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create system',
    });
  }
});

/**
 * PUT /api/systems/:id
 * Update a system
 * 
 * Body:
 * - name: string (optional)
 * - description: string (optional)
 */
router.put('/systems/:id', async (req: Request, res: Response) => {
  try {
    const systemId = parseInt(req.params.id);

    if (isNaN(systemId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid system ID',
      });
    }

    const { name, description } = req.body;

    // Validate at least one field is provided
    if (name === undefined && description === undefined) {
      return res.status(400).json({
        success: false,
        error: 'At least one field (name or description) must be provided',
      });
    }

    // Update system
    const updatedSystem = await queries.updateSystem(systemId, {
      name,
      description,
    });

    res.json({
      success: true,
      data: updatedSystem,
      message: 'System updated successfully',
    });
  } catch (error: any) {
    console.error(`PUT /api/systems/${req.params.id} error:`, error);

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update system',
    });
  }
});

/**
 * DELETE /api/systems/:id
 * Delete a system (and all associated data via CASCADE)
 * 
 * WARNING: This will delete:
 * - The system
 * - All actions in the system
 * - All screenshots in those actions
 */
router.delete('/systems/:id', async (req: Request, res: Response) => {
  try {
    const systemId = parseInt(req.params.id);

    if (isNaN(systemId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid system ID',
      });
    }

    await queries.deleteSystem(systemId);

    res.json({
      success: true,
      message: 'System and all associated data deleted successfully',
    });
  } catch (error: any) {
    console.error(`DELETE /api/systems/${req.params.id} error:`, error);

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete system',
    });
  }
});

/**
 * GET /api/systems/:systemId/actions
 * Get all actions for a specific system
 * 
 * Query params:
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 * - orderBy: string (default: 'created_at')
 * - orderDirection: 'ASC' | 'DESC' (default: 'DESC')
 */
router.get('/systems/:systemId/actions', async (req: Request, res: Response) => {
  try {
    const systemId = parseInt(req.params.systemId);

    if (isNaN(systemId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid system ID',
      });
    }

    const options = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      orderBy: req.query.orderBy as string | undefined,
      orderDirection: req.query.orderDirection as 'ASC' | 'DESC' | undefined,
    };

    const result = await queries.getActionsBySystemId(systemId, options);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error(`GET /api/systems/${req.params.systemId}/actions error:`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch actions',
    });
  }
});

export default router;
