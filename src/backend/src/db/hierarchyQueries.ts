/**
 * TechLedger Hierarchy Queries
 * CRUD operations for: Departments, Practice Groups, Action Sequences
 */

import pool from './connection';
import {
  Department,
  CreateDepartmentInput,
  UpdateDepartmentInput,
  PracticeGroup,
  CreatePracticeGroupInput,
  UpdatePracticeGroupInput,
  ActionSequence,
  CreateActionSequenceInput,
  UpdateActionSequenceInput,
  SequenceAction,
  CreateSequenceActionInput,
  UpdateSequenceActionInput,
  ActionSequenceWithActions,
  QueryOptions,
  PaginatedResult,
} from '../types/models';
import {
  NotFoundError,
  handleDatabaseError,
  assertExists,
} from '../utils/errors';

// ============================================================================
// DEPARTMENT QUERIES
// ============================================================================

/**
 * Create a new department
 */
export async function createDepartment(
  input: CreateDepartmentInput
): Promise<Department> {
  const query = `
    INSERT INTO departments (system_id, name, description, display_order)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  try {
    const result = await pool.query(query, [
      input.system_id,
      input.name,
      input.description || null,
      input.display_order || 0,
    ]);
    return result.rows[0];
  } catch (error) {
    handleDatabaseError(error, 'Department creation');
  }
}

/**
 * Get department by ID
 */
export async function getDepartmentById(id: number): Promise<Department> {
  const query = 'SELECT * FROM departments WHERE id = $1';

  try {
    const result = await pool.query(query, [id]);
    assertExists(result.rows[0], 'Department', id);
    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error, 'Get department by ID');
  }
}

/**
 * Get all departments for a system
 */
export async function getDepartmentsBySystemId(
  systemId: number,
  options: QueryOptions = {}
): Promise<PaginatedResult<Department>> {
  const limit = options.limit || 50;
  const offset = options.offset || 0;
  const orderBy = options.orderBy || 'display_order';
  const orderDirection = options.orderDirection || 'ASC';

  const countQuery = 'SELECT COUNT(*) FROM departments WHERE system_id = $1';
  const dataQuery = `
    SELECT * FROM departments
    WHERE system_id = $1
    ORDER BY ${orderBy} ${orderDirection}
    LIMIT $2 OFFSET $3
  `;

  try {
    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, [systemId]),
      pool.query(dataQuery, [systemId, limit, offset]),
    ]);

    return {
      data: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset,
    };
  } catch (error) {
    handleDatabaseError(error, 'Get departments by system');
  }
}

/**
 * Update department by ID
 */
export async function updateDepartment(
  id: number,
  input: UpdateDepartmentInput
): Promise<Department> {
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

  updates.push(`updated_at = CURRENT_TIMESTAMP`);

  const query = `
    UPDATE departments
    SET ${updates.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `;
  values.push(id);

  try {
    const result = await pool.query(query, values);
    assertExists(result.rows[0], 'Department', id);
    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error, 'Update department');
  }
}

/**
 * Delete department by ID
 * Cascades to practice groups, actions, sequences
 */
export async function deleteDepartment(id: number): Promise<boolean> {
  const query = 'DELETE FROM departments WHERE id = $1 RETURNING id';

  try {
    const result = await pool.query(query, [id]);
    assertExists(result.rows[0], 'Department', id);
    return true;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error, 'Delete department');
  }
}

// ============================================================================
// PRACTICE GROUP QUERIES
// ============================================================================

/**
 * Create a new practice group
 */
export async function createPracticeGroup(
  input: CreatePracticeGroupInput
): Promise<PracticeGroup> {
  const query = `
    INSERT INTO practice_groups (department_id, name, description, display_order)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  try {
    const result = await pool.query(query, [
      input.department_id,
      input.name,
      input.description || null,
      input.display_order || 0,
    ]);
    return result.rows[0];
  } catch (error) {
    handleDatabaseError(error, 'Practice group creation');
  }
}

/**
 * Get practice group by ID
 */
export async function getPracticeGroupById(id: number): Promise<PracticeGroup> {
  const query = 'SELECT * FROM practice_groups WHERE id = $1';

  try {
    const result = await pool.query(query, [id]);
    assertExists(result.rows[0], 'Practice Group', id);
    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error, 'Get practice group by ID');
  }
}

/**
 * Get all practice groups for a department
 */
export async function getPracticeGroupsByDepartmentId(
  departmentId: number,
  options: QueryOptions = {}
): Promise<PaginatedResult<PracticeGroup>> {
  const limit = options.limit || 50;
  const offset = options.offset || 0;
  const orderBy = options.orderBy || 'display_order';
  const orderDirection = options.orderDirection || 'ASC';

  const countQuery = 'SELECT COUNT(*) FROM practice_groups WHERE department_id = $1';
  const dataQuery = `
    SELECT * FROM practice_groups
    WHERE department_id = $1
    ORDER BY ${orderBy} ${orderDirection}
    LIMIT $2 OFFSET $3
  `;

  try {
    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, [departmentId]),
      pool.query(dataQuery, [departmentId, limit, offset]),
    ]);

    return {
      data: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset,
    };
  } catch (error) {
    handleDatabaseError(error, 'Get practice groups by department');
  }
}

/**
 * Update practice group by ID
 */
export async function updatePracticeGroup(
  id: number,
  input: UpdatePracticeGroupInput
): Promise<PracticeGroup> {
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

  updates.push(`updated_at = CURRENT_TIMESTAMP`);

  const query = `
    UPDATE practice_groups
    SET ${updates.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `;
  values.push(id);

  try {
    const result = await pool.query(query, values);
    assertExists(result.rows[0], 'Practice Group', id);
    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error, 'Update practice group');
  }
}

/**
 * Delete practice group by ID
 * Cascades to actions and sequences
 */
export async function deletePracticeGroup(id: number): Promise<boolean> {
  const query = 'DELETE FROM practice_groups WHERE id = $1 RETURNING id';

  try {
    const result = await pool.query(query, [id]);
    assertExists(result.rows[0], 'Practice Group', id);
    return true;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error, 'Delete practice group');
  }
}

// ============================================================================
// ACTION SEQUENCE QUERIES
// ============================================================================

/**
 * Create a new action sequence
 */
export async function createActionSequence(
  input: CreateActionSequenceInput
): Promise<ActionSequence> {
  const query = `
    INSERT INTO action_sequences (practice_group_id, name, description)
    VALUES ($1, $2, $3)
    RETURNING *
  `;

  try {
    const result = await pool.query(query, [
      input.practice_group_id,
      input.name,
      input.description || null,
    ]);
    return result.rows[0];
  } catch (error) {
    handleDatabaseError(error, 'Action sequence creation');
  }
}

/**
 * Get action sequence by ID
 */
export async function getActionSequenceById(id: number): Promise<ActionSequence> {
  const query = 'SELECT * FROM action_sequences WHERE id = $1';

  try {
    const result = await pool.query(query, [id]);
    assertExists(result.rows[0], 'Action Sequence', id);
    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error, 'Get action sequence by ID');
  }
}

/**
 * Get action sequence with all its actions (ordered)
 */
export async function getActionSequenceWithActions(
  id: number
): Promise<ActionSequenceWithActions> {
  const query = `
    SELECT 
      seq.*,
      json_agg(
        json_build_object(
          'action', row_to_json(a.*),
          'order_number', sa.order_number,
          'notes', sa.notes
        ) ORDER BY sa.order_number
      ) as actions
    FROM action_sequences seq
    LEFT JOIN sequence_actions sa ON sa.sequence_id = seq.id
    LEFT JOIN actions a ON a.id = sa.action_id
    WHERE seq.id = $1
    GROUP BY seq.id
  `;

  try {
    const result = await pool.query(query, [id]);
    assertExists(result.rows[0], 'Action Sequence', id);
    
    const row = result.rows[0];
    return {
      ...row,
      actions: row.actions[0].action ? row.actions : [], // Handle empty sequences
    };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error, 'Get action sequence with actions');
  }
}

/**
 * Get all action sequences for a practice group
 */
export async function getActionSequencesByPracticeGroupId(
  practiceGroupId: number,
  options: QueryOptions = {}
): Promise<PaginatedResult<ActionSequence>> {
  const limit = options.limit || 50;
  const offset = options.offset || 0;
  const orderBy = options.orderBy || 'created_at';
  const orderDirection = options.orderDirection || 'DESC';

  const countQuery = 'SELECT COUNT(*) FROM action_sequences WHERE practice_group_id = $1';
  const dataQuery = `
    SELECT * FROM action_sequences
    WHERE practice_group_id = $1
    ORDER BY ${orderBy} ${orderDirection}
    LIMIT $2 OFFSET $3
  `;

  try {
    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, [practiceGroupId]),
      pool.query(dataQuery, [practiceGroupId, limit, offset]),
    ]);

    return {
      data: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset,
    };
  } catch (error) {
    handleDatabaseError(error, 'Get action sequences by practice group');
  }
}

/**
 * Update action sequence by ID
 */
export async function updateActionSequence(
  id: number,
  input: UpdateActionSequenceInput
): Promise<ActionSequence> {
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
    UPDATE action_sequences
    SET ${updates.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `;
  values.push(id);

  try {
    const result = await pool.query(query, values);
    assertExists(result.rows[0], 'Action Sequence', id);
    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error, 'Update action sequence');
  }
}

/**
 * Delete action sequence by ID
 * Cascades to sequence_actions
 */
export async function deleteActionSequence(id: number): Promise<boolean> {
  const query = 'DELETE FROM action_sequences WHERE id = $1 RETURNING id';

  try {
    const result = await pool.query(query, [id]);
    assertExists(result.rows[0], 'Action Sequence', id);
    return true;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error, 'Delete action sequence');
  }
}

// ============================================================================
// SEQUENCE ACTION QUERIES (Junction Table)
// ============================================================================

/**
 * Add action to sequence
 */
export async function addActionToSequence(
  input: CreateSequenceActionInput
): Promise<SequenceAction> {
  const query = `
    INSERT INTO sequence_actions (sequence_id, action_id, order_number, notes)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  try {
    const result = await pool.query(query, [
      input.sequence_id,
      input.action_id,
      input.order_number,
      input.notes || null,
    ]);
    return result.rows[0];
  } catch (error) {
    handleDatabaseError(error, 'Add action to sequence');
  }
}

/**
 * Update sequence action (change order or notes)
 */
export async function updateSequenceAction(
  id: number,
  input: UpdateSequenceActionInput
): Promise<SequenceAction> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (input.order_number !== undefined) {
    updates.push(`order_number = $${paramCount++}`);
    values.push(input.order_number);
  }

  if (input.notes !== undefined) {
    updates.push(`notes = $${paramCount++}`);
    values.push(input.notes);
  }

  const query = `
    UPDATE sequence_actions
    SET ${updates.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `;
  values.push(id);

  try {
    const result = await pool.query(query, values);
    assertExists(result.rows[0], 'Sequence Action', id);
    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error, 'Update sequence action');
  }
}

/**
 * Remove action from sequence
 */
export async function removeActionFromSequence(id: number): Promise<boolean> {
  const query = 'DELETE FROM sequence_actions WHERE id = $1 RETURNING id';

  try {
    const result = await pool.query(query, [id]);
    assertExists(result.rows[0], 'Sequence Action', id);
    return true;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error, 'Remove action from sequence');
  }
}

/**
 * Get all actions in a sequence (ordered)
 */
export async function getSequenceActions(
  sequenceId: number
): Promise<SequenceAction[]> {
  const query = `
    SELECT * FROM sequence_actions
    WHERE sequence_id = $1
    ORDER BY order_number ASC
  `;

  try {
    const result = await pool.query(query, [sequenceId]);
    return result.rows;
  } catch (error) {
    handleDatabaseError(error, 'Get sequence actions');
  }
}

// ============================================================================
// UTILITY QUERIES
// ============================================================================

/**
 * Get full hierarchy: System → Departments → Practice Groups
 */
export async function getSystemHierarchy(systemId: number): Promise<any> {
  const query = `
    SELECT 
      s.id as system_id,
      s.name as system_name,
      json_agg(
        json_build_object(
          'id', d.id,
          'name', d.name,
          'practice_groups', (
            SELECT json_agg(
              json_build_object(
                'id', pg.id,
                'name', pg.name,
                'description', pg.description
              ) ORDER BY pg.display_order
            )
            FROM practice_groups pg
            WHERE pg.department_id = d.id
          )
        ) ORDER BY d.display_order
      ) as departments
    FROM systems s
    LEFT JOIN departments d ON d.system_id = s.id
    WHERE s.id = $1
    GROUP BY s.id, s.name
  `;

  try {
    const result = await pool.query(query, [systemId]);
    return result.rows[0];
  } catch (error) {
    handleDatabaseError(error, 'Get system hierarchy');
  }
}
