/**
 * Action Routes
 * 
 * REST API endpoints for action management
 * Base path: /api/actions
 */

import express, { Request, Response } from 'express';
import * as queries from '../db/queries';
import { validateRequired, validatePositiveInteger } from '../utils/validation';
import { NotFoundError, ValidationError } from '../utils/errors';

const router = express.Router();

// ============================================================================
// ACTION ENDPOINTS
// ============================================================================

/**
 * GET /api/actions/:id
 * Get a single action by ID
 */
router.get('/actions/:id', async (req: Request, res: Response) => {
  try {
    const actionId = parseInt(req.params.id);

    if (isNaN(actionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action ID',
      });
    }

    const action = await queries.getActionById(actionId);

    res.json({
      success: true,
      data: action,
    });
  } catch (error: any) {
    console.error(`GET /api/actions/${req.params.id} error:`, error);

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch action',
    });
  }
});

/**
 * GET /api/actions/:id/with-system
 * Get an action with its system information (JOIN query)
 */
router.get('/actions/:id/with-system', async (req: Request, res: Response) => {
  try {
    const actionId = parseInt(req.params.id);

    if (isNaN(actionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action ID',
      });
    }

    const actionWithSystem = await queries.getActionWithSystem(actionId);

    res.json({
      success: true,
      data: actionWithSystem,
    });
  } catch (error: any) {
    console.error(`GET /api/actions/${req.params.id}/with-system error:`, error);

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch action with system',
    });
  }
});

/**
 * POST /api/actions
 * Create a new action
 * 
 * Body:
 * - system_id: number (required for now, optional in schema v2)
 * - practice_group_id: number (optional, for schema v2)
 * - title: string (required)
 * - description: string (optional)
 * - steps: ActionStep[] (optional JSONB)
 * - screenshots: ActionScreenshotRef[] (optional JSONB)
 * - display_order: number (optional)
 */
router.post('/actions', async (req: Request, res: Response) => {
  try {
    const {
      system_id,
      practice_group_id,
      title,
      description,
      steps,
      screenshots,
      display_order,
    } = req.body;

    // Validate required fields
    validateRequired(['title'], req.body);

    // Must have at least one parent (system_id or practice_group_id)
    if (!system_id && !practice_group_id) {
      return res.status(400).json({
        success: false,
        error: 'Either system_id or practice_group_id must be provided',
      });
    }

    // Validate IDs if provided
    if (system_id && !validatePositiveInteger(system_id)) {
      return res.status(400).json({
        success: false,
        error: 'system_id must be a positive integer',
      });
    }

    if (practice_group_id && !validatePositiveInteger(practice_group_id)) {
      return res.status(400).json({
        success: false,
        error: 'practice_group_id must be a positive integer',
      });
    }

    // Verify system exists if provided
    if (system_id) {
      try {
        await queries.getSystemById(system_id);
      } catch (error) {
        if (error instanceof NotFoundError) {
          return res.status(404).json({
            success: false,
            error: 'System not found',
          });
        }
        throw error;
      }
    }

    // Validate steps format if provided
    if (steps && !Array.isArray(steps)) {
      return res.status(400).json({
        success: false,
        error: 'steps must be an array',
      });
    }

    // Validate screenshots format if provided
    if (screenshots && !Array.isArray(screenshots)) {
      return res.status(400).json({
        success: false,
        error: 'screenshots must be an array',
      });
    }

    // Create action
    const action = await queries.createAction({
      system_id,
      practice_group_id,
      title,
      description,
      steps,
      screenshots,
      display_order,
    });

    res.status(201).json({
      success: true,
      data: action,
      message: 'Action created successfully',
    });
  } catch (error: any) {
    console.error('POST /api/actions error:', error);

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create action',
    });
  }
});

/**
 * PUT /api/actions/:id
 * Update an action
 * 
 * Body:
 * - title: string (optional)
 * - description: string (optional)
 * - steps: ActionStep[] (optional)
 * - screenshots: ActionScreenshotRef[] (optional)
 * - display_order: number (optional)
 */
router.put('/actions/:id', async (req: Request, res: Response) => {
  try {
    const actionId = parseInt(req.params.id);

    if (isNaN(actionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action ID',
      });
    }

    const { title, description, steps, screenshots, display_order } = req.body;

    // Validate at least one field is provided
    if (
      title === undefined &&
      description === undefined &&
      steps === undefined &&
      screenshots === undefined &&
      display_order === undefined
    ) {
      return res.status(400).json({
        success: false,
        error: 'At least one field must be provided for update',
      });
    }

    // Validate steps format if provided
    if (steps !== undefined && steps !== null && !Array.isArray(steps)) {
      return res.status(400).json({
        success: false,
        error: 'steps must be an array or null',
      });
    }

    // Validate screenshots format if provided
    if (screenshots !== undefined && screenshots !== null && !Array.isArray(screenshots)) {
      return res.status(400).json({
        success: false,
        error: 'screenshots must be an array or null',
      });
    }

    // Update action
    const updatedAction = await queries.updateAction(actionId, {
      title,
      description,
      steps,
      screenshots,
      display_order,
    });

    res.json({
      success: true,
      data: updatedAction,
      message: 'Action updated successfully',
    });
  } catch (error: any) {
    console.error(`PUT /api/actions/${req.params.id} error:`, error);

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update action',
    });
  }
});

/**
 * DELETE /api/actions/:id
 * Delete an action (and all associated screenshots via CASCADE)
 */
router.delete('/actions/:id', async (req: Request, res: Response) => {
  try {
    const actionId = parseInt(req.params.id);

    if (isNaN(actionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action ID',
      });
    }

    await queries.deleteAction(actionId);

    res.json({
      success: true,
      message: 'Action and all associated screenshots deleted successfully',
    });
  } catch (error: any) {
    console.error(`DELETE /api/actions/${req.params.id} error:`, error);

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete action',
    });
  }
});

/**
 * GET /api/actions/:actionId/screenshots
 * Get all screenshots for a specific action
 * 
 * Query params:
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 * - orderBy: string (default: 'uploaded_at')
 * - orderDirection: 'ASC' | 'DESC' (default: 'DESC')
 */
router.get('/actions/:actionId/screenshots', async (req: Request, res: Response) => {
  try {
    const actionId = parseInt(req.params.actionId);

    if (isNaN(actionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action ID',
      });
    }

    const options = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      orderBy: req.query.orderBy as string | undefined,
      orderDirection: req.query.orderDirection as 'ASC' | 'DESC' | undefined,
    };

    const result = await queries.getScreenshotsByActionId(actionId, options);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error(`GET /api/actions/${req.params.actionId}/screenshots error:`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch screenshots',
    });
  }
});

export default router;
