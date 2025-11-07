// ============================================
// TechLedger Links API Routes
// backend/src/routes/linksRoutes.ts
// ============================================

import express, { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import * as linksService from '../services/linksService';
import { isValidUrl, isValidLinkType, isValidAuthRequired } from '../types/links';

const router = express.Router();

// ============================================
// Validation Middleware
// ============================================

const handleValidationErrors = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// ============================================
// Core Link Routes
// ============================================

// Create a new link
router.post(
  '/links',
  [
    body('url').custom(isValidUrl).withMessage('Must be a valid HTTP(S) URL'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('link_type').optional().custom(isValidLinkType),
    body('auth_required').optional().custom(isValidAuthRequired),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      // TODO: Get userId from authenticated session
      const userId = 2; // Placeholder

      const link = await linksService.createLink(req.body, userId);
      res.status(201).json(link);
    } catch (error: any) {
      console.error('Error creating link:', error);
      res.status(500).json({ error: 'Failed to create link', message: error.message });
    }
  }
);

// Get all links (with optional filters)
router.get('/links', async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status as string | undefined,
      link_type: req.query.link_type as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };

    const result = await linksService.getAllLinks(filters);
    
    res.json({
      links: result.links,
      total: result.total,
      page: filters.offset ? Math.floor(filters.offset / (filters.limit || 20)) + 1 : 1,
      per_page: filters.limit || 20,
    });
  } catch (error: any) {
    console.error('Error fetching links:', error);
    res.status(500).json({ error: 'Failed to fetch links', message: error.message });
  }
});

// Get single link by ID
router.get(
  '/links/:id',
  [param('id').isInt().toInt(), handleValidationErrors],
  async (req: Request, res: Response) => {
    try {
      const link = await linksService.getLinkById(req.params.id as any);
      
      if (!link) {
        return res.status(404).json({ error: 'Link not found' });
      }

      res.json(link);
    } catch (error: any) {
      console.error('Error fetching link:', error);
      res.status(500).json({ error: 'Failed to fetch link', message: error.message });
    }
  }
);

// Update a link
router.put(
  '/links/:id',
  [
    param('id').isInt().toInt(),
    body('url').optional().custom(isValidUrl),
    body('title').optional().trim().notEmpty(),
    body('link_type').optional().custom(isValidLinkType),
    body('auth_required').optional().custom(isValidAuthRequired),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const link = await linksService.updateLink(req.params.id as any, req.body);
      
      if (!link) {
        return res.status(404).json({ error: 'Link not found' });
      }

      res.json(link);
    } catch (error: any) {
      console.error('Error updating link:', error);
      res.status(500).json({ error: 'Failed to update link', message: error.message });
    }
  }
);

// Delete a link
router.delete(
  '/links/:id',
  [param('id').isInt().toInt(), handleValidationErrors],
  async (req: Request, res: Response) => {
    try {
      const deleted = await linksService.deleteLink(req.params.id as any);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Link not found' });
      }

      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting link:', error);
      res.status(500).json({ error: 'Failed to delete link', message: error.message });
    }
  }
);

// Verify a link (updates verified_at timestamp)
router.post(
  '/links/:id/verify',
  [param('id').isInt().toInt(), handleValidationErrors],
  async (req: Request, res: Response) => {
    try {
      const link = await linksService.verifyLink(req.params.id as any);
      
      if (!link) {
        return res.status(404).json({ error: 'Link not found' });
      }

      res.json(link);
    } catch (error: any) {
      console.error('Error verifying link:', error);
      res.status(500).json({ error: 'Failed to verify link', message: error.message });
    }
  }
);

// ============================================
// Link Stats & Maintenance Routes
// ============================================

// Get link usage statistics
router.get('/links/stats/usage', async (req: Request, res: Response) => {
  try {
    const linkId = req.query.link_id ? parseInt(req.query.link_id as string) : undefined;
    const stats = await linksService.getLinkUsageStats(linkId);
    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching link stats:', error);
    res.status(500).json({ error: 'Failed to fetch link stats', message: error.message });
  }
});

// Get orphaned links (not associated with any object)
router.get('/links/maintenance/orphaned', async (req: Request, res: Response) => {
  try {
    const links = await linksService.getOrphanedLinks();
    res.json({ links, count: links.length });
  } catch (error: any) {
    console.error('Error fetching orphaned links:', error);
    res.status(500).json({ error: 'Failed to fetch orphaned links', message: error.message });
  }
});

// Get links needing verification
router.get('/links/maintenance/needs-verification', async (req: Request, res: Response) => {
  try {
    const links = await linksService.getLinksNeedingVerification();
    res.json({ links, count: links.length });
  } catch (error: any) {
    console.error('Error fetching links needing verification:', error);
    res.status(500).json({ error: 'Failed to fetch links', message: error.message });
  }
});

// ============================================
// System Links Routes
// ============================================

router.post(
  '/systems/:systemId/links',
  [
    param('systemId').isInt().toInt(),
    body('link_id').isInt(),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      await linksService.addLinkToSystem(req.params.systemId as any, req.body);
      res.status(201).json({ message: 'Link added to system' });
    } catch (error: any) {
      console.error('Error adding link to system:', error);
      res.status(500).json({ error: 'Failed to add link', message: error.message });
    }
  }
);

router.get(
  '/systems/:systemId/links',
  [param('systemId').isInt().toInt(), handleValidationErrors],
  async (req: Request, res: Response) => {
    try {
      const links = await linksService.getSystemLinks(req.params.systemId as any);
      res.json({ links, object_type: 'system', object_id: req.params.systemId });
    } catch (error: any) {
      console.error('Error fetching system links:', error);
      res.status(500).json({ error: 'Failed to fetch links', message: error.message });
    }
  }
);

router.delete(
  '/systems/:systemId/links/:linkId',
  [
    param('systemId').isInt().toInt(),
    param('linkId').isInt().toInt(),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const deleted = await linksService.removeLinkFromSystem(
        req.params.systemId as any,
        req.params.linkId as any
      );
      
      if (!deleted) {
        return res.status(404).json({ error: 'Association not found' });
      }

      res.status(204).send();
    } catch (error: any) {
      console.error('Error removing link from system:', error);
      res.status(500).json({ error: 'Failed to remove link', message: error.message });
    }
  }
);

// ============================================
// Action Links Routes
// ============================================

router.post(
  '/actions/:actionId/links',
  [
    param('actionId').isInt().toInt(),
    body('link_id').isInt(),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      await linksService.addLinkToAction(req.params.actionId as any, req.body);
      res.status(201).json({ message: 'Link added to action' });
    } catch (error: any) {
      console.error('Error adding link to action:', error);
      res.status(500).json({ error: 'Failed to add link', message: error.message });
    }
  }
);

router.get(
  '/actions/:actionId/links',
  [param('actionId').isInt().toInt(), handleValidationErrors],
  async (req: Request, res: Response) => {
    try {
      const links = await linksService.getActionLinks(req.params.actionId as any);
      res.json({ links, object_type: 'action', object_id: req.params.actionId });
    } catch (error: any) {
      console.error('Error fetching action links:', error);
      res.status(500).json({ error: 'Failed to fetch links', message: error.message });
    }
  }
);

router.delete(
  '/actions/:actionId/links/:linkId',
  [
    param('actionId').isInt().toInt(),
    param('linkId').isInt().toInt(),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const deleted = await linksService.removeLinkFromAction(
        req.params.actionId as any,
        req.params.linkId as any
      );
      
      if (!deleted) {
        return res.status(404).json({ error: 'Association not found' });
      }

      res.status(204).send();
    } catch (error: any) {
      console.error('Error removing link from action:', error);
      res.status(500).json({ error: 'Failed to remove link', message: error.message });
    }
  }
);

// ============================================
// Role Links Routes (similar pattern)
// ============================================

router.post('/roles/:roleId/links', async (req: Request, res: Response) => {
  try {
    await linksService.addLinkToRole(req.params.roleId as any, req.body);
    res.status(201).json({ message: 'Link added to role' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to add link', message: error.message });
  }
});

router.get('/roles/:roleId/links', async (req: Request, res: Response) => {
  try {
    const links = await linksService.getRoleLinks(req.params.roleId as any);
    res.json({ links, object_type: 'role', object_id: req.params.roleId });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch links', message: error.message });
  }
});

router.delete('/roles/:roleId/links/:linkId', async (req: Request, res: Response) => {
  try {
    await linksService.removeLinkFromRole(req.params.roleId as any, req.params.linkId as any);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to remove link', message: error.message });
  }
});

// ============================================
// Task Links Routes (similar pattern)
// ============================================

router.post('/tasks/:taskId/links', async (req: Request, res: Response) => {
  try {
    await linksService.addLinkToTask(req.params.taskId as any, req.body);
    res.status(201).json({ message: 'Link added to task' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to add link', message: error.message });
  }
});

router.get('/tasks/:taskId/links', async (req: Request, res: Response) => {
  try {
    const links = await linksService.getTaskLinks(req.params.taskId as any);
    res.json({ links, object_type: 'task', object_id: req.params.taskId });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch links', message: error.message });
  }
});

router.delete('/tasks/:taskId/links/:linkId', async (req: Request, res: Response) => {
  try {
    await linksService.removeLinkFromTask(req.params.taskId as any, req.params.linkId as any);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to remove link', message: error.message });
  }
});

// ============================================
// Bulk Operations
// ============================================

router.post(
  '/:objectType/:objectId/links/bulk',
  async (req: Request, res: Response) => {
    try {
      const { objectType, objectId } = req.params;
      const { links } = req.body;

      if (!['system', 'action', 'role', 'task'].includes(objectType)) {
        return res.status(400).json({ error: 'Invalid object type' });
      }

      await linksService.bulkAddLinks(
        objectType as any,
        parseInt(objectId),
        links
      );

      res.status(201).json({ message: 'Links added successfully' });
    } catch (error: any) {
      console.error('Error adding bulk links:', error);
      res.status(500).json({ error: 'Failed to add links', message: error.message });
    }
  }
);

router.put(
  '/:objectType/:objectId/links/reorder',
  async (req: Request, res: Response) => {
    try {
      const { objectType, objectId } = req.params;
      const { link_orders } = req.body;

      if (!['system', 'action', 'role', 'task'].includes(objectType)) {
        return res.status(400).json({ error: 'Invalid object type' });
      }

      await linksService.reorderLinks(
        objectType as any,
        parseInt(objectId),
        link_orders
      );

      res.json({ message: 'Links reordered successfully' });
    } catch (error: any) {
      console.error('Error reordering links:', error);
      res.status(500).json({ error: 'Failed to reorder links', message: error.message });
    }
  }
);

export default router;
