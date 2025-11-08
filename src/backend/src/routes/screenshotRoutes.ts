/**
 * Screenshot Routes
 * 
 * REST API endpoints for screenshot management
 * Base path: /api/screenshots
 */

import express, { Request, Response } from 'express';
import * as queries from '../db/queries';
import { validateRequired, validatePositiveInteger } from '../utils/validation';
import { NotFoundError, ValidationError } from '../utils/errors';

const router = express.Router();

// ============================================================================
// SCREENSHOT ENDPOINTS
// ============================================================================

/**
 * GET /api/screenshots/:id
 * Get a single screenshot by ID
 */
router.get('/screenshots/:id', async (req: Request, res: Response) => {
  try {
    const screenshotId = parseInt(req.params.id);

    if (isNaN(screenshotId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid screenshot ID',
      });
    }

    const screenshot = await queries.getScreenshotById(screenshotId);

    res.json({
      success: true,
      data: screenshot,
    });
  } catch (error: any) {
    console.error(`GET /api/screenshots/${req.params.id} error:`, error);

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch screenshot',
    });
  }
});

/**
 * POST /api/screenshots
 * Create a new screenshot record
 * 
 * Body:
 * - action_id: number (required)
 * - file_path: string (required) - Path to uploaded file
 * - original_filename: string (optional)
 * - ocr_data: OCRData (optional JSONB)
 * - vision_data: VisionData (optional JSONB)
 * 
 * Note: This is typically called after a file upload
 * For file uploads with automatic OCR, see /api/upload endpoint
 */
router.post('/screenshots', async (req: Request, res: Response) => {
  try {
    const { action_id, file_path, original_filename, ocr_data, vision_data } = req.body;

    // Validate required fields
    validateRequired(['action_id', 'file_path'], req.body);

    // Validate action_id
    if (!validatePositiveInteger(action_id)) {
      return res.status(400).json({
        success: false,
        error: 'action_id must be a positive integer',
      });
    }

    // Verify action exists
    try {
      await queries.getActionById(action_id);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          error: 'Action not found',
        });
      }
      throw error;
    }

    // Validate ocr_data format if provided
    if (ocr_data && typeof ocr_data !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'ocr_data must be an object',
      });
    }

    // Validate vision_data format if provided
    if (vision_data && typeof vision_data !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'vision_data must be an object',
      });
    }

    // Create screenshot
    const screenshot = await queries.createScreenshot({
      action_id,
      file_path,
      original_filename,
      ocr_data,
      vision_data,
    });

    res.status(201).json({
      success: true,
      data: screenshot,
      message: 'Screenshot created successfully',
    });
  } catch (error: any) {
    console.error('POST /api/screenshots error:', error);

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create screenshot',
    });
  }
});

/**
 * PUT /api/screenshots/:id
 * Update a screenshot (typically to add OCR/Vision data)
 * 
 * Body:
 * - ocr_data: OCRData (optional)
 * - vision_data: VisionData (optional)
 */
router.put('/screenshots/:id', async (req: Request, res: Response) => {
  try {
    const screenshotId = parseInt(req.params.id);

    if (isNaN(screenshotId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid screenshot ID',
      });
    }

    const { ocr_data, vision_data } = req.body;

    // Validate at least one field is provided
    if (ocr_data === undefined && vision_data === undefined) {
      return res.status(400).json({
        success: false,
        error: 'At least one field (ocr_data or vision_data) must be provided',
      });
    }

    // Validate ocr_data format if provided
    if (ocr_data !== undefined && ocr_data !== null && typeof ocr_data !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'ocr_data must be an object or null',
      });
    }

    // Validate vision_data format if provided
    if (vision_data !== undefined && vision_data !== null && typeof vision_data !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'vision_data must be an object or null',
      });
    }

    // Update screenshot
    const updatedScreenshot = await queries.updateScreenshot(screenshotId, {
      ocr_data,
      vision_data,
    });

    res.json({
      success: true,
      data: updatedScreenshot,
      message: 'Screenshot updated successfully',
    });
  } catch (error: any) {
    console.error(`PUT /api/screenshots/${req.params.id} error:`, error);

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update screenshot',
    });
  }
});

/**
 * DELETE /api/screenshots/:id
 * Delete a screenshot
 * 
 * Note: This only deletes the database record.
 * The actual file on disk is not deleted automatically.
 */
router.delete('/screenshots/:id', async (req: Request, res: Response) => {
  try {
    const screenshotId = parseInt(req.params.id);

    if (isNaN(screenshotId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid screenshot ID',
      });
    }

    // Get screenshot to check file path (for future file deletion)
    const screenshot = await queries.getScreenshotById(screenshotId);

    // Delete from database
    await queries.deleteScreenshot(screenshotId);

    res.json({
      success: true,
      message: 'Screenshot deleted successfully',
      note: `File at ${screenshot.file_path} was not deleted from disk`,
    });
  } catch (error: any) {
    console.error(`DELETE /api/screenshots/${req.params.id} error:`, error);

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete screenshot',
    });
  }
});

export default router;
