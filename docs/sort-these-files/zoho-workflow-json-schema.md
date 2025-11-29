# Zoho Workflow JSON Schema - Reference Example

**Location:** `reference/examples/zoho-workflow-json-schema.md`

## Overview

This document provides the JSON schema and examples for documenting Zoho CRM workflows. This schema was developed through real-world debugging work and represents workflows extracted from screenshot-based documentation.

## Purpose

This schema serves as:
1. A reference for implementing Zoho Workflow importers
2. Validation schema for imported workflow data
3. Example of visual-configuration-to-structured-data transformation
4. Template for other workflow platform schemas

## Core Schema

### Workflow Root Object

```typescript
interface ZohoWorkflow {
  workflow_name: string;              // Display name of the workflow
  module: string;                     // Zoho module (Leads, Contacts, Deals, etc.)
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];    // Array of conditions (can be empty)
}
```

### Workflow Trigger

```typescript
interface WorkflowTrigger {
  when: string;                       // Description of trigger
  
  // For onFieldModify triggers:
  modified_fields?: ModifiedField[];  // Which fields trigger execution
  repeat_on_modification?: boolean;   // Execute every time or once
}

interface ModifiedField {
  field: string;                      // Field name
  modification: string;               // "is modified to any value", "is modified to X", etc.
}
```

**Trigger Types (from `when` field):**

| Description | Interpretation |
|-------------|----------------|
| "This rule will be executed when a lead is **created**." | onCreate |
| "This rule will be executed when a lead is **created** or is **edited** to meet the condition (if any)." | onCreateOrEdit |
| "This rule will be executed whenever a lead is **created** or is **edited** to meet the condition(s) set." | onCreateOrEdit |
| "This rule will be executed when **any of the below fields** are modified as mentioned below." | onFieldModify |

### Workflow Condition

```typescript
interface WorkflowCondition {
  condition_number: number;           // 1-indexed position
  criteria: Criteria[];               // Array of individual criteria
  criteria_pattern: string | null;   // Logical expression or null if no criteria
  note?: string;                      // Optional note (e.g., "This rule will be executed for all leads")
  actions: WorkflowActions;
}
```

**Special Cases:**
- If `criteria` is empty and `note` says "This rule will be executed for all leads", the condition has no restrictions
- `criteria_pattern` can be `null` when criteria array is empty

### Criteria

```typescript
interface Criteria {
  number: number;                     // Position in criteria list (1-indexed)
  field: string;                      // Field API name or display name
  operator: string;                   // See operator table below
  value?: string | null;              // Comparison value (optional for some operators)
}
```

**Common Operators:**

| Operator | Description | Requires Value |
|----------|-------------|----------------|
| IS | Equals | Yes |
| ISN'T | Not equals | Yes |
| IS EMPTY | Field has no value | No |
| IS NOT EMPTY | Field has a value | No |
| CONTAINS | Field contains text | Yes |
| DOESN'T CONTAIN | Field does not contain text | Yes |
| STARTS WITH | Field starts with text | Yes |
| ENDS WITH | Field ends with text | Yes |
| IS | For selections/checkboxes: "Selected" or specific value | Yes |

**Value Formats:**
- **Multiple values:** Comma-separated string (e.g., "Inbound Call, Inbound Email, Chat")
- **Checkbox:** "Selected" or "Not Selected"
- **Empty operator:** value can be null or omitted

### Criteria Pattern

Logical expression using criteria numbers and operators.

**Syntax:**
- Numbers represent criteria positions: `1`, `2`, `3`
- Operators: `and`, `or` (case-insensitive)
- Grouping: Parentheses `(` `)`

**Examples:**

| Pattern | Meaning |
|---------|---------|
| `1` | Only criteria 1 must be true |
| `(1 and 2)` | Both criteria 1 and 2 must be true |
| `(1 or 2)` | Either criteria 1 or 2 must be true |
| `((1 and 2) or 3)` | (1 AND 2) OR 3 |
| `(1 and (2 or 3))` | 1 AND (2 OR 3) |
| `((1 or 2) and (3 or 4))` | (1 OR 2) AND (3 OR 4) |
| `(((1 and 2) and 3) and 4)` | Nested ANDs: 1 AND 2 AND 3 AND 4 |

**Complex Real-World Example:**
```
((((((((1 or 2) or 3) or 4) or 5) and 6) and ((7 or 8) or 9)) and 10)
```

This pattern means:
```
(
  (
    (1 OR 2 OR 3 OR 4 OR 5) 
    AND 6
  )
  AND (7 OR 8 OR 9)
)
AND 10
```

### Workflow Actions

```typescript
interface WorkflowActions {
  instant_actions: Action[];          // Execute immediately
  scheduled_actions: ScheduledAction[]; // Execute after delay (usually empty)
}

type Action = 
  | FieldUpdateAction
  | FunctionAction
  | AssignOwnerAction
  | NotificationAction;
```

### Field Update Action

```typescript
interface FieldUpdateAction {
  type: "Field Update";
  updates: FieldUpdate[];             // Can have multiple field updates
}

interface FieldUpdate {
  name: string;                       // Name of the field update configuration
  module: string;                     // Module (usually same as workflow module)
  field: string;                      // Actual field being updated
  value: any;                         // New value
  field_type?: string;                // "checkbox", "text", "number", "date", etc.
  set_as_empty: boolean;              // true if setting field to empty
  
  // For date/datetime fields with calculations:
  calculation?: {
    operator: string;                 // "plus", "minus"
    amount: number;                   // Numeric amount
    unit: string;                     // "days", "hours", "minutes"
  };
}
```

**Field Value Types:**

| Field Type | Value Format | Example |
|------------|--------------|---------|
| Text | string | "Needs Data" |
| Checkbox | boolean | true |
| Number | string or number | "0" or 0 |
| Date/DateTime | "${EXECUTION_TIME}" or specific date | "${EXECUTION_TIME}" |
| Date with calc | "${EXECUTION_TIME}" + calculation object | See calculation above |
| Empty | "${EMPTY}" | "${EMPTY}" |
| Picklist | string (exact picklist value) | "Inbound Request" |

**Special Values:**
- `${EMPTY}`: Clear the field (set_as_empty should be true)
- `${EXECUTION_TIME}`: Current time when workflow executes

### Function Action

```typescript
interface FunctionAction {
  type: "Function";
  function_name: string;              // Name of Deluge function to call
  parameters?: Record<string, any>;   // Usually not visible in UI
}
```

**Function Name Examples:**
- `Leads_FormatPhone`
- `Lead_VerifyEmailHunterIO`
- `Leads_UpdateStateCountryNA`
- `Lead_OutboundLeadContactDedupl...` (may be truncated in UI)

### Assign Owner Action

```typescript
interface AssignOwnerAction {
  type: "Assign Owner";
  assignment_rule: string;            // Name/description of assignment rule
}
```

**Example:**
```json
{
  "type": "Assign Owner",
  "assignment_rule": "Based on Assignment Rule : Lead As..."
}
```

### Notification Action (Zoho Cliq)

```typescript
interface NotificationAction {
  type: "Zoho Cliq Notification";
  notification_name: string;          // Name of notification config
  message: string;                    // Message text (may include merge fields)
  notify_to: string;                  // Description of recipients
  users: string[];                    // User roles or specific users
}
```

**Example:**
```json
{
  "type": "Zoho Cliq Notification",
  "notification_name": "Notify Leads - Owner, Owner's Manager",
  "message": "Leads - Lead Owner, your Lead cannot be moved...",
  "notify_to": "Users associated with the module - Leads",
  "users": ["Owner's Manager", "Owner"]
}
```

### Scheduled Action

```typescript
interface ScheduledAction {
  action: Action;                     // Same as instant action
  schedule: {
    delay: number;
    unit: string;                     // "minutes", "hours", "days"
    condition?: string;               // Optional additional condition
  };
}
```

## Complete Example: Simple Workflow

```json
{
  "workflow_name": "Leads - Cr - Format Phone",
  "module": "Leads",
  "trigger": {
    "when": "This rule will be executed when a lead is created."
  },
  "conditions": [
    {
      "condition_number": 1,
      "criteria": [
        {
          "number": 1,
          "field": "Phone",
          "operator": "IS NOT EMPTY"
        },
        {
          "number": 2,
          "field": "Company Phone",
          "operator": "IS NOT EMPTY"
        },
        {
          "number": 3,
          "field": "Mobile",
          "operator": "IS NOT EMPTY"
        }
      ],
      "criteria_pattern": "((1 or 2) or 3)",
      "actions": {
        "instant_actions": [
          {
            "type": "Function",
            "function_name": "Leads_FormatPhone"
          }
        ],
        "scheduled_actions": []
      }
    }
  ]
}
```

## Complete Example: Complex Multi-Condition Workflow

```json
{
  "workflow_name": "Leads - CrEd - Set Cadence",
  "module": "Leads",
  "trigger": {
    "when": "This rule will be executed whenever a lead is created or is edited to meet the condition (if any)."
  },
  "conditions": [
    {
      "condition_number": 1,
      "criteria": [
        {
          "number": 1,
          "field": "Lead Status",
          "operator": "ISN'T",
          "value": "Inbound Request, Inbound Qualification"
        },
        {
          "number": 2,
          "field": "Email",
          "operator": "IS EMPTY"
        },
        {
          "number": 3,
          "field": "Phone",
          "operator": "IS NOT EMPTY"
        }
      ],
      "criteria_pattern": "((1 and 2) and 3)",
      "actions": {
        "instant_actions": [
          {
            "type": "Field Update",
            "updates": [
              {
                "name": "Lead - Cadence To Enable to Call Cadence",
                "module": "Leads",
                "field": "Cadence To Enable",
                "value": "Call Cadence",
                "set_as_empty": false
              }
            ]
          }
        ],
        "scheduled_actions": []
      }
    },
    {
      "condition_number": 2,
      "criteria": [
        {
          "number": 1,
          "field": "Lead Status",
          "operator": "IS",
          "value": "Inbound Request"
        },
        {
          "number": 2,
          "field": "Email",
          "operator": "IS NOT EMPTY"
        }
      ],
      "criteria_pattern": "(1 and 2)",
      "actions": {
        "instant_actions": [
          {
            "type": "Field Update",
            "updates": [
              {
                "name": "Leads - Cadence To Enable to Inbound Sales Webform",
                "module": "Leads",
                "field": "Cadence To Enable",
                "value": "Inbound Sales Webform Cadence",
                "set_as_empty": false
              }
            ]
          }
        ],
        "scheduled_actions": []
      }
    }
  ]
}
```

## Complete Example: Field Modification Trigger

```json
{
  "workflow_name": "Leads - Ed - Deduplication Handler",
  "module": "Leads",
  "trigger": {
    "when": "This rule will be executed when any of the below fields are modified as mentioned below.",
    "modified_fields": [
      {
        "field": "Deduplication Checked",
        "modification": "is modified to unselected"
      },
      {
        "field": "Mapsly Territory",
        "modification": "is modified to any value"
      },
      {
        "field": "Trigger Deduplication",
        "modification": "is modified to any value"
      }
    ],
    "repeat_on_modification": true
  },
  "conditions": [
    {
      "condition_number": 1,
      "criteria": [
        {
          "number": 1,
          "field": "Lead Source",
          "operator": "ISN'T",
          "value": "Klenty"
        },
        {
          "number": 2,
          "field": "Deduplication Checked",
          "operator": "IS",
          "value": "Not Selected"
        }
      ],
      "criteria_pattern": "(1 and 2)",
      "actions": {
        "instant_actions": [
          {
            "type": "Field Update",
            "updates": [
              {
                "name": "Leads - Deduplication Checked to TRUE",
                "module": "Leads",
                "field": "Deduplication Checked",
                "value": true,
                "field_type": "checkbox",
                "set_as_empty": false
              }
            ]
          },
          {
            "type": "Assign Owner",
            "assignment_rule": "Based on Assignment Rule : Lead Assignment"
          },
          {
            "type": "Function",
            "function_name": "Lead_InboundLeadContactDeduplic"
          }
        ],
        "scheduled_actions": []
      }
    }
  ]
}
```

## Parsing Guidelines

### From Screenshot to JSON

When parsing Zoho workflow screenshots, follow these extraction rules:

#### 1. Workflow Name and Module
- **Location:** Top of screenshot, typically "{Module} - {Name}" format
- **Example:** "Leads - Cr - Format Phone" → module: "Leads", name: "Leads - Cr - Format Phone"

#### 2. Trigger
- **Location:** "WHEN" section
- **Text pattern:** "This rule will be executed when..."
- **Keywords to identify trigger type:**
  - "created" → onCreate
  - "created or is edited" → onCreateOrEdit
  - "any of the below fields are modified" → onFieldModify

#### 3. Conditions
- **Location:** "CONDITION 1", "CONDITION 2", etc. sections
- **Each condition contains:**
  - Numbered criteria (1, 2, 3, ...)
  - Field name
  - Operator (IS, ISN'T, IS EMPTY, etc.)
  - Value (if applicable)
  - Criteria Pattern at bottom of condition box

#### 4. Actions
- **Location:** "Instant Actions" or "Scheduled Actions" sections
- **Action types identified by label:**
  - "Field Update" → Field Update Action
  - "Function" → Function Action
  - "Assign Owner" → Assign Owner Action
  - "Zoho Cliq Notification" → Notification Action

#### 5. Field Updates Detail
- **Requires second screenshot:** Click on field update name to see detail screen
- **Extract:** Name, Module, Field, Value to be updated, Set as Empty checkbox

### Common Parsing Challenges

1. **Truncated Names:** Field update and function names may be truncated in the UI with "..."
   - Solution: Click through to detail screen to get full name

2. **Complex Criteria Patterns:** Long patterns may wrap or be hard to read
   - Solution: Carefully parse parentheses and operators, validate well-formed expression

3. **Multiple Values:** Picklist/multi-select criteria may have many comma-separated values
   - Solution: Store as single comma-separated string, parse later if needed

4. **Empty Conditions:** Some conditions have no criteria (execute for all records)
   - Solution: Set criteria array to empty, criteria_pattern to null, add note field

5. **Date Calculations:** Date fields may have complex ${EXECUTION_TIME} + calculation
   - Solution: Parse the calculation object separately

## Validation Rules

When validating imported Zoho workflow JSON:

1. **Required Fields:**
   - workflow_name (non-empty string)
   - module (non-empty string)
   - trigger.when (non-empty string)
   - conditions (array, can be empty)

2. **Criteria Pattern Validation:**
   - Must be well-formed logical expression
   - All referenced numbers must exist in criteria array
   - Balanced parentheses
   - Valid operators (and, or)

3. **Action Validation:**
   - Each action must have valid type
   - Field updates must reference actual fields
   - Function names should match known functions (warning only)

4. **Relationship Extraction:**
   - Extract field reads from criteria
   - Extract field writes from field updates
   - Extract function calls from function actions

## Usage in TechLedger

This schema should be used by:

1. **Zoho Workflow Importer:**
   - Validate incoming JSON against this schema
   - Transform to TechLedger's internal Workflow entity
   - Extract relationships for dependency graph

2. **Screenshot Parsers:**
   - Use this schema as target output format
   - Guide AI parsing to extract these specific fields

3. **Documentation:**
   - Reference example for documenting other workflow platforms
   - Template for creating similar schemas

## Future Enhancements

Potential additions to this schema:

1. **Workflow Metadata:**
   - Created date/time
   - Created by user
   - Last modified date/time
   - Active/inactive status
   - Execution order (when multiple workflows compete)

2. **Advanced Triggers:**
   - Scheduled triggers with cron expressions
   - Webhook triggers with URL endpoints
   - Email triggers

3. **Advanced Actions:**
   - Create Task
   - Send Email
   - Call Webhook
   - Update Related Records
   - Approval Process

4. **Error Handling:**
   - What happens if action fails
   - Retry logic
   - Error notifications

## Related Documentation

- [ADR-001: Visual Configuration Documentation](../decisions/adr-001-visual-configuration-documentation.md)
- [Workflow Data Models](../technical/data-models.md)
- [Zoho CRM Workflow Official Documentation](https://www.zoho.com/crm/help/workflow/)
