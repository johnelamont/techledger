# Update for: technical/data-models.md

## New Data Models to Add:

### Workflow Entity

**Purpose:** Store workflow/automation configuration as documentation

```typescript
interface Workflow {
  id: string;                    // Unique identifier
  name: string;                  // Workflow name
  module: string;                // Module/component it operates on
  system: string;                // Source system (e.g., "Zoho CRM", "Salesforce")
  description?: string;          // Optional description
  
  trigger: WorkflowTrigger;      // What causes execution
  conditions: WorkflowCondition[]; // When to execute actions
  
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  version: number;               // Version number for change tracking
  
  // Metadata
  tags?: string[];
  project_id?: string;
  documentation_url?: string;
  source_screenshots?: string[]; // Paths to original screenshots
}
```

### WorkflowTrigger

```typescript
interface WorkflowTrigger {
  type: TriggerType;
  description: string;
  
  // For field modification triggers
  modified_fields?: ModifiedField[];
  repeat_on_modification?: boolean;
}

enum TriggerType {
  ON_CREATE = "onCreate",
  ON_EDIT = "onEdit", 
  ON_CREATE_OR_EDIT = "onCreateOrEdit",
  ON_FIELD_MODIFY = "onFieldModify",
  SCHEDULED = "scheduled",
  MANUAL = "manual",
  WEBHOOK = "webhook"
}

interface ModifiedField {
  field: string;
  modification: string; // "is modified to any value", "is modified to X", etc.
}
```

### WorkflowCondition

```typescript
interface WorkflowCondition {
  condition_number: number;
  criteria: Criteria[];
  criteria_pattern?: string;     // Logical expression like "((1 and 2) or 3)"
  note?: string;                 // e.g., "This rule will be executed for all leads"
  
  actions: WorkflowActions;
}

interface Criteria {
  number: number;                // Position in criteria list
  field: string;                 // Field name
  operator: CriteriaOperator;
  value?: string | number | boolean | null;
}

enum CriteriaOperator {
  IS = "IS",
  IS_NOT = "ISN'T", 
  IS_EMPTY = "IS EMPTY",
  IS_NOT_EMPTY = "IS NOT EMPTY",
  CONTAINS = "CONTAINS",
  DOESNT_CONTAIN = "DOESN'T CONTAIN",
  STARTS_WITH = "STARTS WITH",
  ENDS_WITH = "ENDS WITH",
  IS_BEFORE = "IS BEFORE",
  IS_AFTER = "IS AFTER",
  // ... other operators
}
```

### WorkflowActions

```typescript
interface WorkflowActions {
  instant_actions: Action[];
  scheduled_actions: ScheduledAction[];
}

interface Action {
  type: ActionType;
  // Action-specific data (polymorphic)
  [key: string]: any;
}

enum ActionType {
  FIELD_UPDATE = "Field Update",
  FUNCTION = "Function",
  ASSIGN_OWNER = "Assign Owner",
  NOTIFICATION = "Notification",
  WEBHOOK = "Webhook",
  EMAIL = "Email",
  CREATE_RECORD = "Create Record",
  UPDATE_RECORD = "Update Record",
  // ... extensible for new action types
}

// Specific action types:

interface FieldUpdateAction extends Action {
  type: ActionType.FIELD_UPDATE;
  updates: FieldUpdate[];
}

interface FieldUpdate {
  name: string;                  // Name of the field update configuration
  module: string;
  field: string;                 // Actual field being updated
  value: any;
  field_type?: string;           // "checkbox", "text", "number", etc.
  set_as_empty: boolean;
  calculation?: {
    operator: string;            // "plus", "minus", etc.
    amount: number;
    unit: string;                // "days", "hours", etc.
  };
}

interface FunctionAction extends Action {
  type: ActionType.FUNCTION;
  function_name: string;
  parameters?: Record<string, any>;
}

interface AssignOwnerAction extends Action {
  type: ActionType.ASSIGN_OWNER;
  assignment_rule: string;
}

interface NotificationAction extends Action {
  type: ActionType.NOTIFICATION;
  notification_name?: string;
  message: string;
  notify_to: string;
  users?: string[];
  channels?: string[];
}

interface ScheduledAction {
  action: Action;
  schedule: {
    delay: number;
    unit: string;                // "minutes", "hours", "days"
    condition?: string;
  };
}
```

### WorkflowRelationship

**Purpose:** Track dependencies between workflows and other entities

```typescript
interface WorkflowRelationship {
  id: string;
  workflow_id: string;
  relationship_type: RelationshipType;
  
  // What this workflow relates to
  target_type: string;           // "field", "function", "workflow", "module"
  target_id?: string;            // ID if target is a documented entity
  target_name: string;           // Name of the target
  
  // How it relates
  action: string;                // "reads", "writes", "calls", "triggers"
  
  // Additional context
  context?: {
    condition_number?: number;
    action_index?: number;
    field_update_name?: string;
  };
}

enum RelationshipType {
  FIELD_DEPENDENCY = "field_dependency",    // Workflow reads field
  FIELD_MODIFICATION = "field_modification", // Workflow writes field
  FUNCTION_CALL = "function_call",          // Workflow calls function
  WORKFLOW_TRIGGER = "workflow_trigger",    // Workflow may trigger another
  MODULE_INTERACTION = "module_interaction" // Workflow spans modules
}
```

### WorkflowVersion

**Purpose:** Track workflow changes over time

```typescript
interface WorkflowVersion {
  id: string;
  workflow_id: string;
  version_number: number;
  
  // Snapshot of workflow at this version
  workflow_snapshot: Workflow;
  
  // Change metadata
  changed_at: Date;
  changed_by?: string;
  change_description?: string;
  change_type: ChangeType;
  
  // What changed
  diff?: {
    added: string[];
    removed: string[];
    modified: string[];
  };
}

enum ChangeType {
  CREATED = "created",
  MODIFIED = "modified", 
  DELETED = "deleted",
  ACTIVATED = "activated",
  DEACTIVATED = "deactivated"
}
```

### DocumentationImport

**Purpose:** Track documentation import operations

```typescript
interface DocumentationImport {
  id: string;
  import_date: Date;
  importer_type: string;         // "ZohoWorkflowImporter", "GenericScreenshot", etc.
  source_system: string;         // "Zoho CRM", "Salesforce", etc.
  
  // Import inputs
  source_files: string[];        // Screenshot paths, file paths, URLs
  import_config?: Record<string, any>;
  
  // Import results
  status: ImportStatus;
  entities_created: number;
  entities_updated: number;
  entities_failed: number;
  
  // Errors and warnings
  errors?: ImportError[];
  warnings?: ImportWarning[];
  
  // What was imported
  imported_workflows?: string[]; // IDs of workflows created/updated
  
  completed_at?: Date;
}

enum ImportStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
  PARTIALLY_COMPLETED = "partially_completed"
}

interface ImportError {
  file?: string;
  entity?: string;
  error_type: string;
  message: string;
  details?: any;
}

interface ImportWarning {
  file?: string;
  entity?: string;
  warning_type: string;
  message: string;
}
```

---

## Relationship to Existing Models:

### Integration with Component/System Models

If TechLedger already has Component or System models, workflows should link to them:

```typescript
interface Component {
  // ... existing fields ...
  workflows?: Workflow[];        // Workflows associated with this component
}

interface System {
  // ... existing fields ...
  workflows?: Workflow[];        // All workflows in this system
  modules?: Module[];
}

interface Module {
  id: string;
  name: string;
  system_id: string;
  workflows?: Workflow[];        // Workflows operating on this module
}
```

### Integration with Field Documentation

If fields are documented entities:

```typescript
interface Field {
  // ... existing fields ...
  
  // Workflows that interact with this field
  read_by_workflows?: WorkflowRelationship[]; // Workflows that read this field
  modified_by_workflows?: WorkflowRelationship[]; // Workflows that write this field
}
```

### Integration with Function Documentation

If functions are documented entities:

```typescript
interface Function {
  // ... existing fields ...
  
  // Workflows that call this function
  called_by_workflows?: WorkflowRelationship[];
}
```

---

## Database Schema Considerations:

### Indexes Needed:
- `workflows.module` - for filtering by module
- `workflows.system` - for filtering by system
- `workflow_relationships.workflow_id` - for dependency queries
- `workflow_relationships.target_name` - for reverse lookups
- `workflow_versions.workflow_id, workflow_versions.version_number` - for version history

### Performance:
- Criteria patterns and actions stored as JSON/JSONB for flexibility
- Consider denormalization for frequently accessed relationships
- Cache dependency graphs for complex workflows

### Data Validation:
- Validate criteria_pattern is well-formed logical expression
- Validate action types match expected schema
- Ensure workflow names are unique within module/system
- Validate relationship referential integrity
