/**
 * TechLedger Database Queries
 * 
 * EXPLANATION FOR NODE.JS NEWCOMERS:
 * - These functions interact with PostgreSQL using the 'pg' library
 * - All functions are async (they return Promises)
 * - Use await when calling them: const user = await createUser(...)
 * - Parameterized queries ($1, $2) prevent SQL injection
 * - JSONB columns are automatically parsed by pg library
 */

import pool from '../db/connection';
import {
  User,
  CreateUserInput,
  UpdateUserInput,
  System,
  CreateSystemInput,
  UpdateSystemInput,
  Action,
  CreateActionInput,
  UpdateActionInput,
  Screenshot,
  CreateScreenshotInput,
  UpdateScreenshotInput,
  QueryOptions,
  PaginatedResult,
  Role,
  CreateRoleInput,
  UpdateRoleInput,
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  RoleTask,
  CreateRoleTaskInput,
  TaskAction,
  CreateTaskActionInput,
  UpdateTaskActionInput,
} from '../types/models';

import {
  NotFoundError,
  ValidationError,
  handleDatabaseError,
  assertExists,
  safeJSONParse,
} from '../utils/errors';

// ============================================================================
// USER QUERIES
// ============================================================================

/**
 * Create a new user
 * @returns The created user with id and timestamps
 */
export async function createUser(input: CreateUserInput): Promise<User> {
  const query = `
    INSERT INTO users (email, name)
    VALUES ($1, $2)
    RETURNING *
  `;

  try {
    const result = await pool.query(query, [input.email, input.name]);
    return result.rows[0];
  } catch (error) {
    handleDatabaseError(error, 'User creation');
  }
}

/**
 * Get user by ID
 * @throws NotFoundError if user doesn't exist
 */
export async function getUserById(id: number): Promise<User> {
  const query = 'SELECT * FROM users WHERE id = $1';

  try {
    const result = await pool.query(query, [id]);
    assertExists(result.rows[0], 'User', id);
    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error, 'Get user by ID');
  }
}

/**
 * Get user by email
 * @returns User or null if not found
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const query = 'SELECT * FROM users WHERE email = $1';

  try {
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  } catch (error) {
    handleDatabaseError(error, 'Get user by email');
  }
}

/**
 * Get all users with pagination
 */
export async function getUsers(
  options: QueryOptions = {}
): Promise<PaginatedResult<User>> {
  const limit = options.limit || 50;
  const offset = options.offset || 0;
  const orderBy = options.orderBy || 'created_at';
  const orderDirection = options.orderDirection || 'DESC';

  const countQuery = 'SELECT COUNT(*) FROM users';
  const dataQuery = `
    SELECT * FROM users
    ORDER BY ${orderBy} ${orderDirection}
    LIMIT $1 OFFSET $2
  `;

  try {
    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery),
      pool.query(dataQuery, [limit, offset]),
    ]);

    return {
      data: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset,
    };
  } catch (error) {
    handleDatabaseError(error, 'Get users');
  }
}

/**
 * Update user by ID
 * @returns Updated user
 * @throws NotFoundError if user doesn't exist
 */
export async function updateUser(
  id: number,
  input: UpdateUserInput
): Promise<User> {
  // Build dynamic SET clause based on provided fields
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (input.email !== undefined) {
    updates.push(`email = $${paramCount++}`);
    values.push(input.email);
  }

  if (input.name !== undefined) {
    updates.push(`name = $${paramCount++}`);
    values.push(input.name);
  }

  // Always update the updated_at timestamp
  updates.push(`updated_at = CURRENT_TIMESTAMP`);

  const query = `
    UPDATE users
    SET ${updates.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `;
  values.push(id);

  try {
    const result = await pool.query(query, values);
    assertExists(result.rows[0], 'User', id);
    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error, 'Update user');
  }
}

/**
 * Delete user by ID
 * @returns true if deleted, throws if not found
 * @throws NotFoundError if user doesn't exist
 */
export async function deleteUser(id: number): Promise<boolean> {
  const query = 'DELETE FROM users WHERE id = $1 RETURNING id';

  try {
    const result = await pool.query(query, [id]);
    assertExists(result.rows[0], 'User', id);
    return true;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error, 'Delete user');
  }
}

// ============================================================================
// SYSTEM QUERIES
// ============================================================================

/**
 * Create a new system
 */
export async function createSystem(input: CreateSystemInput): Promise<System> {
  const query = `
    INSERT INTO systems (user_id, name, description)
    VALUES ($1, $2, $3)
    RETURNING *
  `;

  try {
    const result = await pool.query(query, [
      input.user_id,
      input.name,
      input.description || null,
    ]);
    return result.rows[0];
  } catch (error) {
    handleDatabaseError(error, 'System creation');
  }
}

/**
 * Get system by ID
 */
export async function getSystemById(id: number): Promise<System> {
  const query = 'SELECT * FROM systems WHERE id = $1';

  try {
    const result = await pool.query(query, [id]);
    assertExists(result.rows[0], 'System', id);
    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error, 'Get system by ID');
  }
}

/**
 * Get all systems for a user
 */
export async function getSystemsByUserId(
  userId: number,
  options: QueryOptions = {}
): Promise<PaginatedResult<System>> {
  const limit = options.limit || 50;
  const offset = options.offset || 0;
  const orderBy = options.orderBy || 'created_at';
  const orderDirection = options.orderDirection || 'DESC';

  const countQuery = 'SELECT COUNT(*) FROM systems WHERE user_id = $1';
  const dataQuery = `
    SELECT * FROM systems
    WHERE user_id = $1
    ORDER BY ${orderBy} ${orderDirection}
    LIMIT $2 OFFSET $3
  `;

  try {
    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, [userId]),
      pool.query(dataQuery, [userId, limit, offset]),
    ]);

    return {
      data: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset,
    };
  } catch (error) {
    handleDatabaseError(error, 'Get systems by user');
  }
}

/**
 * Update system by ID
 */
export async function updateSystem(
  id: number,
  input: UpdateSystemInput
): Promise<System> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (input.name !== undefined) {
    updates.push(`name = $${paramCount++}`);
    values.push(input.name);
  }

  if (input.description !== undefined) {
    updates.push(`description = $${paramCount++}`);
    values.push(input.description);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);

  const query = `
    UPDATE systems
    SET ${updates.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `;
  values.push(id);

  try {
    const result = await pool.query(query, values);
    assertExists(result.rows[0], 'System', id);
    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error, 'Update system');
  }
}

/**
 * Delete system by ID
 * NOTE: This will cascade delete all associated actions and screenshots
 */
export async function deleteSystem(id: number): Promise<boolean> {
  const query = 'DELETE FROM systems WHERE id = $1 RETURNING id';

  try {
    const result = await pool.query(query, [id]);
    assertExists(result.rows[0], 'System', id);
    return true;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error, 'Delete system');
  }
}

// ============================================================================
// ACTION QUERIES
// ============================================================================

/**
 * Create a new action
 * NOTE: JSONB fields are automatically serialized by pg library
 * NOTE: Must have either system_id OR practice_group_id
 */
export async function createAction(input: CreateActionInput): Promise<Action> {
  const query = `
    INSERT INTO actions (system_id, practice_group_id, title, description, steps, screenshots, display_order)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;

  try {
    const result = await pool.query(query, [
      input.system_id || null,
      input.practice_group_id || null,
      input.title,
      input.description || null,
      JSON.stringify(input.steps || null),
      JSON.stringify(input.screenshots || null),
      input.display_order || 0,
    ]);
    
    const action = result.rows[0];
    // Parse JSONB fields
    action.steps = safeJSONParse(action.steps);
    action.screenshots = safeJSONParse(action.screenshots);
    
    return action;
  } catch (error) {
    handleDatabaseError(error, 'Action creation');
  }
}

/**
 * Get action by ID
 */
export async function getActionById(id: number): Promise<Action> {
  const query = 'SELECT * FROM actions WHERE id = $1';

  try {
    const result = await pool.query(query, [id]);
    assertExists(result.rows[0], 'Action', id);
    
    const action = result.rows[0];
    // Parse JSONB fields
    action.steps = safeJSONParse(action.steps);
    action.screenshots = safeJSONParse(action.screenshots);
    
    return action;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error, 'Get action by ID');
  }
}

/**
 * Get all actions for a system
 */
export async function getActionsBySystemId(
  systemId: number,
  options: QueryOptions = {}
): Promise<PaginatedResult<Action>> {
  const limit = options.limit || 50;
  const offset = options.offset || 0;
  const orderBy = options.orderBy || 'created_at';
  const orderDirection = options.orderDirection || 'DESC';

  const countQuery = 'SELECT COUNT(*) FROM actions WHERE system_id = $1';
  const dataQuery = `
    SELECT * FROM actions
    WHERE system_id = $1
    ORDER BY ${orderBy} ${orderDirection}
    LIMIT $2 OFFSET $3
  `;

  try {
    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, [systemId]),
      pool.query(dataQuery, [systemId, limit, offset]),
    ]);

    // Parse JSONB fields for all actions
    const actions = dataResult.rows.map((action:any) => ({
      ...action,
      steps: safeJSONParse(action.steps),
      screenshots: safeJSONParse(action.screenshots),
    }));

    return {
      data: actions,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset,
    };
  } catch (error) {
    handleDatabaseError(error, 'Get actions by system');
  }
}

/**
 * Update action by ID
 */
export async function updateAction(
  id: number,
  input: UpdateActionInput
): Promise<Action> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (input.title !== undefined) {
    updates.push(`title = $${paramCount++}`);
    values.push(input.title);
  }

  if (input.description !== undefined) {
    updates.push(`description = $${paramCount++}`);
    values.push(input.description);
  }

  if (input.steps !== undefined) {
    updates.push(`steps = $${paramCount++}`);
    values.push(JSON.stringify(input.steps));
  }

  if (input.screenshots !== undefined) {
    updates.push(`screenshots = $${paramCount++}`);
    values.push(JSON.stringify(input.screenshots));
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);

  const query = `
    UPDATE actions
    SET ${updates.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `;
  values.push(id);

  try {
    const result = await pool.query(query, values);
    assertExists(result.rows[0], 'Action', id);
    
    const action = result.rows[0];
    // Parse JSONB fields
    action.steps = safeJSONParse(action.steps);
    action.screenshots = safeJSONParse(action.screenshots);
    
    return action;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error, 'Update action');
  }
}

/**
 * Delete action by ID
 * NOTE: This will cascade delete all associated screenshots
 */
export async function deleteAction(id: number): Promise<boolean> {
  const query = 'DELETE FROM actions WHERE id = $1 RETURNING id';

  try {
    const result = await pool.query(query, [id]);
    assertExists(result.rows[0], 'Action', id);
    return true;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error, 'Delete action');
  }
}

// ============================================================================
// SCREENSHOT QUERIES
// ============================================================================

/**
 * Create a new screenshot
 */
export async function createScreenshot(
  input: CreateScreenshotInput
): Promise<Screenshot> {
  const query = `
    INSERT INTO screenshots (action_id, file_path, original_filename, ocr_data, vision_data)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  try {
    const result = await pool.query(query, [
      input.action_id,
      input.file_path,
      input.original_filename || null,
      JSON.stringify(input.ocr_data || null),
      JSON.stringify(input.vision_data || null),
    ]);
    
    const screenshot = result.rows[0];
    // Parse JSONB fields
    screenshot.ocr_data = safeJSONParse(screenshot.ocr_data);
    screenshot.vision_data = safeJSONParse(screenshot.vision_data);
    
    return screenshot;
  } catch (error) {
    handleDatabaseError(error, 'Screenshot creation');
  }
}

/**
 * Get screenshot by ID
 */
export async function getScreenshotById(id: number): Promise<Screenshot> {
  const query = 'SELECT * FROM screenshots WHERE id = $1';

  try {
    const result = await pool.query(query, [id]);
    assertExists(result.rows[0], 'Screenshot', id);
    
    const screenshot = result.rows[0];
    // Parse JSONB fields
    screenshot.ocr_data = safeJSONParse(screenshot.ocr_data);
    screenshot.vision_data = safeJSONParse(screenshot.vision_data);
    
    return screenshot;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error, 'Get screenshot by ID');
  }
}

/**
 * Get all screenshots for an action
 */
export async function getScreenshotsByActionId(
  actionId: number,
  options: QueryOptions = {}
): Promise<PaginatedResult<Screenshot>> {
  const limit = options.limit || 50;
  const offset = options.offset || 0;
  const orderBy = options.orderBy || 'uploaded_at';
  const orderDirection = options.orderDirection || 'DESC';

  const countQuery = 'SELECT COUNT(*) FROM screenshots WHERE action_id = $1';
  const dataQuery = `
    SELECT * FROM screenshots
    WHERE action_id = $1
    ORDER BY ${orderBy} ${orderDirection}
    LIMIT $2 OFFSET $3
  `;

  try {
    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, [actionId]),
      pool.query(dataQuery, [actionId, limit, offset]),
    ]);

    // Parse JSONB fields for all screenshots
    const screenshots = dataResult.rows.map((screenshot:any) => ({
      ...screenshot,
      ocr_data: safeJSONParse(screenshot.ocr_data),
      vision_data: safeJSONParse(screenshot.vision_data),
    }));

    return {
      data: screenshots,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset,
    };
  } catch (error) {
    handleDatabaseError(error, 'Get screenshots by action');
  }
}

/**
 * Update screenshot by ID
 * Typically used to add OCR/Vision data after initial upload
 */
export async function updateScreenshot(
  id: number,
  input: UpdateScreenshotInput
): Promise<Screenshot> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (input.ocr_data !== undefined) {
    updates.push(`ocr_data = $${paramCount++}`);
    values.push(JSON.stringify(input.ocr_data));
  }

  if (input.vision_data !== undefined) {
    updates.push(`vision_data = $${paramCount++}`);
    values.push(JSON.stringify(input.vision_data));
  }

  const query = `
    UPDATE screenshots
    SET ${updates.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `;
  values.push(id);

  try {
    const result = await pool.query(query, values);
    assertExists(result.rows[0], 'Screenshot', id);
    
    const screenshot = result.rows[0];
    // Parse JSONB fields
    screenshot.ocr_data = safeJSONParse(screenshot.ocr_data);
    screenshot.vision_data = safeJSONParse(screenshot.vision_data);
    
    return screenshot;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error, 'Update screenshot');
  }
}

/**
 * Delete screenshot by ID
 */
export async function deleteScreenshot(id: number): Promise<boolean> {
  const query = 'DELETE FROM screenshots WHERE id = $1 RETURNING id';

  try {
    const result = await pool.query(query, [id]);
    assertExists(result.rows[0], 'Screenshot', id);
    return true;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error, 'Delete screenshot');
  }
}

// ============================================================================
// ROLE QUERIES
// ============================================================================

/**
 * Create a new role
 */
export async function createRole(input: CreateRoleInput): Promise<Role> {
  const query = `
    INSERT INTO roles (user_id, name, description, display_order)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  try {
    const result = await pool.query(query, [
      input.user_id,
      input.name,
      input.description || null,
      input.display_order || 0,
    ]);
    return result.rows[0];
  } catch (error) {
    handleDatabaseError(error, 'Role creation');
  }
}

/**
 * Get role by ID
 */
export async function getRoleById(id: number): Promise<Role> {
  const query = 'SELECT * FROM roles WHERE id = $1';

  try {
    const result = await pool.query(query, [id]);
    assertExists(result.rows[0], 'Role', id);
    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error, 'Get role by ID');
  }
}

/**
 * Get all roles for a user
 */
export async function getRolesByUserId(
  userId: number,
  options: QueryOptions = {}
): Promise<PaginatedResult<Role>> {
  const limit = options.limit || 50;
  const offset = options.offset || 0;
  const orderBy = options.orderBy || 'display_order';
  const orderDirection = options.orderDirection || 'ASC';

  const countQuery = 'SELECT COUNT(*) FROM roles WHERE user_id = $1';
  const dataQuery = `
    SELECT * FROM roles
    WHERE user_id = $1
    ORDER BY ${orderBy} ${orderDirection}
    LIMIT $2 OFFSET $3
  `;

  try {
    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, [userId]),
      pool.query(dataQuery, [userId, limit, offset]),
    ]);

    return {
      data: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset,
    };
  } catch (error) {
    handleDatabaseError(error, 'Get roles by user');
  }
}

/**
 * Update role by ID
 */
export async function updateRole(
  id: number,
  input: UpdateRoleInput
): Promise<Role> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (input.name !== undefined) {
    updates.push(`name = $${paramCount++}`);
    values.push(input.name);
  }

  if (input.description !== undefined) {
    updates.push(`description = $${paramCount++}`);
    values.push(input.description);
  }

  if (input.display_order !== undefined) {
    updates.push(`display_order = $${paramCount++}`);
    values.push(input.display_order);
  }

  const query = `
    UPDATE roles
    SET ${updates.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `;
  values.push(id);

  try {
    const result = await pool.query(query, values);
    assertExists(result.rows[0], 'Role', id);
    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error, 'Update role');
  }
}

/**
 * Delete role by ID
 * NOTE: This will cascade delete all role_tasks entries
 */
export async function deleteRole(id: number): Promise<boolean> {
  const query = 'DELETE FROM roles WHERE id = $1 RETURNING id';

  try {
    const result = await pool.query(query, [id]);
    assertExists(result.rows[0], 'Role', id);
    return true;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error, 'Delete role');
  }
}

// ============================================================================
// TASK QUERIES
// ============================================================================

/**
 * Create a new task
 */
export async function createTask(input: CreateTaskInput): Promise<Task> {
  const query = `
    INSERT INTO tasks (user_id, name, description, display_order)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  try {
    const result = await pool.query(query, [
      input.user_id,
      input.name,
      input.description || null,
      input.display_order || 0,
    ]);
    return result.rows[0];
  } catch (error) {
    handleDatabaseError(error, 'Task creation');
  }
}

/**
 * Get task by ID
 */
export async function getTaskById(id: number): Promise<Task> {
  const query = 'SELECT * FROM tasks WHERE id = $1';

  try {
    const result = await pool.query(query, [id]);
    assertExists(result.rows[0], 'Task', id);
    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error, 'Get task by ID');
  }
}

/**
 * Get all tasks for a user
 */
export async function getTasksByUserId(
  userId: number,
  options: QueryOptions = {}
): Promise<PaginatedResult<Task>> {
  const limit = options.limit || 50;
  const offset = options.offset || 0;
  const orderBy = options.orderBy || 'display_order';
  const orderDirection = options.orderDirection || 'ASC';

  const countQuery = 'SELECT COUNT(*) FROM tasks WHERE user_id = $1';
  const dataQuery = `
    SELECT * FROM tasks
    WHERE user_id = $1
    ORDER BY ${orderBy} ${orderDirection}
    LIMIT $2 OFFSET $3
  `;

  try {
    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, [userId]),
      pool.query(dataQuery, [userId, limit, offset]),
    ]);

    return {
      data: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset,
    };
  } catch (error) {
    handleDatabaseError(error, 'Get tasks by user');
  }
}

/**
 * Update task by ID
 */
export async function updateTask(
  id: number,
  input: UpdateTaskInput
): Promise<Task> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (input.name !== undefined) {
    updates.push(`name = $${paramCount++}`);
    values.push(input.name);
  }

  if (input.description !== undefined) {
    updates.push(`description = $${paramCount++}`);
    values.push(input.description);
  }

  if (input.display_order !== undefined) {
    updates.push(`display_order = $${paramCount++}`);
    values.push(input.display_order);
  }

  const query = `
    UPDATE tasks
    SET ${updates.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `;
  values.push(id);

  try {
    const result = await pool.query(query, values);
    assertExists(result.rows[0], 'Task', id);
    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error, 'Update task');
  }
}

/**
 * Delete task by ID
 * NOTE: This will cascade delete all role_tasks and task_actions entries
 */
export async function deleteTask(id: number): Promise<boolean> {
  const query = 'DELETE FROM tasks WHERE id = $1 RETURNING id';

  try {
    const result = await pool.query(query, [id]);
    assertExists(result.rows[0], 'Task', id);
    return true;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error, 'Delete task');
  }
}

// ============================================================================
// ROLE-TASK JUNCTION QUERIES
// ============================================================================

/**
 * Link a task to a role
 */
export async function linkTaskToRole(
  input: CreateRoleTaskInput
): Promise<RoleTask> {
  const query = `
    INSERT INTO role_tasks (role_id, task_id, display_order)
    VALUES ($1, $2, $3)
    RETURNING *
  `;

  try {
    const result = await pool.query(query, [
      input.role_id,
      input.task_id,
      input.display_order || 0,
    ]);
    return result.rows[0];
  } catch (error) {
    handleDatabaseError(error, 'Link task to role');
  }
}

/**
 * Unlink a task from a role
 */
export async function unlinkTaskFromRole(
  roleId: number,
  taskId: number
): Promise<boolean> {
  const query = 'DELETE FROM role_tasks WHERE role_id = $1 AND task_id = $2 RETURNING id';

  try {
    const result = await pool.query(query, [roleId, taskId]);
    assertExists(result.rows[0], 'RoleTask link', `role_id=${roleId}, task_id=${taskId}`);
    return true;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error, 'Unlink task from role');
  }
}

/**
 * Get all tasks for a role (ordered)
 */
export async function getTasksForRole(
  roleId: number,
  options: QueryOptions = {}
): Promise<PaginatedResult<Task & { display_order: number }>> {
  const limit = options.limit || 50;
  const offset = options.offset || 0;

  const countQuery = `
    SELECT COUNT(*)
    FROM tasks t
    INNER JOIN role_tasks rt ON t.id = rt.task_id
    WHERE rt.role_id = $1
  `;

  const dataQuery = `
    SELECT t.*, rt.display_order
    FROM tasks t
    INNER JOIN role_tasks rt ON t.id = rt.task_id
    WHERE rt.role_id = $1
    ORDER BY rt.display_order ASC
    LIMIT $2 OFFSET $3
  `;

  try {
    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, [roleId]),
      pool.query(dataQuery, [roleId, limit, offset]),
    ]);

    return {
      data: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset,
    };
  } catch (error) {
    handleDatabaseError(error, 'Get tasks for role');
  }
}

/**
 * Get all roles that have a specific task
 */
export async function getRolesForTask(
  taskId: number,
  options: QueryOptions = {}
): Promise<PaginatedResult<Role & { display_order: number }>> {
  const limit = options.limit || 50;
  const offset = options.offset || 0;

  const countQuery = `
    SELECT COUNT(*)
    FROM roles r
    INNER JOIN role_tasks rt ON r.id = rt.role_id
    WHERE rt.task_id = $1
  `;

  const dataQuery = `
    SELECT r.*, rt.display_order
    FROM roles r
    INNER JOIN role_tasks rt ON r.id = rt.role_id
    WHERE rt.task_id = $1
    ORDER BY r.display_order ASC
    LIMIT $2 OFFSET $3
  `;

  try {
    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, [taskId]),
      pool.query(dataQuery, [taskId, limit, offset]),
    ]);

    return {
      data: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset,
    };
  } catch (error) {
    handleDatabaseError(error, 'Get roles for task');
  }
}

/**
 * Update the display order of a task within a role
 */
export async function reorderTaskInRole(
  roleId: number,
  taskId: number,
  newOrder: number
): Promise<RoleTask> {
  const query = `
    UPDATE role_tasks
    SET display_order = $3
    WHERE role_id = $1 AND task_id = $2
    RETURNING *
  `;

  try {
    const result = await pool.query(query, [roleId, taskId, newOrder]);
    assertExists(result.rows[0], 'RoleTask link', `role_id=${roleId}, task_id=${taskId}`);
    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error, 'Reorder task in role');
  }
}

// ============================================================================
// TASK-ACTION JUNCTION QUERIES
// ============================================================================

/**
 * Link an action to a task
 */
export async function linkActionToTask(
  input: CreateTaskActionInput
): Promise<TaskAction> {
  const query = `
    INSERT INTO task_actions (task_id, action_id, display_order, notes)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  try {
    const result = await pool.query(query, [
      input.task_id,
      input.action_id,
      input.display_order || 0,
      input.notes || null,
    ]);
    return result.rows[0];
  } catch (error) {
    handleDatabaseError(error, 'Link action to task');
  }
}

/**
 * Unlink an action from a task
 */
export async function unlinkActionFromTask(
  taskId: number,
  actionId: number
): Promise<boolean> {
  const query = 'DELETE FROM task_actions WHERE task_id = $1 AND action_id = $2 RETURNING id';

  try {
    const result = await pool.query(query, [taskId, actionId]);
    assertExists(result.rows[0], 'TaskAction link', `task_id=${taskId}, action_id=${actionId}`);
    return true;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error, 'Unlink action from task');
  }
}

/**
 * Get all actions for a task (ordered)
 */
export async function getActionsForTask(
  taskId: number,
  options: QueryOptions = {}
): Promise<PaginatedResult<Action & { display_order: number; notes: string | null }>> {
  const limit = options.limit || 50;
  const offset = options.offset || 0;

  const countQuery = `
    SELECT COUNT(*)
    FROM actions a
    INNER JOIN task_actions ta ON a.id = ta.action_id
    WHERE ta.task_id = $1
  `;

  const dataQuery = `
    SELECT a.*, ta.display_order, ta.notes
    FROM actions a
    INNER JOIN task_actions ta ON a.id = ta.action_id
    WHERE ta.task_id = $1
    ORDER BY ta.display_order ASC
    LIMIT $2 OFFSET $3
  `;

  try {
    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, [taskId]),
      pool.query(dataQuery, [taskId, limit, offset]),
    ]);

    // Parse JSONB fields for actions
    const actions = dataResult.rows.map((action: any) => ({
      ...action,
      steps: safeJSONParse(action.steps),
      screenshots: safeJSONParse(action.screenshots),
    }));

    return {
      data: actions,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset,
    };
  } catch (error) {
    handleDatabaseError(error, 'Get actions for task');
  }
}

/**
 * Get all tasks that contain a specific action
 */
export async function getTasksForAction(
  actionId: number,
  options: QueryOptions = {}
): Promise<PaginatedResult<Task & { display_order: number; notes: string | null }>> {
  const limit = options.limit || 50;
  const offset = options.offset || 0;

  const countQuery = `
    SELECT COUNT(*)
    FROM tasks t
    INNER JOIN task_actions ta ON t.id = ta.task_id
    WHERE ta.action_id = $1
  `;

  const dataQuery = `
    SELECT t.*, ta.display_order, ta.notes
    FROM tasks t
    INNER JOIN task_actions ta ON t.id = ta.task_id
    WHERE ta.action_id = $1
    ORDER BY t.display_order ASC
    LIMIT $2 OFFSET $3
  `;

  try {
    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, [actionId]),
      pool.query(dataQuery, [actionId, limit, offset]),
    ]);

    return {
      data: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset,
    };
  } catch (error) {
    handleDatabaseError(error, 'Get tasks for action');
  }
}

/**
 * Update the display order and/or notes of an action within a task
 */
export async function reorderActionInTask(
  taskId: number,
  actionId: number,
  input: UpdateTaskActionInput
): Promise<TaskAction> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (input.display_order !== undefined) {
    updates.push(`display_order = $${paramCount++}`);
    values.push(input.display_order);
  }

  if (input.notes !== undefined) {
    updates.push(`notes = $${paramCount++}`);
    values.push(input.notes);
  }

  if (updates.length === 0) {
    throw new ValidationError('At least one field (display_order or notes) must be provided');
  }

  const query = `
    UPDATE task_actions
    SET ${updates.join(', ')}
    WHERE task_id = $${paramCount} AND action_id = $${paramCount + 1}
    RETURNING *
  `;
  values.push(taskId, actionId);

  try {
    const result = await pool.query(query, values);
    assertExists(result.rows[0], 'TaskAction link', `task_id=${taskId}, action_id=${actionId}`);
    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    if (error instanceof ValidationError) throw error;
    handleDatabaseError(error, 'Reorder action in task');
  }
}
// ============================================================================
// UTILITY QUERIES
// ============================================================================

/**
 * Check if a user owns a system
 * Useful for authorization checks
 */
export async function userOwnsSystem(
  userId: number,
  systemId: number
): Promise<boolean> {
  const query = 'SELECT id FROM systems WHERE id = $1 AND user_id = $2';

  try {
    const result = await pool.query(query, [systemId, userId]);
    return result.rows.length > 0;
  } catch (error) {
    handleDatabaseError(error, 'Check system ownership');
  }
}

/**
 * Get action with its system info (JOIN query)
 */
export async function getActionWithSystem(id: number): Promise<Action & { system: System }> {
  const query = `
    SELECT 
      a.*,
      jsonb_build_object(
        'id', s.id,
        'user_id', s.user_id,
        'name', s.name,
        'description', s.description,
        'created_at', s.created_at,
        'updated_at', s.updated_at
      ) as system
    FROM actions a
    JOIN systems s ON a.system_id = s.id
    WHERE a.id = $1
  `;

  try {
    const result = await pool.query(query, [id]);
    assertExists(result.rows[0], 'Action', id);
    
    const row = result.rows[0];
    return {
      ...row,
      steps: safeJSONParse(row.steps),
      screenshots: safeJSONParse(row.screenshots),
    };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error, 'Get action with system');
  }
}
