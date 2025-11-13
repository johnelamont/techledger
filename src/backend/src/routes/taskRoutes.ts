/**
 * Task Routes
 * 
 * REST API endpoints for task management and action linking
 * Base path: /api/tasks
 */

import express, { Request, Response } from 'express';
import * as queries from '../db/queries';
import { validateRequired, validatePositiveInteger } from '../utils/validation';
import { NotFoundError, ValidationError } from '../utils/errors';

const router = express.Router();

// ============================================================================
// TASK CRUD ENDPOINTS
// ============================================================================

/**
 * GET /api/tasks
 * Get all tasks for a specific user
 * 
 * Query params:
 * - user_id: number (required)
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 * - orderBy: string (default: 'display_order')
 * - orderDirection: 'ASC' | 'DESC' (default: 'ASC')
 */
router.get('/tasks', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.query.user_id as string);

    if (isNaN(userId) || !validatePositiveInteger(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Valid user_id is required',
      });
    }

    const options = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      orderBy: req.query.orderBy as string | undefined,
      orderDirection: req.query.orderDirection as 'ASC' | 'DESC' | undefined,
    };

    const result = await queries.getTasksByUserId(userId, options);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('GET /api/tasks error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch tasks',
    });
  }
});

/**
 * POST /api/tasks
 * Create a new task
 * 
 * Body:
 * - user_id: number (required)
 * - name: string (required)
 * - description: string (optional)
 * - display_order: number (optional)
 */
router.post('/tasks', async (req: Request, res: Response) => {
  try {
    const { user_id, name, description, display_order } = req.body;

    // Validate required fields
    validateRequired(['user_id', 'name'], req.body);

    // Validate user_id
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

    // Create task
    const task = await queries.createTask({
      user_id,
      name,
      description,
      display_order,
    });

    res.status(201).json({
      success: true,
      data: task,
      message: 'Task created successfully',
    });
  } catch (error: any) {
    console.error('POST /api/tasks error:', error);

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create task',
    });
  }
});

/**
 * GET /api/tasks/:id
 * Get a single task by ID
 */
router.get('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);

    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid task ID',
      });
    }

    const task = await queries.getTaskById(taskId);

    res.json({
      success: true,
      data: task,
    });
  } catch (error: any) {
    console.error(`GET /api/tasks/${req.params.id} error:`, error);

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch task',
    });
  }
});

/**
 * PUT /api/tasks/:id
 * Update a task
 * 
 * Body:
 * - name: string (optional)
 * - description: string (optional)
 * - display_order: number (optional)
 */
router.put('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);

    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid task ID',
      });
    }

    const { name, description, display_order } = req.body;

    // Validate at least one field is provided
    if (name === undefined && description === undefined && display_order === undefined) {
      return res.status(400).json({
        success: false,
        error: 'At least one field (name, description, or display_order) must be provided',
      });
    }

    // Update task
    const updatedTask = await queries.updateTask(taskId, {
      name,
      description,
      display_order,
    });

    res.json({
      success: true,
      data: updatedTask,
      message: 'Task updated successfully',
    });
  } catch (error: any) {
    console.error(`PUT /api/tasks/${req.params.id} error:`, error);

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update task',
    });
  }
});

/**
 * DELETE /api/tasks/:id
 * Delete a task (and all associated role_tasks and task_actions via CASCADE)
 */
router.delete('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);

    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid task ID',
      });
    }

    await queries.deleteTask(taskId);

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error: any) {
    console.error(`DELETE /api/tasks/${req.params.id} error:`, error);

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete task',
    });
  }
});

// ============================================================================
// TASK-ACTION LINKING ENDPOINTS
// ============================================================================

/**
 * GET /api/tasks/:taskId/actions
 * Get all actions for a specific task (ordered)
 * 
 * Query params:
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 */
router.get('/tasks/:taskId/actions', async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.taskId);

    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid task ID',
      });
    }

    // Verify task exists
    try {
      await queries.getTaskById(taskId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          error: 'Task not found',
        });
      }
      throw error;
    }

    const options = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };

    const result = await queries.getActionsForTask(taskId, options);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error(`GET /api/tasks/${req.params.taskId}/actions error:`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch actions for task',
    });
  }
});

/**
 * POST /api/tasks/:taskId/actions
 * Link an action to a task
 * 
 * Body:
 * - action_id: number (required)
 * - display_order: number (optional, defaults to 0)
 * - notes: string (optional)
 */
router.post('/tasks/:taskId/actions', async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.taskId);
    const { action_id, display_order, notes } = req.body;

    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid task ID',
      });
    }

    // Validate required fields
    validateRequired(['action_id'], req.body);

    // Validate action_id
    if (!validatePositiveInteger(action_id)) {
      return res.status(400).json({
        success: false,
        error: 'action_id must be a positive integer',
      });
    }

    // Verify task and action exist
    try {
      await queries.getTaskById(taskId);
      await queries.getActionById(action_id);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      throw error;
    }

    // Link action to task
    const taskAction = await queries.linkActionToTask({
      task_id: taskId,
      action_id,
      display_order,
      notes,
    });

    res.status(201).json({
      success: true,
      data: taskAction,
      message: 'Action linked to task successfully',
    });
  } catch (error: any) {
    console.error(`POST /api/tasks/${req.params.taskId}/actions error:`, error);

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    // Check for unique constraint violation (action already linked to task)
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Action is already linked to this task',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to link action to task',
    });
  }
});

/**
 * DELETE /api/tasks/:taskId/actions/:actionId
 * Unlink an action from a task
 */
router.delete('/tasks/:taskId/actions/:actionId', async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.taskId);
    const actionId = parseInt(req.params.actionId);

    if (isNaN(taskId) || isNaN(actionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid task ID or action ID',
      });
    }

    await queries.unlinkActionFromTask(taskId, actionId);

    res.json({
      success: true,
      message: 'Action unlinked from task successfully',
    });
  } catch (error: any) {
    console.error(`DELETE /api/tasks/${req.params.taskId}/actions/${req.params.actionId} error:`, error);

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: 'Link not found',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to unlink action from task',
    });
  }
});

/**
 * PUT /api/tasks/:taskId/actions/:actionId/order
 * Update the display order and/or notes of an action within a task
 * 
 * Body:
 * - display_order: number (optional)
 * - notes: string (optional)
 */
router.put('/tasks/:taskId/actions/:actionId/order', async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.taskId);
    const actionId = parseInt(req.params.actionId);
    const { display_order, notes } = req.body;

    if (isNaN(taskId) || isNaN(actionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid task ID or action ID',
      });
    }

    // Validate at least one field is provided
    if (display_order === undefined && notes === undefined) {
      return res.status(400).json({
        success: false,
        error: 'At least one field (display_order or notes) must be provided',
      });
    }

    // Validate display_order if provided
    if (display_order !== undefined && (typeof display_order !== 'number' || display_order < 0)) {
      return res.status(400).json({
        success: false,
        error: 'display_order must be a non-negative number',
      });
    }

    const taskAction = await queries.reorderActionInTask(taskId, actionId, {
      display_order,
      notes,
    });

    res.json({
      success: true,
      data: taskAction,
      message: 'Action updated successfully',
    });
  } catch (error: any) {
    console.error(`PUT /api/tasks/${req.params.taskId}/actions/${req.params.actionId}/order error:`, error);

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: 'Link not found',
      });
    }

    if (error instanceof ValidationError) {
      return res.status(400).json({
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

export default router;
