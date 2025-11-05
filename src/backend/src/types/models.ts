/**
 * TechLedger Database Models
 * 
 * EXPLANATION FOR NODE.JS NEWCOMERS:
 * - Interfaces define the "shape" of objects (like a contract)
 * - They provide autocomplete and type checking in your IDE
 * - At runtime, they disappear (TypeScript compiles to JavaScript)
 * - Use them to ensure you're passing the right data to functions
 */

// ============================================================================
// USER MODEL
// ============================================================================

export interface User {
  id: number;
  email: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  email: string;
  name: string;
}

export interface UpdateUserInput {
  email?: string;  // ? means optional
  name?: string;
}

// ============================================================================
// SYSTEM MODEL
// ============================================================================

export interface System {
  id: number;
  user_id: number;
  name: string;
  description: string | null;  // Can be string OR null
  created_at: Date;
  updated_at: Date;
}

export interface CreateSystemInput {
  user_id: number;
  name: string;
  description?: string;
}

export interface UpdateSystemInput {
  name?: string;
  description?: string;
}

// ============================================================================
// ACTION MODEL (with properly typed JSONB fields)
// ============================================================================

/**
 * Structure for individual steps within an action
 * Stored as JSONB in PostgreSQL
 */
export interface ActionStep {
  step_number: number;
  instruction: string;
  screenshot_id?: number;
  notes?: string;
}

/**
 * Screenshot reference stored within action metadata
 * Links to actual screenshot records
 */
export interface ActionScreenshotRef {
  screenshot_id: number;
  order: number;
  caption?: string;
}

export interface Action {
  id: number;
  system_id: number | null;  // Now nullable for backwards compatibility
  practice_group_id: number | null;  // New: primary parent
  title: string;
  description: string | null;
  steps: ActionStep[] | null;  // Array of step objects (JSONB)
  screenshots: ActionScreenshotRef[] | null;  // Array of screenshot refs (JSONB)
  display_order: number;  // New: order within parent
  created_at: Date;
  updated_at: Date;
}

export interface CreateActionInput {
  system_id?: number;  // Optional (legacy)
  practice_group_id?: number;  // Optional but recommended
  title: string;
  description?: string;
  steps?: ActionStep[];
  screenshots?: ActionScreenshotRef[];
  display_order?: number;
}

export interface UpdateActionInput {
  title?: string;
  description?: string;
  steps?: ActionStep[];
  screenshots?: ActionScreenshotRef[];
  display_order?: number;
}

// ============================================================================
// SCREENSHOT MODEL (with properly typed JSONB fields)
// ============================================================================

/**
 * Individual word detected by OCR
 */
export interface OCRWord {
  text: string;
  confidence: number;
  bounding_box?: {
    vertices: Array<{ x: number; y: number }>;
  };
}

/**
 * Complete OCR data structure from Vision API
 */
export interface OCRData {
  full_text: string;
  words: OCRWord[];
  language?: string;
  detected_at: string;  // ISO timestamp
}

/**
 * Additional Vision API analysis data
 */
export interface VisionData {
  labels?: Array<{
    description: string;
    score: number;
  }>;
  text_annotations?: any[];
  safe_search?: {
    adult: string;
    violence: string;
  };
  web_detection?: any;
  processed_at: string;  // ISO timestamp
}

export interface Screenshot {
  id: number;
  action_id: number;
  file_path: string;
  original_filename: string | null;
  ocr_data: OCRData | null;
  vision_data: VisionData | null;
  uploaded_at: Date;
}

export interface CreateScreenshotInput {
  action_id: number;
  file_path: string;
  original_filename?: string;
  ocr_data?: OCRData;
  vision_data?: VisionData;
}

export interface UpdateScreenshotInput {
  ocr_data?: OCRData;
  vision_data?: VisionData;
}

// ============================================================================
// DEPARTMENT MODEL
// ============================================================================

/**
 * Department - organizational sub-unit of a System
 * Example: "Sales Department", "Finance Department"
 */
export interface Department {
  id: number;
  system_id: number;
  name: string;
  description: string | null;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateDepartmentInput {
  system_id: number;
  name: string;
  description?: string;
  display_order?: number;
}

export interface UpdateDepartmentInput {
  name?: string;
  description?: string;
  display_order?: number;
}

// ============================================================================
// PRACTICE GROUP MODEL
// ============================================================================

/**
 * Practice Group - specialized group within a Department
 * Example: Finance → "Accounts Payable", "Accounts Receivable"
 */
export interface PracticeGroup {
  id: number;
  department_id: number;
  name: string;
  description: string | null;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePracticeGroupInput {
  department_id: number;
  name: string;
  description?: string;
  display_order?: number;
}

export interface UpdatePracticeGroupInput {
  name?: string;
  description?: string;
  display_order?: number;
}

// ============================================================================
// ACTION SEQUENCE MODEL (Workflows)
// ============================================================================

/**
 * Action Sequence - ordered workflow/procedure
 * Example: "Complete Lead Creation" = Login → Navigate → Create → Save
 */
export interface ActionSequence {
  id: number;
  practice_group_id: number;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateActionSequenceInput {
  practice_group_id: number;
  name: string;
  description?: string;
}

export interface UpdateActionSequenceInput {
  name?: string;
  description?: string;
}

/**
 * Sequence Action - links an action to a sequence with order
 */
export interface SequenceAction {
  id: number;
  sequence_id: number;
  action_id: number;
  order_number: number;
  notes: string | null;
}

export interface CreateSequenceActionInput {
  sequence_id: number;
  action_id: number;
  order_number: number;
  notes?: string;
}

export interface UpdateSequenceActionInput {
  order_number?: number;
  notes?: string;
}

/**
 * Full sequence with actions included
 */
export interface ActionSequenceWithActions extends ActionSequence {
  actions: Array<{
    action: Action;
    order_number: number;
    notes: string | null;
  }>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Pagination options for list queries
 */
export interface QueryOptions {
  limit?: number;  // Number of records to return (default: 50)
  offset?: number;  // Number of records to skip (default: 0)
  orderBy?: string;  // Column name to sort by
  orderDirection?: 'ASC' | 'DESC';  // Sort direction
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}
