# Update for: technical/architecture.md

## New Architectural Components to Add:

---

## Documentation Acquisition Layer

### Overview
TechLedger supports multiple documentation sources through an extensible importer architecture. This enables documentation of systems regardless of whether they provide APIs, have exportable formats, or exist only as visual configurations.

### Importer Plugin Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TechLedger Core                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Documentation Storage                      │  │
│  │  (Workflows, Components, APIs, Schemas, etc.)        │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ▲                                   │
│                          │                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Importer Plugin Registry                    │  │
│  │  - Plugin discovery                                   │  │
│  │  - Validation                                         │  │
│  │  - Error handling                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ▲                                   │
│         ┌────────────────┴────────────────┐                │
│         │                                  │                │
│  ┌──────▼───────┐                  ┌──────▼────────┐      │
│  │  Screenshot  │                  │ Programmatic  │      │
│  │  Importers   │                  │  Importers    │      │
│  └──────────────┘                  └───────────────┘      │
└─────────────────────────────────────────────────────────────┘
         │                                    │
         │                                    │
    ┌────▼────┐                          ┌───▼────┐
    │ Visual  │                          │  API   │
    │ Sources │                          │ Sources│
    └─────────┘                          └────────┘
```

### Importer Types

#### 1. Screenshot-Based Importers
Parse visual UI representations to extract structured documentation.

**Use cases:**
- Workflow configurations (Zoho, Salesforce, Power Automate)
- Form builders
- Report designers
- Dashboard configurations
- Systems without export APIs

**Technology:**
- Claude Vision API for image parsing
- OCR for text extraction
- Pattern recognition for UI element identification
- Structured output generation (JSON)

**Example Flow:**
```
Screenshot Upload
    ↓
AI Vision Parsing (Claude)
    ↓
Structured Data Extraction
    ↓
Schema Validation
    ↓
Entity Creation (Workflow, Component, etc.)
    ↓
Relationship Extraction
    ↓
Documentation Storage
```

#### 2. API-Based Importers
Extract documentation from API specifications and responses.

**Examples:**
- OpenAPI/Swagger importers
- GraphQL schema importers
- REST API discovery
- SOAP WSDL parsing

#### 3. Code-Based Importers
Analyze source code to extract documentation.

**Examples:**
- AST (Abstract Syntax Tree) parsing
- Comment/docstring extraction
- Type signature analysis
- Dependency graph building

#### 4. Schema-Based Importers
Import database schemas and data models.

**Examples:**
- SQL DDL parsing
- NoSQL schema extraction
- ORM model introspection
- Data dictionary imports

---

## Workflow Documentation Architecture

### Workflow as First-Class Entity

Workflows are documented as primary entities with full lifecycle support:

```typescript
┌─────────────────────────────────────────────────────────┐
│                    Workflow Entity                       │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Core Attributes                                  │  │
│  │  - ID, Name, Module, System                       │  │
│  │  - Trigger configuration                          │  │
│  │  - Conditions & criteria patterns                 │  │
│  │  - Actions (instant & scheduled)                  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Relationships                                    │  │
│  │  - Field dependencies (reads)                     │  │
│  │  - Field modifications (writes)                   │  │
│  │  - Function calls                                 │  │
│  │  - Workflow triggers (cascades)                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Version Control                                  │  │
│  │  - Version history                                │  │
│  │  - Change tracking                                │  │
│  │  - Diff capability                                │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Relationship Graph Engine

Automatically build and maintain relationship graphs between workflows and other entities:

```
┌──────────────────────────────────────────────────────────┐
│          Relationship Graph Engine                        │
│                                                           │
│  ┌─────────────┐      ┌──────────────┐                  │
│  │   Fields    │◄─────┤ Dependencies │                  │
│  └─────────────┘      └──────────────┘                  │
│         ▲                     │                           │
│         │                     │                           │
│         │            ┌────────▼────────┐                 │
│         │            │   Workflows     │                 │
│         │            └────────┬────────┘                 │
│         │                     │                           │
│         │                     ▼                           │
│  ┌──────┴──────┐      ┌──────────────┐                  │
│  │ Modifications│◄─────┤  Functions   │                  │
│  └─────────────┘      └──────────────┘                  │
│                                                           │
│  Capabilities:                                            │
│  - Impact analysis ("what uses field X?")                │
│  - Trigger chain visualization                           │
│  - Circular dependency detection                         │
│  - Breaking change identification                        │
└──────────────────────────────────────────────────────────┘
```

### Query Engine Enhancements

Add workflow-specific query capabilities:

```sql
-- Example queries (conceptual SQL)

-- What workflows modify a field?
SELECT * FROM workflows w
JOIN workflow_relationships wr ON w.id = wr.workflow_id
WHERE wr.target_name = 'Lead_Status' 
  AND wr.action = 'writes';

-- What happens when a lead is created?
SELECT * FROM workflows w
WHERE w.module = 'Leads' 
  AND w.trigger->>'type' = 'onCreate'
ORDER BY w.name;

-- Show execution chain for field change
WITH RECURSIVE workflow_chain AS (
  -- Base case: workflows triggered by field change
  SELECT w.*, 1 as depth
  FROM workflows w
  WHERE w.trigger->>'type' = 'onFieldModify'
    AND w.trigger->'modified_fields' @> '[{"field": "Territory"}]'
  
  UNION ALL
  
  -- Recursive case: workflows triggered by previous workflows
  SELECT w.*, wc.depth + 1
  FROM workflows w
  JOIN workflow_relationships wr ON w.id = wr.workflow_id
  JOIN workflow_chain wc ON wr.target_id = wc.id
  WHERE wr.relationship_type = 'workflow_trigger'
    AND wc.depth < 10  -- Prevent infinite recursion
)
SELECT * FROM workflow_chain ORDER BY depth, name;
```

---

## Integration with Existing Architecture

### If Component Model Exists:

```typescript
// Extend Component to include workflows
interface Component {
  // ... existing fields ...
  
  workflows: Workflow[];           // Workflows for this component
  workflow_dependencies: {
    reads: string[];               // Fields this component's workflows read
    writes: string[];              // Fields this component's workflows write
    calls: string[];               // Functions this component's workflows call
  };
}
```

### If System Model Exists:

```typescript
// Extend System to include workflow metadata
interface System {
  // ... existing fields ...
  
  workflow_stats: {
    total_workflows: number;
    active_workflows: number;
    workflows_by_module: Record<string, number>;
    workflows_by_trigger: Record<TriggerType, number>;
  };
  
  configuration_exports: {
    last_captured: Date;
    importer_used: string;
    coverage_percentage: number;  // % of workflows documented
  };
}
```

---

## Data Flow Architecture

### Screenshot-to-Documentation Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                  Documentation Pipeline                      │
│                                                              │
│  1. Capture                                                  │
│     └─ Screenshot Tool/MCP Server                           │
│          └─ Save to /inputs/{timestamp}/                    │
│                                                              │
│  2. Parse                                                    │
│     └─ AI Vision Service (Claude)                           │
│          ├─ OCR text extraction                             │
│          ├─ UI element identification                       │
│          └─ Structured data generation                      │
│                                                              │
│  3. Validate                                                 │
│     └─ Schema Validator                                      │
│          ├─ Check required fields                           │
│          ├─ Validate criteria patterns                      │
│          └─ Verify action structures                        │
│                                                              │
│  4. Import                                                   │
│     └─ Importer Plugin                                       │
│          ├─ Create/update workflow entities                 │
│          ├─ Extract relationships                           │
│          └─ Build dependency graph                          │
│                                                              │
│  5. Enhance (optional)                                       │
│     └─ Manual Review UI                                      │
│          ├─ Add business context                            │
│          ├─ Fix parsing errors                              │
│          └─ Add cross-references                            │
│                                                              │
│  6. Maintain                                                 │
│     └─ Change Detection                                      │
│          ├─ Periodic re-capture                             │
│          ├─ Diff vs. previous version                       │
│          └─ Update documentation                            │
└─────────────────────────────────────────────────────────────┘
```

### Error Handling & Recovery

```
Parsing Errors:
├─ Low Confidence Parse
│   └─ Flag for human review
│   └─ Partial import with warnings
│
├─ Schema Validation Failure
│   └─ Log specific validation errors
│   └─ Reject import with detailed feedback
│
├─ Duplicate Detection
│   └─ Offer merge/replace/skip options
│   └─ Preserve version history
│
└─ Relationship Conflicts
    └─ Orphaned references
    └─ Circular dependencies
    └─ Log warnings, allow manual resolution
```

---

## Security & Privacy Considerations

### Screenshot Handling
- Screenshots may contain sensitive data (PII, business secrets)
- Store in secure, encrypted storage
- Implement access controls
- Option to redact sensitive information before AI parsing
- Clear data retention policies

### AI API Usage
- Screenshot data sent to Claude API
- Use private API endpoints when available
- Consider self-hosted AI options for highly sensitive data
- Log all AI interactions for audit
- Rate limiting to control costs

### Workflow Documentation Access
- Workflows may reveal business logic competitors could exploit
- Implement role-based access control
- Audit logging for workflow documentation access
- Option to mark workflows as confidential

---

## Performance Considerations

### Screenshot Processing
- Parallel processing for batch imports
- Queue management for large screenshot sets
- Caching of parsed results
- Async processing to avoid blocking UI

### Relationship Graph Building
- Incremental graph updates (don't rebuild entire graph)
- Graph caching with invalidation on workflow changes
- Lazy loading of relationship details
- Denormalization for frequently accessed relationships

### Query Optimization
- Index on workflow.module, workflow.system, workflow.trigger_type
- Index on workflow_relationships for dependency queries
- Materialized views for complex relationship queries
- Full-text search indexing for workflow descriptions

---

## Extensibility Points

### Custom Importer Development

To add a new importer (e.g., for a new workflow platform):

1. **Implement Importer Interface:**
```typescript
interface DocumentationImporter {
  name: string;
  version: string;
  supportedSources: string[];
  
  validate(input: ImportInput): ValidationResult;
  parse(input: ImportInput): ParsedData;
  transform(parsed: ParsedData): Entity[];
  import(entities: Entity[]): ImportResult;
}
```

2. **Register with Plugin Registry:**
```typescript
PluginRegistry.register(new SalesforceFlowImporter());
```

3. **Configure Schema Mapping:**
Map platform-specific concepts to TechLedger's workflow model.

4. **Add Platform-Specific Parsers:**
Custom logic for platform's UI patterns or data formats.

### Custom Relationship Types

Support platform-specific relationship types:

```typescript
enum CustomRelationshipType {
  SALESFORCE_PROCESS_BUILDER = "salesforce_process_builder",
  ZAPIER_ZAP_TRIGGER = "zapier_zap_trigger",
  // ... extensible
}
```

---

## Deployment Considerations

### MCP Server Integration

For systems using MCP (Model Context Protocol) servers:

```
Claude Desktop
    ↓
MCP Server: zoho-timeline
    ├─ Capture screenshots from Zoho UI
    ├─ Parse via Claude Vision API
    └─ Send structured data to TechLedger API
         ↓
    TechLedger Backend
         ├─ Validate & import workflows
         ├─ Build relationship graph
         └─ Store documentation
```

### Standalone Import Tool

For manual or batch imports:

```
CLI Tool: techledger-import
    ├─ Scan directory for screenshots
    ├─ Detect importer type (Zoho, Salesforce, etc.)
    ├─ Parse and validate
    ├─ Generate import report
    └─ Send to TechLedger API
```

### API Endpoints

New endpoints needed:

```
POST   /api/v1/workflows/import
GET    /api/v1/workflows/:id
PUT    /api/v1/workflows/:id
DELETE /api/v1/workflows/:id
GET    /api/v1/workflows/:id/relationships
GET    /api/v1/workflows/:id/versions
GET    /api/v1/workflows/:id/impact-analysis

POST   /api/v1/imports
GET    /api/v1/imports/:id
GET    /api/v1/imports/:id/status

GET    /api/v1/fields/:name/workflows
GET    /api/v1/functions/:name/workflows
```

---

## Future Architecture Enhancements

### Real-Time Monitoring
- Webhook integration to detect workflow changes in source systems
- Automatic re-import triggers
- Change notification system

### AI-Assisted Documentation Enhancement
- Suggest business context based on workflow logic
- Identify similar workflows for consolidation
- Detect potential bugs or anti-patterns
- Generate human-readable workflow descriptions

### Workflow Simulation
- Test workflow execution paths
- Impact analysis before changes
- What-if scenario modeling

### Cross-System Workflow Analysis
- Compare workflows across different CRM instances
- Best practice library
- Workflow templates and patterns
