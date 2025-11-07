// ============================================
// TechLedger Links Service
// backend/src/services/linksService.ts
// ============================================

import pool from '../db/connection';
import {
  Link,
  CreateLinkInput,
  UpdateLinkInput,
  LinkWithContext,
  LinkUsageStats,
  LinkAssociationInput,
} from '../types/links';

// ============================================
// Core Link CRUD Operations
// ============================================

export const createLink = async (
  input: CreateLinkInput,
  userId: number
): Promise<Link> => {
  const {
    url,
    title,
    description,
    link_type = 'documentation',
    auth_required = 'none',
    access_notes,
    notes,
    thumbnail_url,
    open_in_new_tab = true,
  } = input;

  const result = await pool.query(
    `INSERT INTO links (
      url, title, description, link_type, auth_required, 
      access_notes, notes, thumbnail_url, open_in_new_tab, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      url,
      title,
      description,
      link_type,
      auth_required,
      access_notes,
      notes,
      thumbnail_url,
      open_in_new_tab,
      userId,
    ]
  );

  return result.rows[0];
};

export const getLinkById = async (linkId: number): Promise<Link | null> => {
  const result = await pool.query('SELECT * FROM links WHERE id = $1', [linkId]);
  return result.rows[0] || null;
};

export const getAllLinks = async (filters?: {
  status?: string;
  link_type?: string;
  limit?: number;
  offset?: number;
}): Promise<{ links: Link[]; total: number }> => {
  let query = 'SELECT * FROM links WHERE 1=1';
  const params: any[] = [];
  let paramCount = 1;

  if (filters?.status) {
    query += ` AND status = $${paramCount}`;
    params.push(filters.status);
    paramCount++;
  }

  if (filters?.link_type) {
    query += ` AND link_type = $${paramCount}`;
    params.push(filters.link_type);
    paramCount++;
  }

  query += ' ORDER BY created_at DESC';

  if (filters?.limit) {
    query += ` LIMIT $${paramCount}`;
    params.push(filters.limit);
    paramCount++;
  }

  if (filters?.offset) {
    query += ` OFFSET $${paramCount}`;
    params.push(filters.offset);
  }

  const result = await pool.query(query, params);

  // Get total count
  const countResult = await pool.query('SELECT COUNT(*) FROM links');
  const total = parseInt(countResult.rows[0].count);

  return {
    links: result.rows,
    total,
  };
};

export const updateLink = async (
  linkId: number,
  input: UpdateLinkInput
): Promise<Link | null> => {
  const fields = [];
  const values = [];
  let paramCount = 1;

  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  });

  if (fields.length === 0) {
    return getLinkById(linkId);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(linkId);

  const query = `
    UPDATE links 
    SET ${fields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `;

  const result = await pool.query(query, values);
  return result.rows[0] || null;
};

export const deleteLink = async (linkId: number): Promise<boolean> => {
  const result = await pool.query('DELETE FROM links WHERE id = $1', [linkId]);
  return (result.rowCount ?? 0) > 0;
};

export const verifyLink = async (linkId: number): Promise<Link | null> => {
  const result = await pool.query(
    `UPDATE links 
     SET verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [linkId]
  );
  return result.rows[0] || null;
};

// ============================================
// Link Usage and Stats
// ============================================

export const getLinkUsageStats = async (
  linkId?: number
): Promise<LinkUsageStats[]> => {
  const query = linkId
    ? 'SELECT * FROM v_link_usage WHERE link_id = $1'
    : 'SELECT * FROM v_link_usage ORDER BY created_at DESC';

  const params = linkId ? [linkId] : [];
  const result = await pool.query(query, params);
  return result.rows;
};

export const getOrphanedLinks = async (): Promise<Link[]> => {
  const result = await pool.query('SELECT * FROM v_orphaned_links');
  return result.rows;
};

export const getLinksNeedingVerification = async (): Promise<Link[]> => {
  const result = await pool.query('SELECT * FROM v_links_need_verification');
  return result.rows;
};

// ============================================
// System Links
// ============================================

export const addLinkToSystem = async (
  systemId: number,
  input: LinkAssociationInput
): Promise<void> => {
  const { link_id, display_order = 0, context_notes } = input;

  await pool.query(
    `INSERT INTO system_links (system_id, link_id, display_order, context_notes)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (system_id, link_id) 
     DO UPDATE SET display_order = $3, context_notes = $4`,
    [systemId, link_id, display_order, context_notes]
  );
};

export const removeLinkFromSystem = async (
  systemId: number,
  linkId: number
): Promise<boolean> => {
  const result = await pool.query(
    'DELETE FROM system_links WHERE system_id = $1 AND link_id = $2',
    [systemId, linkId]
  );
  return (result.rowCount ?? 0) > 0;
};

export const getSystemLinks = async (
  systemId: number
): Promise<LinkWithContext[]> => {
  const result = await pool.query(
    `SELECT l.*, sl.display_order, sl.context_notes
     FROM links l
     JOIN system_links sl ON l.id = sl.link_id
     WHERE sl.system_id = $1 AND l.status = 'active'
     ORDER BY sl.display_order ASC, l.created_at DESC`,
    [systemId]
  );
  return result.rows;
};

// ============================================
// Action Links
// ============================================

export const addLinkToAction = async (
  actionId: number,
  input: LinkAssociationInput
): Promise<void> => {
  const { link_id, display_order = 0, context_notes } = input;

  await pool.query(
    `INSERT INTO action_links (action_id, link_id, display_order, context_notes)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (action_id, link_id) 
     DO UPDATE SET display_order = $3, context_notes = $4`,
    [actionId, link_id, display_order, context_notes]
  );
};

export const removeLinkFromAction = async (
  actionId: number,
  linkId: number
): Promise<boolean> => {
  const result = await pool.query(
    'DELETE FROM action_links WHERE action_id = $1 AND link_id = $2',
    [actionId, linkId]
  );
  return (result.rowCount ?? 0) > 0;
};

export const getActionLinks = async (
  actionId: number
): Promise<LinkWithContext[]> => {
  const result = await pool.query(
    `SELECT l.*, al.display_order, al.context_notes
     FROM links l
     JOIN action_links al ON l.id = al.link_id
     WHERE al.action_id = $1 AND l.status = 'active'
     ORDER BY al.display_order ASC, l.created_at DESC`,
    [actionId]
  );
  return result.rows;
};

// ============================================
// Role Links
// ============================================

export const addLinkToRole = async (
  roleId: number,
  input: LinkAssociationInput
): Promise<void> => {
  const { link_id, display_order = 0, context_notes } = input;

  await pool.query(
    `INSERT INTO role_links (role_id, link_id, display_order, context_notes)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (role_id, link_id) 
     DO UPDATE SET display_order = $3, context_notes = $4`,
    [roleId, link_id, display_order, context_notes]
  );
};

export const removeLinkFromRole = async (
  roleId: number,
  linkId: number
): Promise<boolean> => {
  const result = await pool.query(
    'DELETE FROM role_links WHERE role_id = $1 AND link_id = $2',
    [roleId, linkId]
  );
  return (result.rowCount ?? 0) > 0;
};

export const getRoleLinks = async (roleId: number): Promise<LinkWithContext[]> => {
  const result = await pool.query(
    `SELECT l.*, rl.display_order, rl.context_notes
     FROM links l
     JOIN role_links rl ON l.id = rl.link_id
     WHERE rl.role_id = $1 AND l.status = 'active'
     ORDER BY rl.display_order ASC, l.created_at DESC`,
    [roleId]
  );
  return result.rows;
};

// ============================================
// Task Links
// ============================================

export const addLinkToTask = async (
  taskId: number,
  input: LinkAssociationInput
): Promise<void> => {
  const { link_id, display_order = 0, context_notes } = input;

  await pool.query(
    `INSERT INTO task_links (task_id, link_id, display_order, context_notes)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (task_id, link_id) 
     DO UPDATE SET display_order = $3, context_notes = $4`,
    [taskId, link_id, display_order, context_notes]
  );
};

export const removeLinkFromTask = async (
  taskId: number,
  linkId: number
): Promise<boolean> => {
  const result = await pool.query(
    'DELETE FROM task_links WHERE task_id = $1 AND link_id = $2',
    [taskId, linkId]
  );
  return (result.rowCount ?? 0) > 0;
};

export const getTaskLinks = async (taskId: number): Promise<LinkWithContext[]> => {
  const result = await pool.query(
    `SELECT l.*, tl.display_order, tl.context_notes
     FROM links l
     JOIN task_links tl ON l.id = tl.link_id
     WHERE tl.task_id = $1 AND l.status = 'active'
     ORDER BY tl.display_order ASC, l.created_at DESC`,
    [taskId]
  );
  return result.rows;
};

// ============================================
// Bulk Operations
// ============================================

export const bulkAddLinks = async (
  objectType: 'system' | 'action' | 'role' | 'task',
  objectId: number,
  linkInputs: LinkAssociationInput[]
): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const input of linkInputs) {
      switch (objectType) {
        case 'system':
          await addLinkToSystem(objectId, input);
          break;
        case 'action':
          await addLinkToAction(objectId, input);
          break;
        case 'role':
          await addLinkToRole(objectId, input);
          break;
        case 'task':
          await addLinkToTask(objectId, input);
          break;
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const reorderLinks = async (
  objectType: 'system' | 'action' | 'role' | 'task',
  objectId: number,
  linkOrders: Array<{ link_id: number; display_order: number }>
): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const { link_id, display_order } of linkOrders) {
      let table: string;
      let idColumn: string;

      switch (objectType) {
        case 'system':
          table = 'system_links';
          idColumn = 'system_id';
          break;
        case 'action':
          table = 'action_links';
          idColumn = 'action_id';
          break;
        case 'role':
          table = 'role_links';
          idColumn = 'role_id';
          break;
        case 'task':
          table = 'task_links';
          idColumn = 'task_id';
          break;
      }

      await client.query(
        `UPDATE ${table} 
         SET display_order = $1 
         WHERE ${idColumn} = $2 AND link_id = $3`,
        [display_order, objectId, link_id]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
