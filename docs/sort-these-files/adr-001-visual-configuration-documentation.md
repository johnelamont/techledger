# ADR-001: Visual Configuration Documentation via Screenshot-to-Structured-Data Pipeline

## Status
Proposed

## Context
Many modern business systems (CRM platforms, workflow engines, no-code/low-code tools) store critical business logic and system behavior as visual configurations rather than traditional code. These configurations represent the "living documentation" of how systems actually work, but they present several documentation challenges:

1. **No Export APIs**: Many systems lack robust APIs for exporting their complete configuration state
2. **UI-Only Access**: Critical business logic is only accessible through visual interfaces
3. **Documentation Drift**: Manual documentation quickly becomes outdated as configurations change
4. **Knowledge Silos**: System behavior knowledge exists only in the minds of administrators or buried in UI screens
5. **Onboarding Difficulty**: New team members struggle to understand complex workflow logic from UI exploration alone

### Real-World Example: Zoho CRM Workflows
During a Zoho CRM debugging session, we developed a methodology to document complex workflows that:
- Had 8+ conditional branches with nested criteria
- Modified fields through multiple field update actions
- Called custom functions
- Triggered notifications
- Had no programmatic export capability

The traditional approaches failed:
- **Screenshots alone**: Not queryable, not version-controllable, not analyzable
- **Manual documentation**: Time-consuming, error-prone, quickly outdated
- **API export**: Not available or incomplete for workflow configurations

### The Opportunity
Large Language Models with vision capabilities (like Claude) can now:
- Parse complex UI screenshots with high accuracy
- Extract structured data from visual representations
- Maintain consistency across multiple similar configurations
- Generate machine-readable output (JSON, YAML, etc.)

This creates a new documentation acquisition pattern that bridges visual-only systems and structured knowledge bases.

## Decision
TechLedger will support **Visual Configuration Documentation** as a first-class documentation acquisition method through:

1. **Screenshot-to-Structured-Data Pipeline**: A workflow for converting UI screenshots into structured, queryable documentation
2. **Importer Plugin Architecture**: Extensible system for creating specialized importers for different platforms
3. **Workflow Entities**: First-class support for documenting workflows, automations, and business rules
4. **Visual Parsers**: AI-assisted tools (MCP servers, scripts) that can extract structure from images

### Core Components

#### 1. Documentation Importers
TechLedger will support a plugin architecture for documentation sources:

```
TechLedger Core
  ├─ Importers/
  │   ├─ ZohoWorkflowImporter (screenshot-based)
  │   ├─ SalesforceFlowImporter (screenshot-based)
  │   ├─ CodeImporter (AST-based)
  │   ├─ APIImporter (OpenAPI/Swagger)
  │   ├─ DatabaseSchemaImporter (SQL DDL)
  │   └─ GenericScreenshotImporter (OCR + AI parsing)
  └─ [other core components]
```

#### 2. Workflow Documentation Schema
Workflows will be documented with:
- **Metadata**: Name, module, trigger type, creation/modification info
- **Triggers**: When the workflow executes (onCreate, onEdit, onFieldModify, etc.)
- **Conditions**: Criteria patterns, field dependencies, logical expressions
- **Actions**: Field updates, function calls, notifications, assignments
- **Impact Analysis**: Which fields are read/modified, which other workflows may be triggered

#### 3. Relationship Graph
Automatically extract and store relationships:
- Field dependencies (which workflows read/write which fields)
- Function calls (which workflows call which functions)
- Trigger chains (how workflows can cascade)
- Cross-module impacts

#### 4. Screenshot-Based Documentation Workflow
Standard process for visual configuration documentation:

1. **Capture Phase**: Screenshot all relevant UI configurations
2. **Parse Phase**: Use AI (Claude Vision API) to extract structured data
3. **Validate Phase**: Verify extracted data completeness and accuracy
4. **Import Phase**: Feed structured data into TechLedger
5. **Enhance Phase**: Add manual annotations (business context, edge cases)
6. **Maintain Phase**: Re-capture periodically, diff changes, update docs

### Implementation Approach

#### Phase 1: Zoho Workflow Support (Proof of Concept)
- Create Zoho Workflow JSON schema (based on our debugging work)
- Implement Zoho Workflow importer
- Integrate with existing zoho-timeline MCP server
- Build basic relationship extraction

#### Phase 2: Generic Screenshot Parser
- Extract common patterns from Zoho implementation
- Create generic screenshot parsing utilities
- Support multiple workflow platforms (Salesforce, Power Automate, etc.)

#### Phase 3: Query & Analysis Features
- Implement workflow-specific queries
  - "What happens when field X changes?"
  - "Which workflows modify field Y?"
  - "Show me the execution chain for event Z"
- Build dependency graphs and visualization
- Add impact analysis tools

#### Phase 4: Version Control & Change Tracking
- Track workflow changes over time
- Diff workflow versions
- Alert on breaking changes
- Generate change documentation

## Consequences

### Positive
1. **Capture Undocumented Systems**: Document systems that previously had no documentation path
2. **Living Documentation**: Screenshots represent actual current state, not outdated documentation
3. **Queryable Knowledge**: Convert visual configurations into searchable, analyzable data
4. **Relationship Discovery**: Automatically build dependency graphs and impact analyses
5. **Version Control**: Track configuration changes like code
6. **Onboarding Acceleration**: New team members can understand complex systems faster
7. **Platform Agnostic**: Works with any system that has a UI, regardless of API availability
8. **AI-Assisted**: Leverage LLM capabilities to reduce manual documentation effort

### Negative
1. **Screenshot Quality Dependency**: Requires clear, high-resolution screenshots
2. **AI Parsing Accuracy**: May require human validation of extracted data
3. **Maintenance Overhead**: Need to re-capture when configurations change
4. **Initial Setup Effort**: Creating importers for new platforms requires development work
5. **Cost**: AI parsing (Claude API) has usage costs
6. **Not Real-Time**: Documentation is point-in-time snapshot, not live data

### Neutral
1. **New Workflow Pattern**: Teams need to learn screenshot-to-structured-data process
2. **Storage Requirements**: Structured workflow data adds to database size
3. **Schema Evolution**: Workflow schemas will evolve as we support more platforms

## Alternatives Considered

### Alternative 1: Manual Documentation Only
**Rejected because:**
- Too time-consuming and error-prone
- Documentation drift is inevitable
- Not scalable for complex systems with many workflows

### Alternative 2: Wait for Vendor APIs
**Rejected because:**
- Many vendors won't provide comprehensive export APIs
- Can't document systems we don't control
- Delays documentation of critical business logic

### Alternative 3: Screen Recording + Video Analysis
**Rejected because:**
- Videos are harder to parse than static screenshots
- More expensive to process
- Less precise for extracting structured data
- Storage-intensive

### Alternative 4: Web Scraping Automation
**Considered but deprioritized because:**
- Requires maintenance as UIs change
- More brittle than screenshot + AI parsing
- May violate terms of service
- Potential future addition for specific platforms

## Implementation Notes

### Zoho Workflow JSON Schema Example
Based on our debugging work, here's the core schema structure:

```json
{
  "workflow_name": "string",
  "module": "string",
  "trigger": {
    "when": "string",
    "modified_fields": [
      {
        "field": "string",
        "modification": "string"
      }
    ],
    "repeat_on_modification": "boolean"
  },
  "conditions": [
    {
      "condition_number": "integer",
      "criteria": [
        {
          "number": "integer",
          "field": "string",
          "operator": "string",
          "value": "string|null"
        }
      ],
      "criteria_pattern": "string",
      "actions": {
        "instant_actions": [],
        "scheduled_actions": []
      }
    }
  ]
}
```

### Action Types Supported
- Field Update (with field name, value, empty flags)
- Function Call (with function name)
- Assign Owner (with assignment rule)
- Zoho Cliq Notification (with message, recipients)
- Email Alert
- Webhook
- Custom Actions (extensible)

### Integration Points
- **zoho-timeline MCP server**: Screenshot capture automation
- **Claude Vision API**: Screenshot parsing
- **TechLedger Core**: Data storage and query engine
- **Version Control (Git)**: Track workflow JSON changes over time

## References
- [Architecture Decision Records](https://github.com/joelparkerhenderson/architecture-decision-record)
- [Zoho CRM Workflow Documentation](https://www.zoho.com/crm/help/workflow/)
- [Claude Vision API](https://docs.anthropic.com/claude/docs/vision)
- [TechLedger zoho-timeline MCP server](../technical/mcp-servers.md) (to be documented)

## Revision History
- 2025-01-XX: Initial draft (based on Zoho workflow debugging session)
- Status: Proposed
