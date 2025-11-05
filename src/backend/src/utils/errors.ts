/**
 * TechLedger Error Handling Utilities
 * 
 * EXPLANATION FOR NODE.JS NEWCOMERS:
 * - Custom Error classes let you distinguish between different error types
 * - Express can catch these and send appropriate HTTP status codes
 * - Always throw specific errors (not generic Error) for better debugging
 */

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

/**
 * Base class for all TechLedger errors
 * Extends the built-in Error class
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;  // Mark as expected error (not bugs)
    
    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 - Resource not found in database
 * Example: User with ID 999 doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404);
  }
}

/**
 * 400 - Invalid input data
 * Example: Missing required field, invalid email format
 */
export class ValidationError extends AppError {
  public errors: Record<string, string>;

  constructor(message: string, errors: Record<string, string> = {}) {
    super(message, 400);
    this.errors = errors;
  }
}

/**
 * 409 - Resource already exists
 * Example: User with email already registered
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

/**
 * 500 - Database operation failed
 * Example: Connection lost, query timeout
 */
export class DatabaseError extends AppError {
  public originalError?: Error;

  constructor(message: string, originalError?: Error) {
    super(message, 500);
    this.originalError = originalError;
  }
}

/**
 * 403 - User doesn't have permission
 * Example: Trying to update another user's system
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'You do not have permission to perform this action') {
    super(message, 403);
  }
}

// ============================================================================
// ERROR HANDLER FUNCTION
// ============================================================================

/**
 * Handle PostgreSQL-specific errors and convert to AppError
 * 
 * COMMON POSTGRES ERROR CODES:
 * - 23505: unique_violation (duplicate key)
 * - 23503: foreign_key_violation (referenced record doesn't exist)
 * - 23502: not_null_violation (required field missing)
 */
export function handleDatabaseError(error: any, context?: string): never {
  // Check if it's a Postgres error (has 'code' property)
  if (error.code) {
    switch (error.code) {
      case '23505': // Unique constraint violation
        throw new ConflictError(
          `${context || 'Record'} already exists. ${error.detail || ''}`
        );
      
      case '23503': // Foreign key violation
        throw new ValidationError(
          `Referenced record does not exist. ${error.detail || ''}`,
          { foreign_key: error.detail || 'Invalid reference' }
        );
      
      case '23502': // Not null violation
        const column = error.column || 'unknown';
        throw new ValidationError(
          `Missing required field: ${column}`,
          { [column]: 'This field is required' }
        );
      
      default:
        // Unknown database error
        throw new DatabaseError(
          `Database operation failed: ${context || 'Unknown operation'}`,
          error
        );
    }
  }

  // Not a database error, rethrow as-is
  throw error;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Safely parse JSONB columns from database
 * Returns null if parsing fails (instead of throwing)
 */
export function safeJSONParse<T>(value: any): T | null {
  if (value === null || value === undefined) {
    return null;
  }

  // Already parsed (pg library sometimes does this)
  if (typeof value === 'object') {
    return value as T;
  }

  // Need to parse string
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return null;
  }
}

/**
 * Convert JSONB data to string for database insertion
 * Returns NULL for undefined/null values
 */
export function stringifyJSON(value: any): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  try {
    return JSON.stringify(value);
  } catch (error) {
    console.error('Failed to stringify JSON:', error);
    return null;
  }
}

/**
 * Assert that a value is defined (not null/undefined)
 * Throws NotFoundError if value is missing
 */
export function assertExists<T>(
  value: T | null | undefined,
  resource: string,
  identifier?: string | number
): asserts value is T {
  if (value === null || value === undefined) {
    throw new NotFoundError(resource, identifier);
  }
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}
