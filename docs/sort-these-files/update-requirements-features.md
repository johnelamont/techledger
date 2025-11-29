# Update for: product/requirements-features.md

## New Features to Add:

### Documentation Acquisition

#### Visual Configuration Documentation
**Priority:** High  
**Status:** Proposed

**Description:**  
Support for documenting system configurations that exist only in visual/UI form through screenshot-to-structured-data conversion.

**User Stories:**
- As a system administrator, I want to document Zoho CRM workflows so that new team members can understand the business logic
- As a consultant, I want to capture client system configurations so I can maintain accurate documentation
- As a developer, I want to query which workflows modify a specific field so I can assess change impact
- As a technical writer, I want to generate workflow documentation from screenshots so I don't have to manually transcribe complex logic

**Requirements:**
1. Support screenshot upload and parsing via AI (Claude Vision API)
2. Extract structured data from workflow screenshots (triggers, conditions, actions)
3. Store workflows as first-class documentation entities
4. Support multiple workflow platforms (Zoho, Salesforce, Power Automate, etc.)
5. Generate relationship graphs (field dependencies, function calls, trigger chains)
6. Enable workflow-specific queries ("what modifies field X?", "what happens when Y is created?")
7. Track workflow versions and changes over time
8. Diff workflow configurations across versions

**Acceptance Criteria:**
- User can upload workflow screenshots and get structured JSON output
- System correctly identifies: workflow name, module, trigger type, conditions, actions
- Relationship extraction identifies all field reads/writes
- Query engine can answer dependency questions
- Documentation updates when workflows change (via re-capture)

**Dependencies:**
- Claude Vision API integration
- Workflow entity data model
- Relationship graph storage
- Query engine enhancements

**Estimated Complexity:** High

---

### Documentation Importers

#### Plugin Architecture for Documentation Sources
**Priority:** High  
**Status:** Proposed

**Description:**  
Extensible importer system supporting multiple documentation sources (screenshots, APIs, code, databases).

**Requirements:**
1. Define importer plugin interface/contract
2. Support registration of new importers
3. Handle multiple input formats (screenshots, JSON, XML, code files)
4. Validate imported data against schemas
5. Report import errors and warnings
6. Support batch imports
7. Track import history and provenance

**Importer Types (Phase 1):**
- Zoho Workflow Importer (screenshot-based)
- Generic Screenshot Importer (AI-based)
- Code Importer (AST parsing)
- API Documentation Importer (OpenAPI/Swagger)

**Importer Types (Future):**
- Salesforce Flow Importer
- Power Automate Importer
- Database Schema Importer
- Terraform/IaC Importer

---

### Workflow Documentation

#### Workflow as First-Class Entity
**Priority:** High  
**Status:** Proposed

**Description:**  
Workflows are documented entities with full CRUD operations, queries, and relationship tracking.

**Workflow Properties:**
- Name, description, module/component
- Trigger type (onCreate, onEdit, onFieldModify, scheduled, etc.)
- Trigger fields (for field modification triggers)
- Conditions with criteria patterns
- Actions (field updates, function calls, notifications, assignments)
- Created/modified dates
- Version history

**Workflow Queries:**
- List all workflows for a module
- Find workflows that modify field X
- Find workflows triggered by field Y change
- Show execution chain starting from event Z
- Find all workflows calling function F
- Compare workflow versions

**Workflow Relationships:**
- Fields read (dependencies)
- Fields modified (side effects)
- Functions called
- Other workflows potentially triggered
- Notifications sent
- Owner assignment rules used

---

### Impact Analysis

#### Field Dependency Tracking
**Priority:** Medium  
**Status:** Proposed

**Description:**  
Automatically track which workflows read/write which fields to enable impact analysis.

**Features:**
- Build dependency graph for all fields
- Show all workflows that read a field
- Show all workflows that modify a field
- Identify circular dependencies
- Flag breaking changes (field removed/renamed that workflows depend on)
- Generate impact reports before making changes

---

### Change Tracking

#### Workflow Version Control
**Priority:** Medium  
**Status:** Future

**Description:**  
Track workflow configuration changes over time like code changes.

**Features:**
- Store workflow versions
- Diff between versions (visual diff of JSON)
- Change history with timestamps
- Rollback capability (regenerate old version documentation)
- Change notifications
- Integration with Git for workflow JSON files

---

## Updates to Existing Features:

### Search & Query
**Enhancement:** Add workflow-specific search capabilities
- Search by workflow name, module, trigger type
- Search by field dependencies
- Search by function calls
- Full-text search of workflow descriptions and conditions

### Relationship Visualization
**Enhancement:** Add workflow relationship diagrams
- Show workflow execution chains
- Display field dependency graphs
- Visualize module interconnections through workflows

### Export & Reporting
**Enhancement:** Add workflow documentation export
- Export workflow documentation to PDF/Markdown
- Generate workflow diagrams
- Create field impact reports
- Export relationship graphs
