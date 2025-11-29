# TechLedger Terminology - Workflow Documentation Additions

## Add these terms to the terminology document:

---

## Workflow Documentation Terms

### Workflow
A sequence of automated actions triggered by specific events or conditions in a system. Workflows represent business logic and rules that execute automatically without manual intervention. Also known as: automation, business rule, flow.

**Example:** "A Zoho CRM workflow that assigns leads to sales reps based on territory when a new lead is created."

### Workflow Trigger
The event or condition that causes a workflow to execute.

**Common trigger types:**
- **onCreate**: Executes when a new record is created
- **onEdit**: Executes when a record is modified
- **onFieldModify**: Executes when specific fields are changed
- **Scheduled**: Executes on a time-based schedule
- **Manual**: Executes when explicitly invoked by a user
- **Webhook**: Executes when an external system sends data

**Example:** "This workflow has an onFieldModify trigger for the 'Lead Status' field."

### Condition (Workflow)
A set of criteria that must be met for workflow actions to execute. A single workflow may have multiple conditions, each with its own criteria and actions.

**Example:** "Condition 1 checks if Email is not empty AND Lead Status is 'New'."

### Criteria
Individual tests or checks within a workflow condition. Multiple criteria are combined using logical operators (AND, OR, NOT).

**Example:** "Criteria 1: Lead Source IS 'Website', Criteria 2: Company IS NOT EMPTY"

### Criteria Pattern
A logical expression that defines how multiple criteria are combined to determine if a condition is met.

**Format:** Uses numbers representing criteria positions with logical operators.

**Examples:**
- `(1 and 2)` - Both criteria 1 and 2 must be true
- `((1 or 2) and 3)` - Either criteria 1 or 2 must be true, AND criteria 3 must be true
- `(((1 and 2) or 3) and 4)` - Complex nested logic

### Action (Workflow)
An operation performed by a workflow when its conditions are met.

**Common action types:**
- **Field Update**: Modify field values
- **Function Call**: Execute custom code
- **Notification**: Send messages to users
- **Assign Owner**: Change record ownership
- **Create Record**: Create a new related record
- **Webhook**: Send data to external systems
- **Email**: Send automated emails

### Field Update
A workflow action that modifies one or more field values in a record.

**Properties:**
- Target field
- New value (static, calculated, or from another field)
- Set as empty flag

**Example:** "Field Update: Set 'Lead Status' to 'Qualified' and set 'Qualification Date' to NOW"

### Instant Action
A workflow action that executes immediately when the workflow is triggered and conditions are met.

**Contrast with:** Scheduled Action (delayed execution)

### Scheduled Action
A workflow action that executes after a specified time delay.

**Example:** "Send reminder email 3 days after lead is created"

### Visual Configuration Documentation
The practice of documenting system configurations that exist only in visual/UI form (not as code or exportable data) by converting screenshots into structured, machine-readable formats.

**Also applies to:** Workflows, form builders, report designers, dashboard configurations

### Documentation Importer
A plugin or module that can extract documentation from a specific source (screenshots, APIs, code, etc.) and convert it into TechLedger's internal format.

**Examples:**
- Zoho Workflow Importer (screenshot-based)
- OpenAPI Importer (API specification)
- Code AST Importer (source code analysis)

### Screenshot-to-Structured-Data Pipeline
A documentation workflow that converts UI screenshots into structured, queryable data using AI parsing (typically Claude Vision API).

**Steps:**
1. Capture screenshots
2. Parse with AI
3. Extract structured data
4. Validate
5. Import to documentation system

### Field Dependency
A relationship where a workflow reads or checks the value of a field to make decisions.

**Example:** "The 'Email Validation' workflow has a field dependency on the 'Email' field."

### Field Modification
A relationship where a workflow writes or updates a field value.

**Example:** "The 'Set Lead Type' workflow modifies the 'Lead Type' and 'Brand Source' fields."

### Function Call (Workflow)
A workflow action that invokes a custom function or script.

**Example:** "Call function Leads_FormatPhone to standardize phone number format"

### Impact Analysis
The process of determining what will be affected by a change to a system component (field, function, workflow, etc.).

**Example:** "Impact analysis shows that changing the 'Lead Status' picklist will affect 12 workflows."

### Workflow Execution Chain
The sequence of workflows that may execute as a result of a single triggering event, where one workflow's actions trigger other workflows.

**Example:** 
```
Lead Created 
→ "Format Phone" workflow runs
→ Updates Phone field  
→ Triggers "Update Territory" workflow (onFieldModify: Phone)
→ Updates Territory field
→ Triggers "Assign Owner" workflow (onFieldModify: Territory)
```

### Assignment Rule
A configuration that determines record ownership based on criteria (often used in "Assign Owner" workflow actions).

**Example:** "Based on Assignment Rule: Lead Assignment - US Territory"

### Criteria Operator
The comparison or test applied to a field in a workflow criteria.

**Common operators:**
- IS / ISN'T (equals / not equals)
- IS EMPTY / IS NOT EMPTY
- CONTAINS / DOESN'T CONTAIN
- IS BEFORE / IS AFTER (dates)
- GREATER THAN / LESS THAN (numbers)

### Module (CRM Context)
A major functional area or object type within a CRM system. Workflows typically operate on a specific module.

**Examples:** Leads, Contacts, Accounts, Deals, Cases

### Workflow Version
A snapshot of a workflow's configuration at a specific point in time, used for change tracking and history.

### System Configuration
The collection of settings, workflows, field definitions, layouts, and rules that define how a system behaves. Often stored as UI-based configurations rather than code.

### Living Documentation
Documentation that represents the current, actual state of a system (as opposed to outdated documentation that describes how the system used to work or should work in theory).

**Characteristic:** Generated or extracted directly from the system itself rather than manually written

### Documentation Drift
The phenomenon where documentation becomes outdated as system configurations change but the documentation is not updated to match.

**Solution:** Automated documentation extraction, version control, regular re-capture

### Business Logic (No-Code)
Rules and workflows implemented through visual configuration tools rather than traditional programming code.

**Locations:** Workflow engines, formula fields, validation rules, assignment rules, approval processes

---

## Related Existing Terms (to cross-reference)

If these terms already exist in your terminology, add cross-references:

- **Component** - Link to workflows as "automated components"
- **System** - Link to workflows as "system behavior"
- **API** - Contrast with workflows (declarative vs. programmatic)
- **Version Control** - Applies to workflow documentation
- **Relationship** - Workflows create many types of relationships
- **Query** - Workflow-specific queries are a key use case

---

## Usage Guidelines

### When to use "Workflow" vs "Automation" vs "Business Rule"
- **Workflow**: General term for any automated sequence (preferred in TechLedger)
- **Automation**: Often implies simpler, single-action automations
- **Business Rule**: Emphasizes the business logic aspect
- In TechLedger documentation, use "Workflow" consistently

### Workflow vs Function
- **Workflow**: Declarative, configured through UI, no-code
- **Function**: Programmatic, written in code, requires development
- Note: Workflows often *call* functions as one of their actions

### Configuration vs Code
- **Configuration**: Settings, workflows, rules defined through UI
- **Code**: Traditional programming (functions, scripts, applications)
- TechLedger documents both, but uses different acquisition methods
