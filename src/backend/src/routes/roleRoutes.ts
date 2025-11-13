/**
 * Role Routes
 * 
 * REST API endpoints for role management and task linking
 * Base path: /api/roles
 */

import express, { Request, Response } from 'express';
import * as queries from '../db/queries';
import { validateRequired, validatePositiveInteger } from '../utils/validation';
import { NotFoundError, ValidationError } from '../utils/errors';

const router = express.Router();

// ============================================================================
// ROLE CRUD ENDPOINTS
// ============================================================================

/**
 * GET /api/roles
 * Get all roles for a specific user
 * 
 * Query params:
 * - user_id: number (required)
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 * - orderBy: string (default: 'display_order')
 * - orderDirection: 'ASC' | 'DESC' (default: 'ASC')
 */
router.get('/roles', async (req: Request, res: Response) => {
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

    const result = await queries.getRolesByUserId(userId, options);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('GET /api/roles error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch roles',
    });
  }
});

/**
 * POST /api/roles
 * Create a new role
 * 
 * Body:
 * - user_id: number (required)
 * - name: string (required)
 * - description: string (optional)
 * - display_order: number (optional)
 */
router.post('/roles', async (req: Request, res: Response) => {
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

    // Create role
    const role = await queries.createRole({
      user_id,
      name,
      description,
      display_order,
    });

    res.status(201).json({
      success: true,
      data: role,
      message: 'Role created successfully',
    });
  } catch (error: any) {
    console.error('POST /api/roles error:', error);

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create role',
    });
  }
});

/**
 * GET /api/roles/:id
 * Get a single role by ID
 */
router.get('/roles/:id', async (req: Request, res: Response) => {
  try {
    const roleId = parseInt(req.params.id);

    if (isNaN(roleId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role ID',
      });
    }

    const role = await queries.getRoleById(roleId);

    res.json({
      success: true,
      data: role,
    });
  } catch (error: any) {
    console.error(`GET /api/roles/${req.params.id} error:`, error);

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch role',
    });
  }
});

/**
 * PUT /api/roles/:id
 * Update a role
 * 
 * Body:
 * - name: string (optional)
 * - description: string (optional)
 * - display_order: number (optional)
 */
router.put('/roles/:id', async (req: Request, res: Response) => {
  try {
    const roleId = parseInt(req.params.id);

    if (isNaN(roleId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role ID',
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

    // Update role
    const updatedRole = await queries.updateRole(roleId, {
      name,
      description,
      display_order,
    });

    res.json({
      success: true,
      data: updatedRole,
      message: 'Role updated successfully',
    });
  } catch (error: any) {
    console.error(`PUT /api/roles/${req.params.id} error:`, error);

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update role',
    });
  }
});

/**
 * DELETE /api/roles/:id
 * Delete a role (and all associated role_tasks via CASCADE)
 */
router.delete('/roles/:id', async (req: Request, res: Response) => {
  try {
    const roleId = parseInt(req.params.id);

    if (isNaN(roleId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role ID',
      });
    }

    await queries.deleteRole(roleId);

    res.json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error: any) {
    console.error(`DELETE /api/roles/${req.params.id} error:`, error);

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete role',
    });
  }
});

// ============================================================================
// ROLE-TASK LINKING ENDPOINTS
// ============================================================================

/**
 * GET /api/roles/:roleId/tasks
 * Get all tasks for a specific role (ordered)
 * 
 * Query params:
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 */
router.get('/roles/:roleId/tasks', async (req: Request, res: Response) => {
  try {
    const roleId = parseInt(req.params.roleId);

    if (isNaN(roleId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role ID',
      });
    }

    // Verify role exists
    try {
      await queries.getRoleById(roleId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          error: 'Role not found',
        });
      }
      throw error;
    }

    const options = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };

    const result = await queries.getTasksForRole(roleId, options);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error(`GET /api/roles/${req.params.roleId}/tasks error:`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch tasks for role',
    });
  }
});

/**
 * POST /api/roles/:roleId/tasks
 * Link a task to a role
 * 
 * Body:
 * - task_id: number (required)
 * - display_order: number (optional, defaults to 0)
 */
router.post('/roles/:roleId/tasks', async (req: Request, res: Response) => {
  try {
    const roleId = parseInt(req.params.roleId);
    const { task_id, display_order } = req.body;

    if (isNaN(roleId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role ID',
      });
    }

    // Validate required fields
    validateRequired(['task_id'], req.body);

    // Validate task_id
    if (!validatePositiveInteger(task_id)) {
      return res.status(400).json({
        success: false,
        error: 'task_id must be a positive integer',
      });
    }

    // Verify role and task exist
    try {
      await queries.getRoleById(roleId);
      await queries.getTaskById(task_id);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      throw error;
    }

    // Link task to role
    const roleTask = await queries.linkTaskToRole({
      role_id: roleId,
      task_id,
      display_order,
    });

    res.status(201).json({
      success: true,
      data: roleTask,
      message: 'Task linked to role successfully',
    });
  } catch (error: any) {
    console.error(`POST /api/roles/${req.params.roleId}/tasks error:`, error);

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    // Check for unique constraint violation (task already linked to role)
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Task is already linked to this role',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to link task to role',
    });
  }
});

/**
 * DELETE /api/roles/:roleId/tasks/:taskId
 * Unlink a task from a role
 */
router.delete('/roles/:roleId/tasks/:taskId', async (req: Request, res: Response) => {
  try {
    const roleId = parseInt(req.params.roleId);
    const taskId = parseInt(req.params.taskId);

    if (isNaN(roleId) || isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role ID or task ID',
      });
    }

    await queries.unlinkTaskFromRole(roleId, taskId);

    res.json({
      success: true,
      message: 'Task unlinked from role successfully',
    });
  } catch (error: any) {
    console.error(`DELETE /api/roles/${req.params.roleId}/tasks/${req.params.taskId} error:`, error);

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: 'Link not found',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to unlink task from role',
    });
  }
});

/**
 * PUT /api/roles/:roleId/tasks/:taskId/order
 * Update the display order of a task within a role
 * 
 * Body:
 * - display_order: number (required)
 */
router.put('/roles/:roleId/tasks/:taskId/order', async (req: Request, res: Response) => {
  try {
    const roleId = parseInt(req.params.roleId);
    const taskId = parseInt(req.params.taskId);
    const { display_order } = req.body;

    if (isNaN(roleId) || isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role ID or task ID',
      });
    }

    // Validate required field
    validateRequired(['display_order'], req.body);

    // Validate display_order is a number
    if (typeof display_order !== 'number' || display_order < 0) {
      return res.status(400).json({
        success: false,
        error: 'display_order must be a non-negative number',
      });
    }

    const roleTask = await queries.reorderTaskInRole(roleId, taskId, display_order);

    res.json({
      success: true,
      data: roleTask,
      message: 'Task order updated successfully',
    });
  } catch (error: any) {
    console.error(`PUT /api/roles/${req.params.roleId}/tasks/${req.params.taskId}/order error:`, error);

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
      error: error.message || 'Failed to update task order',
    });
  }
});

export default router;
