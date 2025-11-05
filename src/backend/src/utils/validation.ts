/**
 * TechLedger Input Validation Utilities
 * 
 * EXPLANATION FOR NODE.JS NEWCOMERS:
 * - Always validate user input BEFORE hitting the database
 * - These functions throw ValidationError if data is invalid
 * - Use them in your controllers before calling database functions
 */

import { ValidationError } from './errors';
import {
  CreateUserInput,
  UpdateUserInput,
  CreateSystemInput,
  UpdateSystemInput,
  CreateActionInput,
  UpdateActionInput,
  CreateScreenshotInput,
  UpdateScreenshotInput,
  ActionStep,
  ActionScreenshotRef,
} from '../types/models';

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if a string is a valid email
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if a string meets minimum/maximum length requirements
 */
function isValidLength(
  str: string,
  min: number,
  max: number
): boolean {
  const length = str.trim().length;
  return length >= min && length <= max;
}

/**
 * Check if a value is a positive integer
 */
function isPositiveInteger(value: any): boolean {
  return Number.isInteger(value) && value > 0;
}

/**
 * Collect validation errors into a single object
 */
class ErrorCollector {
  private errors: Record<string, string> = {};

  add(field: string, message: string): void {
    this.errors[field] = message;
  }

  hasErrors(): boolean {
    return Object.keys(this.errors).length > 0;
  }

  throw(message: string = 'Validation failed'): never {
    throw new ValidationError(message, this.errors);
  }

  getErrors(): Record<string, string> {
    return this.errors;
  }
}

// ============================================================================
// USER VALIDATION
// ============================================================================

/**
 * Validate data for creating a new user
 */
export function validateCreateUser(input: CreateUserInput): void {
  const errors = new ErrorCollector();

  // Email validation
  if (!input.email) {
    errors.add('email', 'Email is required');
  } else if (!isValidEmail(input.email)) {
    errors.add('email', 'Invalid email format');
  } else if (!isValidLength(input.email, 3, 255)) {
    errors.add('email', 'Email must be between 3 and 255 characters');
  }

  // Name validation
  if (!input.name) {
    errors.add('name', 'Name is required');
  } else if (!isValidLength(input.name, 1, 255)) {
    errors.add('name', 'Name must be between 1 and 255 characters');
  }

  if (errors.hasErrors()) {
    errors.throw('Invalid user data');
  }
}

/**
 * Validate data for updating a user
 */
export function validateUpdateUser(input: UpdateUserInput): void {
  const errors = new ErrorCollector();

  // Email validation (if provided)
  if (input.email !== undefined) {
    if (!input.email) {
      errors.add('email', 'Email cannot be empty');
    } else if (!isValidEmail(input.email)) {
      errors.add('email', 'Invalid email format');
    } else if (!isValidLength(input.email, 3, 255)) {
      errors.add('email', 'Email must be between 3 and 255 characters');
    }
  }

  // Name validation (if provided)
  if (input.name !== undefined) {
    if (!input.name) {
      errors.add('name', 'Name cannot be empty');
    } else if (!isValidLength(input.name, 1, 255)) {
      errors.add('name', 'Name must be between 1 and 255 characters');
    }
  }

  // At least one field must be provided
  if (input.email === undefined && input.name === undefined) {
    errors.add('_general', 'At least one field must be provided for update');
  }

  if (errors.hasErrors()) {
    errors.throw('Invalid update data');
  }
}

// ============================================================================
// SYSTEM VALIDATION
// ============================================================================

/**
 * Validate data for creating a new system
 */
export function validateCreateSystem(input: CreateSystemInput): void {
  const errors = new ErrorCollector();

  // User ID validation
  if (!input.user_id) {
    errors.add('user_id', 'User ID is required');
  } else if (!isPositiveInteger(input.user_id)) {
    errors.add('user_id', 'User ID must be a positive integer');
  }

  // Name validation
  if (!input.name) {
    errors.add('name', 'System name is required');
  } else if (!isValidLength(input.name, 1, 255)) {
    errors.add('name', 'System name must be between 1 and 255 characters');
  }

  // Description validation (optional)
  if (input.description !== undefined && input.description) {
    if (!isValidLength(input.description, 0, 5000)) {
      errors.add('description', 'Description must not exceed 5000 characters');
    }
  }

  if (errors.hasErrors()) {
    errors.throw('Invalid system data');
  }
}

/**
 * Validate data for updating a system
 */
export function validateUpdateSystem(input: UpdateSystemInput): void {
  const errors = new ErrorCollector();

  // Name validation (if provided)
  if (input.name !== undefined) {
    if (!input.name) {
      errors.add('name', 'System name cannot be empty');
    } else if (!isValidLength(input.name, 1, 255)) {
      errors.add('name', 'System name must be between 1 and 255 characters');
    }
  }

  // Description validation (if provided)
  if (input.description !== undefined && input.description) {
    if (!isValidLength(input.description, 0, 5000)) {
      errors.add('description', 'Description must not exceed 5000 characters');
    }
  }

  // At least one field must be provided
  if (input.name === undefined && input.description === undefined) {
    errors.add('_general', 'At least one field must be provided for update');
  }

  if (errors.hasErrors()) {
    errors.throw('Invalid update data');
  }
}

// ============================================================================
// ACTION VALIDATION
// ============================================================================

/**
 * Validate ActionStep array
 */
function validateActionSteps(steps: ActionStep[]): string | null {
  if (!Array.isArray(steps)) {
    return 'Steps must be an array';
  }

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    
    if (!step.step_number || !isPositiveInteger(step.step_number)) {
      return `Step ${i + 1}: step_number must be a positive integer`;
    }
    
    if (!step.instruction || typeof step.instruction !== 'string') {
      return `Step ${i + 1}: instruction is required and must be a string`;
    }
    
    if (!isValidLength(step.instruction, 1, 2000)) {
      return `Step ${i + 1}: instruction must be between 1 and 2000 characters`;
    }
  }

  return null;
}

/**
 * Validate ActionScreenshotRef array
 */
function validateActionScreenshots(screenshots: ActionScreenshotRef[]): string | null {
  if (!Array.isArray(screenshots)) {
    return 'Screenshots must be an array';
  }

  for (let i = 0; i < screenshots.length; i++) {
    const screenshot = screenshots[i];
    
    if (!screenshot.screenshot_id || !isPositiveInteger(screenshot.screenshot_id)) {
      return `Screenshot ${i + 1}: screenshot_id must be a positive integer`;
    }
    
    if (!isPositiveInteger(screenshot.order)) {
      return `Screenshot ${i + 1}: order must be a positive integer`;
    }
  }

  return null;
}

/**
 * Validate data for creating a new action
 */
export function validateCreateAction(input: CreateActionInput): void {
  const errors = new ErrorCollector();

  // Must have either system_id OR practice_group_id
  if (!input.system_id && !input.practice_group_id) {
    errors.add('_general', 'Either system_id or practice_group_id is required');
  }

  // System ID validation (if provided)
  if (input.system_id !== undefined) {
    if (!isPositiveInteger(input.system_id)) {
      errors.add('system_id', 'System ID must be a positive integer');
    }
  }

  // Practice Group ID validation (if provided)
  if (input.practice_group_id !== undefined) {
    if (!isPositiveInteger(input.practice_group_id)) {
      errors.add('practice_group_id', 'Practice group ID must be a positive integer');
    }
  }

  // Title validation
  if (!input.title) {
    errors.add('title', 'Action title is required');
  } else if (!isValidLength(input.title, 1, 255)) {
    errors.add('title', 'Action title must be between 1 and 255 characters');
  }

  // Description validation (optional)
  if (input.description !== undefined && input.description) {
    if (!isValidLength(input.description, 0, 5000)) {
      errors.add('description', 'Description must not exceed 5000 characters');
    }
  }

  // Display order validation (optional)
  if (input.display_order !== undefined && !Number.isInteger(input.display_order)) {
    errors.add('display_order', 'Display order must be an integer');
  }

  // Steps validation (optional)
  if (input.steps !== undefined && input.steps !== null) {
    const stepsError = validateActionSteps(input.steps);
    if (stepsError) {
      errors.add('steps', stepsError);
    }
  }

  // Screenshots validation (optional)
  if (input.screenshots !== undefined && input.screenshots !== null) {
    const screenshotsError = validateActionScreenshots(input.screenshots);
    if (screenshotsError) {
      errors.add('screenshots', screenshotsError);
    }
  }

  if (errors.hasErrors()) {
    errors.throw('Invalid action data');
  }
}

/**
 * Validate data for updating an action
 */
export function validateUpdateAction(input: UpdateActionInput): void {
  const errors = new ErrorCollector();

  // Title validation (if provided)
  if (input.title !== undefined) {
    if (!input.title) {
      errors.add('title', 'Action title cannot be empty');
    } else if (!isValidLength(input.title, 1, 255)) {
      errors.add('title', 'Action title must be between 1 and 255 characters');
    }
  }

  // Description validation (if provided)
  if (input.description !== undefined && input.description) {
    if (!isValidLength(input.description, 0, 5000)) {
      errors.add('description', 'Description must not exceed 5000 characters');
    }
  }

  // Steps validation (if provided)
  if (input.steps !== undefined && input.steps !== null) {
    const stepsError = validateActionSteps(input.steps);
    if (stepsError) {
      errors.add('steps', stepsError);
    }
  }

  // Screenshots validation (if provided)
  if (input.screenshots !== undefined && input.screenshots !== null) {
    const screenshotsError = validateActionScreenshots(input.screenshots);
    if (screenshotsError) {
      errors.add('screenshots', screenshotsError);
    }
  }

  // At least one field must be provided
  const hasAnyField = 
    input.title !== undefined ||
    input.description !== undefined ||
    input.steps !== undefined ||
    input.screenshots !== undefined;

  if (!hasAnyField) {
    errors.add('_general', 'At least one field must be provided for update');
  }

  if (errors.hasErrors()) {
    errors.throw('Invalid update data');
  }
}

// ============================================================================
// SCREENSHOT VALIDATION
// ============================================================================

/**
 * Validate data for creating a new screenshot
 */
export function validateCreateScreenshot(input: CreateScreenshotInput): void {
  const errors = new ErrorCollector();

  // Action ID validation
  if (!input.action_id) {
    errors.add('action_id', 'Action ID is required');
  } else if (!isPositiveInteger(input.action_id)) {
    errors.add('action_id', 'Action ID must be a positive integer');
  }

  // File path validation
  if (!input.file_path) {
    errors.add('file_path', 'File path is required');
  } else if (!isValidLength(input.file_path, 1, 500)) {
    errors.add('file_path', 'File path must be between 1 and 500 characters');
  }

  // Original filename validation (optional)
  if (input.original_filename !== undefined && input.original_filename) {
    if (!isValidLength(input.original_filename, 1, 255)) {
      errors.add('original_filename', 'Original filename must be between 1 and 255 characters');
    }
  }

  if (errors.hasErrors()) {
    errors.throw('Invalid screenshot data');
  }
}

/**
 * Validate data for updating a screenshot
 */
export function validateUpdateScreenshot(input: UpdateScreenshotInput): void {
  const errors = new ErrorCollector();

  // At least one field must be provided
  if (input.ocr_data === undefined && input.vision_data === undefined) {
    errors.add('_general', 'At least one field must be provided for update');
  }

  // Note: OCR and Vision data structures are validated by TypeScript types
  // No runtime validation needed here (trusting Vision API output)

  if (errors.hasErrors()) {
    errors.throw('Invalid update data');
  }
}

// ============================================================================
// QUERY OPTIONS VALIDATION
// ============================================================================

/**
 * Validate and sanitize query options
 * Returns sanitized options with defaults
 */
export function validateQueryOptions(options: any = {}): {
  limit: number;
  offset: number;
  orderBy: string;
  orderDirection: 'ASC' | 'DESC';
} {
  const limit = Math.min(Math.max(1, parseInt(options.limit) || 50), 100);
  const offset = Math.max(0, parseInt(options.offset) || 0);
  const orderBy = options.orderBy || 'id';
  const orderDirection = options.orderDirection === 'ASC' ? 'ASC' : 'DESC';

  return { limit, offset, orderBy, orderDirection };
}

// ============================================================================
// DEPARTMENT VALIDATION
// ============================================================================

/**
 * Validate data for creating a new department
 */
export function validateCreateDepartment(input: any): void {
  const errors = new ErrorCollector();

  // System ID validation
  if (!input.system_id) {
    errors.add('system_id', 'System ID is required');
  } else if (!isPositiveInteger(input.system_id)) {
    errors.add('system_id', 'System ID must be a positive integer');
  }

  // Name validation
  if (!input.name) {
    errors.add('name', 'Department name is required');
  } else if (!isValidLength(input.name, 1, 255)) {
    errors.add('name', 'Department name must be between 1 and 255 characters');
  }

  // Description validation (optional)
  if (input.description !== undefined && input.description) {
    if (!isValidLength(input.description, 0, 5000)) {
      errors.add('description', 'Description must not exceed 5000 characters');
    }
  }

  // Display order validation (optional)
  if (input.display_order !== undefined && !Number.isInteger(input.display_order)) {
    errors.add('display_order', 'Display order must be an integer');
  }

  if (errors.hasErrors()) {
    errors.throw('Invalid department data');
  }
}

/**
 * Validate data for updating a department
 */
export function validateUpdateDepartment(input: any): void {
  const errors = new ErrorCollector();

  // Name validation (if provided)
  if (input.name !== undefined) {
    if (!input.name) {
      errors.add('name', 'Department name cannot be empty');
    } else if (!isValidLength(input.name, 1, 255)) {
      errors.add('name', 'Department name must be between 1 and 255 characters');
    }
  }

  // Description validation (if provided)
  if (input.description !== undefined && input.description) {
    if (!isValidLength(input.description, 0, 5000)) {
      errors.add('description', 'Description must not exceed 5000 characters');
    }
  }

  // Display order validation (if provided)
  if (input.display_order !== undefined && !Number.isInteger(input.display_order)) {
    errors.add('display_order', 'Display order must be an integer');
  }

  // At least one field must be provided
  const hasAnyField =
    input.name !== undefined ||
    input.description !== undefined ||
    input.display_order !== undefined;

  if (!hasAnyField) {
    errors.add('_general', 'At least one field must be provided for update');
  }

  if (errors.hasErrors()) {
    errors.throw('Invalid update data');
  }
}

// ============================================================================
// PRACTICE GROUP VALIDATION
// ============================================================================

/**
 * Validate data for creating a new practice group
 */
export function validateCreatePracticeGroup(input: any): void {
  const errors = new ErrorCollector();

  // Department ID validation
  if (!input.department_id) {
    errors.add('department_id', 'Department ID is required');
  } else if (!isPositiveInteger(input.department_id)) {
    errors.add('department_id', 'Department ID must be a positive integer');
  }

  // Name validation
  if (!input.name) {
    errors.add('name', 'Practice group name is required');
  } else if (!isValidLength(input.name, 1, 255)) {
    errors.add('name', 'Practice group name must be between 1 and 255 characters');
  }

  // Description validation (optional)
  if (input.description !== undefined && input.description) {
    if (!isValidLength(input.description, 0, 5000)) {
      errors.add('description', 'Description must not exceed 5000 characters');
    }
  }

  // Display order validation (optional)
  if (input.display_order !== undefined && !Number.isInteger(input.display_order)) {
    errors.add('display_order', 'Display order must be an integer');
  }

  if (errors.hasErrors()) {
    errors.throw('Invalid practice group data');
  }
}

/**
 * Validate data for updating a practice group
 */
export function validateUpdatePracticeGroup(input: any): void {
  const errors = new ErrorCollector();

  // Name validation (if provided)
  if (input.name !== undefined) {
    if (!input.name) {
      errors.add('name', 'Practice group name cannot be empty');
    } else if (!isValidLength(input.name, 1, 255)) {
      errors.add('name', 'Practice group name must be between 1 and 255 characters');
    }
  }

  // Description validation (if provided)
  if (input.description !== undefined && input.description) {
    if (!isValidLength(input.description, 0, 5000)) {
      errors.add('description', 'Description must not exceed 5000 characters');
    }
  }

  // Display order validation (if provided)
  if (input.display_order !== undefined && !Number.isInteger(input.display_order)) {
    errors.add('display_order', 'Display order must be an integer');
  }

  // At least one field must be provided
  const hasAnyField =
    input.name !== undefined ||
    input.description !== undefined ||
    input.display_order !== undefined;

  if (!hasAnyField) {
    errors.add('_general', 'At least one field must be provided for update');
  }

  if (errors.hasErrors()) {
    errors.throw('Invalid update data');
  }
}

// ============================================================================
// ACTION SEQUENCE VALIDATION
// ============================================================================

/**
 * Validate data for creating a new action sequence
 */
export function validateCreateActionSequence(input: any): void {
  const errors = new ErrorCollector();

  // Practice Group ID validation
  if (!input.practice_group_id) {
    errors.add('practice_group_id', 'Practice group ID is required');
  } else if (!isPositiveInteger(input.practice_group_id)) {
    errors.add('practice_group_id', 'Practice group ID must be a positive integer');
  }

  // Name validation
  if (!input.name) {
    errors.add('name', 'Sequence name is required');
  } else if (!isValidLength(input.name, 1, 255)) {
    errors.add('name', 'Sequence name must be between 1 and 255 characters');
  }

  // Description validation (optional)
  if (input.description !== undefined && input.description) {
    if (!isValidLength(input.description, 0, 5000)) {
      errors.add('description', 'Description must not exceed 5000 characters');
    }
  }

  if (errors.hasErrors()) {
    errors.throw('Invalid action sequence data');
  }
}

/**
 * Validate data for updating an action sequence
 */
export function validateUpdateActionSequence(input: any): void {
  const errors = new ErrorCollector();

  // Name validation (if provided)
  if (input.name !== undefined) {
    if (!input.name) {
      errors.add('name', 'Sequence name cannot be empty');
    } else if (!isValidLength(input.name, 1, 255)) {
      errors.add('name', 'Sequence name must be between 1 and 255 characters');
    }
  }

  // Description validation (if provided)
  if (input.description !== undefined && input.description) {
    if (!isValidLength(input.description, 0, 5000)) {
      errors.add('description', 'Description must not exceed 5000 characters');
    }
  }

  // At least one field must be provided
  if (input.name === undefined && input.description === undefined) {
    errors.add('_general', 'At least one field must be provided for update');
  }

  if (errors.hasErrors()) {
    errors.throw('Invalid update data');
  }
}

/**
 * Validate data for adding action to sequence
 */
export function validateAddActionToSequence(input: any): void {
  const errors = new ErrorCollector();

  // Sequence ID validation
  if (!input.sequence_id) {
    errors.add('sequence_id', 'Sequence ID is required');
  } else if (!isPositiveInteger(input.sequence_id)) {
    errors.add('sequence_id', 'Sequence ID must be a positive integer');
  }

  // Action ID validation
  if (!input.action_id) {
    errors.add('action_id', 'Action ID is required');
  } else if (!isPositiveInteger(input.action_id)) {
    errors.add('action_id', 'Action ID must be a positive integer');
  }

  // Order number validation
  if (!input.order_number) {
    errors.add('order_number', 'Order number is required');
  } else if (!isPositiveInteger(input.order_number)) {
    errors.add('order_number', 'Order number must be a positive integer');
  }

  // Notes validation (optional)
  if (input.notes !== undefined && input.notes) {
    if (!isValidLength(input.notes, 0, 2000)) {
      errors.add('notes', 'Notes must not exceed 2000 characters');
    }
  }

  if (errors.hasErrors()) {
    errors.throw('Invalid sequence action data');
  }
}
