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
} from '../types/models';
import {
  NotFoundError,
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
