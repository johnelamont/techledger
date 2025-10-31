# ADR 002: Role-Based and Task-Based Navigation Model

**Date:** 2025-10-12  
**Status:** Accepted  
**Deciders:** John Lamont  
**Decision Type:** Architecture - Data Model & User Experience

## Context

TechLedger's core information architecture uses a 6-level hierarchy (System → Department → Practice Group → Action Group → Actions → Transformations) based on the sound principle that business systems are fundamentally about data and transformations. This hierarchy is theoretically correct and maps well to how systems actually work.

However, we identified the "messy middle" problem:

**Large Organizations:**
- Familiar with departments and divisions (Finance → Accounting → Accounts Payable)
- Navigate systems by organizational structure
- Have specialized roles with narrow focus
- Hierarchy navigation makes sense to them

**Small Businesses:**
- Typically 1-10 people wearing multiple hats
- One person might handle sales, accounting, and customer service
- Don't think in departments—think in "What do I need to do today?"
- Task-oriented rather than structure-oriented
- Need to find "how to create an invoice" without understanding organizational hierarchy

**The Tension:**
- Forcing small businesses to navigate a 6-level hierarchy is overwhelming
- Abandoning the hierarchy loses valuable organizational structure for large companies
- Need multiple navigation paths to the same content

**Additional Challenge:**
- Actions (atomic documentation units) can serve multiple purposes
- "Login to Salesforce" is needed by Sales, Support, Accounting, Management
- "Create Invoice" might be part of multiple workflows
- One-to-one mapping between Actions and hierarchy levels is too rigid

**Core Insight:**
People don't navigate hierarchies—they navigate their work. The question isn't "What department am I in?" but "What do I need to accomplish?"

## Decision

**Add Role-Based and Task-Based navigation as a parallel access pattern to the existing hierarchy.**

Implement a many-to-many relationship model:
```
Role ←(many-to-many)→ Task ←(many-to-many)→ Action
```

**Definitions:**

**Role:** A job function or position within an organization
- Examples: "Sales Representative," "Office Manager," "Accountant," "Customer Support Specialist"
- Represents who someone is in the organization
- Small businesses: Few Roles, each person may have multiple
- Large businesses: Many Roles, typically one per person

**Task:** A goal-oriented collection of Actions that accomplishes a business objective
- Examples: "Qualify New Lead," "Process Vendor Payment," "Generate Monthly Report"
- Represents what needs to be accomplished
- Contains ordered Actions that achieve the goal
- Same Task can be relevant to multiple Roles

**Action:** Atomic documentation unit (no change from existing model)
- Examples: "Login to Salesforce," "Create Invoice," "Update Lead Score"
- Represents a specific step in using an application
- Can belong to multiple Tasks
- Can belong to hierarchy (Action Groups, Practice Groups, etc.)

**Key Properties:**
1. **Actions remain atomic**: Single source of truth, update once, changes everywhere
2. **Multiple navigation paths**: Same Action discoverable via Role → Task OR via Hierarchy
3. **No forced choice**: Users can navigate however makes sense to them
4. **Scalable**: Works for 1-person businesses and 1,000-person enterprises

**Data Model:**
```prisma
model Role {
  id          String   @id @default(cuid())
  name        String   // "Sales Representative"
  description String?
  order       Int      @default(0)
  roleTasks   RoleTask[]
}

model Task {
  id          String   @id @default(cuid())
  name        String   // "Process New Leads"
  description String?
  order       Int      @default(0)
  roleTasks   RoleTask[]
  taskActions TaskAction[]
}

model RoleTask {
  id      String @id @default(cuid())
  roleId  String
  taskId  String
  order   Int    @default(0)
  role    Role   @relation(...)
  task    Task   @relation(...)
  @@unique([roleId, taskId])
}

model TaskAction {
  id        String @id @default(cuid())
  taskId    String
  actionId  String
  order     Int    @default(0)
  notes     String? // Optional context
  task      Task   @relation(...)
  action    Action @relation(...)
  @@unique([taskId, actionId])
}
```

**User Experience:**

*Small Business Owner:*
```
Homepage: "What's your role?"
  → Select: "Office Manager"
    → Shows Tasks:
      • Pay Vendors
      • Create Invoices
      • Run Payroll
    → Click: "Pay Vendors"
      → Shows Actions (in order):
        1. Login to QuickBooks
        2. Navigate to Vendor Section
        3. Create Vendor Payment
        4. Review and Submit
```

*Large Company Employee:*
```
Homepage: "Browse by Department"
  → Finance Department
    → Accounts Payable Practice
      → Invoice Processing Action Group
        → Actions:
          1. Login to QuickBooks (same Action)
          2. Navigate to Vendor Section (same Action)
          3. Create Vendor Payment (same Action)
```

*Power User:*
```
Search: "Create Invoice"
  → Action: "Create Vendor Payment"
    → Found via:
      • Role: Office Manager → Task: Pay Vendors → Step 3
      • Dept: Finance → Practice: AP → Action Group: Invoicing
      • Role: Accountant → Task: Month-End Close → Step 7
```

## Consequences

**Positive:**

- **Solves the small business problem**: Task-oriented navigation aligns with how small businesses think ("What do I need to do?")
- **Preserves hierarchy value**: Large organizations can still navigate by department structure
- **Flexible discovery**: Multiple paths to same content—users choose what makes sense
- **Content reusability**: One Action can serve many purposes without duplication
- **Scales across organization sizes**: Works for 1-person shop to 1,000-person enterprise
- **Progressive disclosure**: Beginners use Role → Task, advanced users explore full hierarchy
- **Better onboarding**: New employee sees "Here are your Tasks" without needing to understand entire system
- **Cross-functional support**: Tasks that span departments (like "Process Refund") can involve Actions from multiple hierarchy branches
- **Search-friendly**: Actions can be discovered via task names, role names, or hierarchy position
- **Maintenance efficiency**: Update Action once, reflects in all Tasks and hierarchy locations
- **AI training opportunity**: AI can suggest Tasks based on documented Actions, then suggest Roles that typically perform those Tasks
- **Aligns with user mental models**: People think "I need to qualify leads" not "I need to navigate to Sales → Lead Management → Qualification Process"

**Negative:**

- **Increased data model complexity**: Many-to-many relationships add junction tables and require careful maintenance
- **More upfront work for MVP**: Need to define common Roles and Tasks, not just document Actions
- **Potential for orphaned content**: Actions not linked to any Task become hard to discover (mitigated by AI suggestions)
- **Relationship maintenance burden**: Users must maintain Task ↔ Action links as workflows change
- **Cognitive load for advanced users**: Three navigation methods (Role → Task, Hierarchy, Search) might be overwhelming initially
- **Order management complexity**: Must maintain order within Tasks (Action 1, 2, 3...) separately from hierarchy order
- **Risk of inconsistency**: Same Action might appear in different order in different Tasks (mitigated by clear context in junction table)
- **Additional database queries**: Fetching Actions via many-to-many requires joins, slightly slower than direct hierarchy queries
- **Testing complexity**: Need to test all navigation paths to ensure consistency
- **Documentation burden**: Must document what Roles and Tasks mean, not just Actions
- **Potential naming conflicts**: "Task" might mean different things to different users (mitigated by clear definitions and examples)

**Acceptable Trade-offs:**
- The data model complexity is worth it to support both small and large organizations
- Junction tables and joins are standard database patterns, performance impact is minimal
- Most users will choose one primary navigation method and stick with it (reducing cognitive load in practice)
- The maintenance burden is offset by content reusability (update once, update everywhere)

## Alternatives Considered

### Alternative 1: Hierarchy Only (Status Quo)
- **Description:** Force all users to navigate via System → Department → Practice → Action Group → Actions
- **Pros:** 
  - Simpler data model (no many-to-many relationships)
  - Single navigation mental model
  - Clearer organizational structure
  - Less maintenance (no Tasks to manage)
- **Cons:**
  - Overwhelming for small businesses (too many levels)
  - Doesn't match how task-oriented users think
  - Forces organizational structure onto companies that don't have it
  - Actions locked into single position in hierarchy (not reusable)
- **Why Not Chosen:** Fails the small business use case completely. Small business owner doesn't want to learn 6-level hierarchy just to find "how to create an invoice."

### Alternative 2: Flat Tags Instead of Structured Relationships
- **Description:** Add tags to Actions (e.g., #sales #invoicing #beginner) and let users search/filter by tags
- **Pros:**
  - Very flexible—infinite tag combinations
  - No rigid structure to maintain
  - Users can create their own tags
  - Simple data model (just tags table)
- **Cons:**
  - No inherent order (tasks have sequence, tags don't)
  - Tag chaos (different people use different tags for same thing)
  - Doesn't capture Role → Task → Action relationships
  - No guided navigation for new users
  - Loses the value of structured hierarchy for large companies
- **Why Not Chosen:** Tags are great for discovery (we can add them later) but don't replace structured navigation. Users need "Show me what a Sales Rep does" not "Show me all Actions tagged #sales."

### Alternative 3: Separate Documentation Sets per User Type
- **Description:** Create entirely separate documentation for "Small Business Owner," "Sales Rep," "Accountant," etc.
- **Pros:**
  - Each set tailored to specific user needs
  - No cognitive load from multiple navigation options
  - Can use different language/tone for each audience
- **Cons:**
  - Massive duplication of content (write "Login to Salesforce" 10 times)
  - Maintenance nightmare (update one, must update all)
  - No single source of truth
  - Doesn't scale (can't create docs for every possible role)
  - Ignores that people wear multiple hats (small business owner is also accountant)
- **Why Not Chosen:** Violates DRY principle and creates unsustainable maintenance burden.

### Alternative 4: User-Created Custom Views
- **Description:** Let each user create their own custom navigation structure (like playlist or bookmark collections)
- **Pros:**
  - Ultimate flexibility—everyone organizes their way
  - Empowers users to customize experience
  - Could discover new navigation patterns organically
- **Cons:**
  - No guidance for new users (blank slate problem)
  - Everyone starts from scratch (no shared structure)
  - Doesn't help with onboarding ("here's what your role does")
  - Loses the value of curated, expert-organized content
  - High cognitive load (user must figure out organization)
- **Why Not Chosen:** Too much work for users. We should provide good defaults, then let them customize later. This could be a v2 feature on top of Role → Task navigation.

### Alternative 5: AI-Only Navigation (No Structure)
- **Description:** Use AI to answer "Show me how to create an invoice" without any underlying structure
- **Pros:**
  - Natural language interface (ultimate ease of use)
  - No navigation structure to maintain
  - Users just ask questions
- **Cons:**
  - Requires sophisticated AI (expensive, potentially unreliable)
  - Doesn't work for browsing/discovery (users don't know what to ask)
  - No persistent navigation structure (each query is isolated)
  - Harder to show relationships between Actions
  - Doesn't serve users who prefer structured navigation
  - Black box (users can't understand why they're getting certain results)
- **Why Not Chosen:** AI can augment navigation (and we'll add this) but shouldn't replace structure. Some users want to browse and explore, not just ask questions. Structure + AI is better than AI alone.

## Implementation Notes

**MVP Phased Rollout:**

**Phase 1 (Months 1-6): Actions Only**
- Focus on documenting Actions through collaborative AI training
- No Roles or Tasks yet
- Users build their Action library organically

**Phase 2 (Months 7-12): Add Tasks**
- Introduce Task concept
- AI suggests Tasks based on documented Actions ("These 5 Actions look like 'Create Sales Opportunity'")
- Users can link Actions to Tasks
- Basic task-based navigation

**Phase 3 (Months 13-18): Add Roles**
- Pre-populate common Roles (Sales Rep, Office Manager, Accountant, etc.)
- Let users link Tasks to Roles
- Role-based onboarding flow: "What's your role?" → Shows relevant Tasks

**Phase 4 (Year 2): Full Hierarchy**
- Add System → Department → Practice levels for large organizations
- Most small business users continue using Role → Task navigation
- Large companies can organize Actions hierarchically

**Pre-populated Data (Launch with Phase 3):**

*Common Roles:*
- Sales Representative
- Office Manager / Administrator
- Accountant / Bookkeeper
- Customer Support Specialist
- Operations Manager
- Marketing Manager
- IT Administrator

*Common Tasks (examples):*
- Qualify New Leads
- Create Sales Opportunities
- Process Vendor Payments
- Generate Invoices
- Run Payroll
- Onboard New Employees
- Handle Customer Inquiries
- Generate Monthly Reports

**AI Assistance:**

During training workflow, AI suggests:
```
"I see you documented 'Create Vendor Payment in QuickBooks'
This looks like it could be part of the Task: 'Process Vendor Payments'
Which Roles typically do this?"
  [✓] Office Manager
  [✓] Accountant
  [ ] Sales Representative
```

**UI Navigation Patterns:**

*Primary Navigation Tabs:*
```
┌────────────────────────────────────────────────┐
│ [By Role] [By Department] [Search] [Browse All]│
└────────────────────────────────────────────────┘
```

*Breadcrumbs (showing multiple paths):*
```
Action: "Create Vendor Invoice"

You can find this via:
  • Role: Office Manager → Task: Pay Vendors → Step 3 of 5
  • Dept: Finance → Practice: AP → Invoice Processing
  • Task: Month-End Reporting → Step 8 of 12
```

**Database Performance Considerations:**

- Index on junction tables: `(roleId, taskId)` and `(taskId, actionId)`
- Cache frequently-accessed navigation paths (Role → Tasks, Task → Actions)
- Eager loading for common queries to reduce N+1 problems
- Materialized views for popular navigation paths (if needed at scale)

**Naming Choices:**

- **"Role"** instead of "Job" to avoid confusion with technical term "background job"
- **"Task"** is clear and commonly understood (considered "Workflow" but too technical, "Goal" too abstract)
- **"Action"** remains from existing model (atomic unit of documentation)

## Decision Review Triggers

**Reconsider this decision if:**

1. **User feedback shows confusion**: If 50%+ of users don't understand multiple navigation paths → simplify to single path
2. **Maintenance burden is too high**: If managing Role ↔ Task ↔ Action relationships takes more time than creating content → consider tags or simpler model
3. **Performance issues**: If many-to-many joins cause slow queries at scale → optimize or denormalize
4. **Most users pick one path exclusively**: If 90%+ use only Role → Task (never hierarchy) → deprioritize hierarchy development
5. **Small businesses don't adopt**: If small businesses still struggle with navigation → add AI-only interface or further simplify
6. **Large companies don't use hierarchy**: If enterprises stick with Role → Task → consider dropping full hierarchy implementation

**Success Metrics for This Decision:**

- 80%+ of new users can find relevant Actions within 2 minutes of first visit
- 60%+ of small business users prefer Role → Task navigation
- 40%+ of large company users use hierarchy navigation
- Less than 10% of support tickets related to "can't find documentation"
- Actions are reused across average of 2.5+ Tasks (proving many-to-many value)
- Zero orphaned Actions (all Actions linked to at least one Task or hierarchy position)

## Related Decisions

- ADR 001: Pure Cloud-Based Architecture
- Future ADR: Hierarchy Implementation Timeline (when/if to build full 6 levels)
- Future ADR: AI-Powered Navigation Assistant (augmenting structured navigation)

## References

- Discussion: TechLedger architecture planning session, 2025-10-12
- Concept: "Data as atomic foundation, transformations as operations" (project philosophy)
- Pattern: Many-to-many navigation (similar to Notion, Confluence, modern wikis)
