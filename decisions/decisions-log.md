# Decisions Log (ADR - Architecture Decision Records)

**Project:** techledger  
**Last Updated:** 2025-10-12

---

## 1. Pure Cloud-Based Architecture with Browser Upload

**Date:** 2025-10-12  
**Status:** Accepted  
**Deciders:** John Lamont  
**Decision Type:** Architecture - Foundational

### Context

TechLedger requires processing screenshots and videos to generate documentation through AI-assisted training. The core technical question is: **Where should OCR/computer vision processing occur?**

Three architectural approaches were considered:
1. **Pure cloud-based** - Browser upload, all processing server-side
2. **Browser extension + cloud** - Extension captures screenshots, sends to cloud
3. **Desktop application + cloud** - Native apps for Windows/Mac/Linux

Key constraints:
- Solo developer with 12-18 month timeline for MVP
- Need to reach MVP with paying customers by Month 12
- Target users: small businesses without technical resources
- Must leverage best-in-class AI/computer vision capabilities
- Budget constraints: ~$50-220/month for cloud services

Critical questions addressed:
- Can cloud-based OCR/vision APIs provide sufficient accuracy?
- Will manual screenshot upload create too much friction?
- Is installation of client-side software an acceptable barrier?
- What approach minimizes development time while maximizing quality?

### Decision

**Adopt pure cloud-based architecture with browser-based screenshot upload for MVP (Months 1-12).**

All OCR, computer vision processing, pattern matching, and documentation generation will occur server-side using cloud APIs (Google Cloud Vision or AWS Rekognition). Users will manually capture screenshots using OS-native tools and upload them via the TechLedger web application.

**Technical Architecture:**
- **Frontend:** React + TypeScript SPA (Single Page Application)
- **Backend:** Node.js + Express API
- **Vision Processing:** Google Cloud Vision API (primary), AWS Rekognition (backup)
- **Storage:** AWS S3 or Google Cloud Storage for images/documents
- **Database:** PostgreSQL for users, patterns, training data, documentation
- **Hosting:** Vercel (frontend) + Railway/Render (backend) or similar managed services
- **Authentication:** Clerk, Auth0, or Supabase Auth
- **Payments:** Stripe for subscription billing

**User Workflow:**
1. User navigates to screen in their business application they want to document
2. User takes screenshot using OS tool (Win+Shift+S on Windows, Cmd+Shift+4 on Mac)
3. User drags/uploads screenshot to TechLedger web app
4. Backend uploads to cloud storage, triggers vision API processing
5. AI analyzes screenshot, generates questions for uncertain elements
6. User answers questions through conversational UI
7. System stores learned patterns, generates documentation
8. Process repeats; AI learns and requires fewer questions over time

**Future Enhancement Path:**
- Month 13+: Consider browser extension for one-click capture if customer demand warrants
- Year 2+: Evaluate desktop application only if significant customer need identified

### Consequences

**Positive:**

- **Faster MVP delivery:** Single codebase (web app) vs. three desktop apps saves 4-6 months development time
- **Superior OCR quality:** Cloud Vision APIs (Google/AWS) are state-of-the-art, trained on billions of images, understand UI elements and layouts better than any local OCR library
- **Zero installation friction:** Works immediately in any browser, no security concerns about installing desktop software
- **Universal compatibility:** Works on Windows, Mac, Linux, tablets, any device with modern browser
- **Lower complexity:** Single system to build, test, debug, and maintain
- **Better scalability:** Cloud architecture scales automatically without client version management
- **Cost-effective:** Pay-per-use vision API pricing (~$1.50 per 1,000 images) vs. building/maintaining computer vision models
- **Continuous improvement:** Vision APIs improve over time without any action needed
- **Easier customer support:** No "works on my machine" issues, consistent environment for all users
- **Simpler deployment:** Push updates to web app instantly, no client update distribution
- **Focus on core value:** Development time spent on collaborative AI training system, not cross-platform compatibility
- **Reduced security risk:** All processing server-side in controlled environment, no broad OS permissions needed

**Negative:**

- **Manual screenshot process:** Users must use OS screenshot tool separately (Win+Shift+S, Cmd+Shift+4), then upload - two-step process vs. one-click capture
- **Upload latency:** Large screenshots (2-5MB) require 2-5 seconds to upload before processing begins
- **Less seamless workflow:** Context switching between business app → screenshot tool → TechLedger browser tab
- **Desktop app documentation limitation:** Cannot capture screens from applications that prevent screenshots (rare, but some security software blocks this)
- **Dependency on internet:** Requires active internet connection for all processing (no offline mode)
- **Cloud API dependency:** Reliant on third-party services (Google/AWS) for core functionality
- **Ongoing cloud costs:** Per-image processing costs vs. one-time local software cost (though cloud is still cheaper overall)

**Acceptable Trade-offs:**
- Manual screenshot is minor inconvenience vs. installation barrier - users already take screenshots regularly
- Small businesses document 1-5 workflows per week, not 100 per day - upload latency is acceptable
- The 70% time savings in documentation creation (20 min vs. 2 hours) vastly outweighs 3-second screenshot effort
- Can always add browser extension later (Month 13+) if users specifically request easier capture

### Alternatives Considered

**Alternative 1: Browser Extension + Cloud Hybrid**
- **Description:** Chrome/Firefox extension captures screenshots with one click, sends to cloud for processing
- **Pros:** 
  - More seamless capture workflow (one-click vs. two-step)
  - Can capture web page DOM/HTML metadata in addition to pixels
  - Knows context (which web app user is documenting)
  - Still leverages superior cloud-based vision processing
- **Cons:**
  - Requires installation (barrier to adoption, permission concerns)
  - Only works for web-based applications (doesn't capture desktop apps)
  - Must develop and maintain for multiple browsers (Chrome, Firefox, Edge, Safari each have different APIs)
  - Adds 2-3 months to development timeline
  - More complex testing and support burden
  - Limited to browser-based business apps (though most modern SaaS is web-based)
- **Why Not Chosen:** Premature optimization. Browser extension adds significant complexity before validating core value proposition. Can add as enhancement in Month 13+ if paying customers request it. Better to validate that users want the collaborative AI training system first, then optimize capture mechanism.

**Alternative 2: Desktop Application + Cloud Hybrid**
- **Description:** Native desktop apps (Electron or platform-specific) run in background, capture screenshots on hotkey press, upload to cloud
- **Pros:**
  - Most seamless capture experience (hotkey from anywhere)
  - Can capture any application (desktop or web)
  - Could enable video screen recording for workflow capture
  - Can access OS-level window metadata (which app is active)
  - Professional appearance with system tray icon
- **Cons:**
  - **Massive development burden:** Must build for Windows, Mac, and Linux separately (3x the work) or use Electron (large app size, performance concerns)
  - **Installation barrier:** Users very hesitant to install desktop software, especially from unknown companies
  - **Security concerns:** Desktop apps require broad OS permissions (screenshot access, file system), triggers antivirus warnings
  - **Slow development:** 6-12 months just for multi-platform desktop app before even building core AI features
  - **Complex distribution:** Code signing certificates ($400+/year), update mechanisms, version management across platforms
  - **Higher maintenance:** OS updates frequently break desktop apps, ongoing compatibility testing required
  - **Delayed validation:** Takes so long to build that you can't validate product-market fit until much later
- **Why Not Chosen:** Completely misaligned with 12-month MVP timeline and solo development constraints. The 80-90% of development time would go to building desktop infrastructure rather than the core value (collaborative AI training). Small businesses primarily use web-based SaaS applications anyway. This would be a Year 2+ consideration only if strong customer demand emerges and resources exist for multi-platform development.

**Alternative 3: Local OCR Processing (Client-Side)**
- **Description:** User installs software that runs OCR locally (Tesseract or similar), processes screenshots on their machine, sends results to cloud
- **Pros:**
  - No per-image API costs (one-time software cost)
  - Works offline (no internet required for OCR step)
  - Faster processing for low-bandwidth users
  - User data stays more private (images don't leave their machine)
- **Cons:**
  - **Inferior OCR quality:** Local libraries (Tesseract) have 60-70% accuracy vs. 95%+ for cloud APIs
  - **No UI understanding:** Local OCR only extracts text, doesn't understand buttons, layouts, UI hierarchy
  - **Still requires installation:** All the drawbacks of desktop app (installation friction, security concerns, multi-platform complexity)
  - **User hardware dependency:** Processing speed varies wildly based on user's CPU, causes support issues
  - **Maintenance burden:** Must update local libraries, handle compatibility issues
  - **Slower development:** Must package, test, distribute local processing software
- **Why Not Chosen:** Worse user experience (lower accuracy) AND more development complexity. Cloud APIs are objectively superior for computer vision tasks. The pennies-per-image cost is negligible compared to development time saved and quality gained.

### Implementation Notes

**MVP Development Priority (Months 1-6):**
1. Basic React web app with drag-and-drop screenshot upload
2. Integration with Google Cloud Vision API for OCR and element detection
3. Pattern storage in PostgreSQL database
4. Conversational Q&A interface for training
5. Simple documentation generation from templates

**Technical Debt Accepted:**
- No offline mode (acceptable for target market)
- No mobile-optimized interface (users documenting on desktop/laptop)
- No browser extension (can add later if needed)
- No video processing initially (screenshots only for MVP)

**Decision Review Triggers:**
- If 50%+ of beta customers specifically request one-click capture → Evaluate browser extension
- If customers need to document non-web desktop applications → Evaluate desktop app
- If cloud vision API costs exceed $500/month → Evaluate cost optimization or local processing
- If Google/AWS APIs have significant outages → Evaluate redundancy strategy

**Success Metrics for This Decision:**
- Can deliver functional MVP by Month 6 (would be impossible with desktop app)
- Cloud vision API provides 80%+ accuracy in UI element detection
- Upload latency under 5 seconds for typical screenshots (2-3MB)
- Less than 10% of pilot users cite "manual screenshot" as major friction point
- Zero installation-related support tickets (vs. expected 30%+ with desktop app)

### References
- Google Cloud Vision API Pricing: https://cloud.google.com/vision/pricing
- AWS Rekognition Pricing: https://aws.amazon.com/rekognition/pricing/
- Architecture discussion: TechLedger project planning session, 2025-10-12

### Related Decisions
- ADR 002: Frontend Technology Stack (React + TypeScript) - To be created
- ADR 003: Backend Technology Stack (Node.js vs. Python) - To be created
- ADR 004: Computer Vision Provider Selection (Google vs. AWS) - To be created
- ADR 005: Authentication Provider Selection - To be created

---

## 2. Role-Based and Task-Based Navigation Model

**Date:** 2025-10-12  
**Status:** Accepted  
**Deciders:** John Lamont  
**Decision Type:** Architecture - Data Model & User Experience

### Context

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

### Decision

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

### Consequences

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

### Alternatives Considered

**Alternative 1: Hierarchy Only (Status Quo)**
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

**Alternative 2: Flat Tags Instead of Structured Relationships**
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

**Alternative 3: Separate Documentation Sets per User Type**
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

**Alternative 4: User-Created Custom Views**
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

**Alternative 5: AI-Only Navigation (No Structure)**
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

### Implementation Notes

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

### Decision Review Triggers

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

### Related Decisions

- **ADR 001:** Pure Cloud-Based Architecture
- **Future ADR:** Hierarchy Implementation Timeline (when/if to build full 6 levels)
- **Future ADR:** AI-Powered Navigation Assistant (augmenting structured navigation)

### References

- Discussion: TechLedger architecture planning session, 2025-10-12
- Concept: "Data as atomic foundation, transformations as operations" (project philosophy)
- Pattern: Many-to-many navigation (similar to Notion, Confluence, modern wikis)


---

## 3. Python Backend Technology Stack

**Date:** 2025-10-12  
**Status:** Accepted  
**Deciders:** John Lamont  
**Decision Type:** Technology - Backend Language & Framework

### Context

The backend services (API Service and AI Engine Service) require a programming language and framework that will enable rapid development for a solo developer with a 12-18 month MVP timeline.

Initial planning documents suggested Node.js + TypeScript + Express based on the following assumptions:
- Single language across frontend and backend (JavaScript/TypeScript)
- Large ecosystem of packages
- Strong async I/O performance
- Good for API development

However, the primary developer (John Lamont) is more familiar and comfortable with Python. For a solo development project, developer productivity and code intuition are critical success factors.

**Key Considerations:**
- Solo developer timeline (12-18 months to MVP)
- Need to maximize development velocity
- Backend will integrate with computer vision APIs (Google Cloud Vision, AWS Rekognition)
- Async job processing required for screenshot analysis
- Type safety desirable but not mandatory
- Must support all required integrations (Clerk, Stripe, S3, PostgreSQL)

**Critical Question:**
Is it better to use a language the developer knows well (Python) vs. maintaining language consistency across the stack (TypeScript)?

### Decision

**Use Python for all backend services with FastAPI as the web framework.**

**Technology Stack:**
- **Web Framework:** FastAPI (modern, async, type-safe)
- **ORM:** SQLAlchemy (mature, flexible, well-documented)
- **Job Queue:** Celery + Redis (industry standard for async tasks)
- **Type Safety:** Python type hints + Pydantic (runtime validation)
- **API Documentation:** Automatic via FastAPI (Swagger/OpenAPI)
- **Testing:** pytest (comprehensive testing framework)

**Frontend remains unchanged:** React + TypeScript + Vite

**Services Architecture:**
```
Frontend (TypeScript)
    ↓ REST API (JSON)
Backend API Service (Python + FastAPI)
    ↓ Job Queue (Celery + Redis)
AI Engine Workers (Python + Celery)
    ↓ External APIs
Google Cloud Vision, AWS S3, etc.
```

**Rationale:**
Developer familiarity and intuition trump language consistency for solo development. A developer who is comfortable with Python will:
- Write code faster
- Make fewer errors
- Debug more efficiently
- Maintain better code quality
- Experience less cognitive fatigue

The productivity gain from using a familiar language outweighs the minor overhead of context-switching between TypeScript (frontend) and Python (backend).

### Consequences

**Positive:**

- **Faster development velocity**: Developer can focus on business logic rather than language syntax and idioms
- **Better code quality**: Writing in a familiar language reduces bugs and improves readability
- **Reduced cognitive load**: No mental context switching when working on backend code
- **Excellent AI/ML ecosystem**: Python has superior libraries for data processing, ML, and vision (if needed later)
- **Strong async support**: FastAPI provides async/await similar to Node.js performance
- **Automatic API documentation**: FastAPI generates Swagger/OpenAPI docs automatically
- **Type safety with Pydantic**: Runtime validation + type hints provide similar safety to TypeScript
- **Mature ecosystem**: All required libraries exist with excellent documentation
- **Better for data processing**: Python excels at data manipulation, which is core to pattern matching
- **Simpler deployment**: Python + Docker is straightforward, well-documented
- **Future flexibility**: Easier to add custom ML models or advanced data processing if needed
- **Strong community**: Huge Python web development community for support

**Negative:**

- **No shared types**: Frontend TypeScript types don't automatically match backend Python models (mitigated by OpenAPI schema generation)
- **Context switching**: Developer must switch between TypeScript and Python (acceptable trade-off)
- **Different tooling**: Separate package managers (pnpm vs pip), linters (ESLint vs pylint), formatters (Prettier vs black)
- **Slightly different async patterns**: async/await works differently in Python vs JavaScript (minor learning curve)
- **No full-stack frameworks**: Can't use Next.js API routes or similar TypeScript full-stack solutions
- **Type safety is opt-in**: Python type hints are not enforced at runtime (mitigated by Pydantic validation)
- **Potential hiring consideration**: If hiring later, need to find Python developers (though Python is very popular)

**Acceptable Trade-offs:**
- Language consistency is less important than developer productivity for solo development
- Context switching between languages is a minor inconvenience vs. struggling with unfamiliar syntax
- Type safety can be achieved through Pydantic validation and OpenAPI schema validation
- Shared types can be generated from OpenAPI spec if needed later

### Alternatives Considered

**Alternative 1: Node.js + TypeScript + Express**
- **Description:** Use JavaScript/TypeScript for both frontend and backend
- **Pros:**
  - Single language across entire stack
  - Shared type definitions possible
  - Unified tooling (npm/pnpm, ESLint, TypeScript)
  - Many full-stack examples and tutorials
  - Strong async I/O performance
- **Cons:**
  - Developer less familiar with Node.js ecosystem
  - Slower development velocity (learning curve)
  - More debugging time (unfamiliar territory)
  - Callback hell and promise complexity can be confusing
  - Less intuitive for data processing tasks
- **Why Not Chosen:** Developer productivity is paramount for solo development. The time lost learning Node.js nuances would delay MVP significantly. A comfortable developer writes better code faster.

**Alternative 2: Python + Django**
- **Description:** Use Django web framework instead of FastAPI
- **Pros:**
  - Batter# Decisions Log (ADR - Architecture Decision Records)

**Project:** techledger  
**Last Updated:** 2025-10-12

---

## 1. Pure Cloud-Based Architecture with Browser Upload

**Date:** 2025-10-12  
**Status:** Accepted  
**Deciders:** John Lamont  
**Decision Type:** Architecture - Foundational

### Context

TechLedger requires processing screenshots and videos to generate documentation through AI-assisted training. The core technical question is: **Where should OCR/computer vision processing occur?**

Three architectural approaches were considered:
1. **Pure cloud-based** - Browser upload, all processing server-side
2. **Browser extension + cloud** - Extension captures screenshots, sends to cloud
3. **Desktop application + cloud** - Native apps for Windows/Mac/Linux

Key constraints:
- Solo developer with 12-18 month timeline for MVP
- Need to reach MVP with paying customers by Month 12
- Target users: small businesses without technical resources
- Must leverage best-in-class AI/computer vision capabilities
- Budget constraints: ~$50-220/month for cloud services

Critical questions addressed:
- Can cloud-based OCR/vision APIs provide sufficient accuracy?
- Will manual screenshot upload create too much friction?
- Is installation of client-side software an acceptable barrier?
- What approach minimizes development time while maximizing quality?

### Decision

**Adopt pure cloud-based architecture with browser-based screenshot upload for MVP (Months 1-12).**

All OCR, computer vision processing, pattern matching, and documentation generation will occur server-side using cloud APIs (Google Cloud Vision or AWS Rekognition). Users will manually capture screenshots using OS-native tools and upload them via the TechLedger web application.

**Technical Architecture:**
- **Frontend:** React + TypeScript SPA (Single Page Application)
- **Backend:** Node.js + Express API
- **Vision Processing:** Google Cloud Vision API (primary), AWS Rekognition (backup)
- **Storage:** AWS S3 or Google Cloud Storage for images/documents
- **Database:** PostgreSQL for users, patterns, training data, documentation
- **Hosting:** Vercel (frontend) + Railway/Render (backend) or similar managed services
- **Authentication:** Clerk, Auth0, or Supabase Auth
- **Payments:** Stripe for subscription billing

**User Workflow:**
1. User navigates to screen in their business application they want to document
2. User takes screenshot using OS tool (Win+Shift+S on Windows, Cmd+Shift+4 on Mac)
3. User drags/uploads screenshot to TechLedger web app
4. Backend uploads to cloud storage, triggers vision API processing
5. AI analyzes screenshot, generates questions for uncertain elements
6. User answers questions through conversational UI
7. System stores learned patterns, generates documentation
8. Process repeats; AI learns and requires fewer questions over time

**Future Enhancement Path:**
- Month 13+: Consider browser extension for one-click capture if customer demand warrants
- Year 2+: Evaluate desktop application only if significant customer need identified

### Consequences

**Positive:**

- **Faster MVP delivery:** Single codebase (web app) vs. three desktop apps saves 4-6 months development time
- **Superior OCR quality:** Cloud Vision APIs (Google/AWS) are state-of-the-art, trained on billions of images, understand UI elements and layouts better than any local OCR library
- **Zero installation friction:** Works immediately in any browser, no security concerns about installing desktop software
- **Universal compatibility:** Works on Windows, Mac, Linux, tablets, any device with modern browser
- **Lower complexity:** Single system to build, test, debug, and maintain
- **Better scalability:** Cloud architecture scales automatically without client version management
- **Cost-effective:** Pay-per-use vision API pricing (~$1.50 per 1,000 images) vs. building/maintaining computer vision models
- **Continuous improvement:** Vision APIs improve over time without any action needed
- **Easier customer support:** No "works on my machine" issues, consistent environment for all users
- **Simpler deployment:** Push updates to web app instantly, no client update distribution
- **Focus on core value:** Development time spent on collaborative AI training system, not cross-platform compatibility
- **Reduced security risk:** All processing server-side in controlled environment, no broad OS permissions needed

**Negative:**

- **Manual screenshot process:** Users must use OS screenshot tool separately (Win+Shift+S, Cmd+Shift+4), then upload - two-step process vs. one-click capture
- **Upload latency:** Large screenshots (2-5MB) require 2-5 seconds to upload before processing begins
- **Less seamless workflow:** Context switching between business app → screenshot tool → TechLedger browser tab
- **Desktop app documentation limitation:** Cannot capture screens from applications that prevent screenshots (rare, but some security software blocks this)
- **Dependency on internet:** Requires active internet connection for all processing (no offline mode)
- **Cloud API dependency:** Reliant on third-party services (Google/AWS) for core functionality
- **Ongoing cloud costs:** Per-image processing costs vs. one-time local software cost (though cloud is still cheaper overall)

**Acceptable Trade-offs:**
- Manual screenshot is minor inconvenience vs. installation barrier - users already take screenshots regularly
- Small businesses document 1-5 workflows per week, not 100 per day - upload latency is acceptable
- The 70% time savings in documentation creation (20 min vs. 2 hours) vastly outweighs 3-second screenshot effort
- Can always add browser extension later (Month 13+) if users specifically request easier capture

### Alternatives Considered

**Alternative 1: Browser Extension + Cloud Hybrid**
- **Description:** Chrome/Firefox extension captures screenshots with one click, sends to cloud for processing
- **Pros:** 
  - More seamless capture workflow (one-click vs. two-step)
  - Can capture web page DOM/HTML metadata in addition to pixels
  - Knows context (which web app user is documenting)
  - Still leverages superior cloud-based vision processing
- **Cons:**
  - Requires installation (barrier to adoption, permission concerns)
  - Only works for web-based applications (doesn't capture desktop apps)
  - Must develop and maintain for multiple browsers (Chrome, Firefox, Edge, Safari each have different APIs)
  - Adds 2-3 months to development timeline
  - More complex testing and support burden
  - Limited to browser-based business apps (though most modern SaaS is web-based)
- **Why Not Chosen:** Premature optimization. Browser extension adds significant complexity before validating core value proposition. Can add as enhancement in Month 13+ if paying customers request it. Better to validate that users want the collaborative AI training system first, then optimize capture mechanism.

**Alternative 2: Desktop Application + Cloud Hybrid**
- **Description:** Native desktop apps (Electron or platform-specific) run in background, capture screenshots on hotkey press, upload to cloud
- **Pros:**
  - Most seamless capture experience (hotkey from anywhere)
  - Can capture any application (desktop or web)
  - Could enable video screen recording for workflow capture
  - Can access OS-level window metadata (which app is active)
  - Professional appearance with system tray icon
- **Cons:**
  - **Massive development burden:** Must build for Windows, Mac, and Linux separately (3x the work) or use Electron (large app size, performance concerns)
  - **Installation barrier:** Users very hesitant to install desktop software, especially from unknown companies
  - **Security concerns:** Desktop apps require broad OS permissions (screenshot access, file system), triggers antivirus warnings
  - **Slow development:** 6-12 months just for multi-platform desktop app before even building core AI features
  - **Complex distribution:** Code signing certificates ($400+/year), update mechanisms, version management across platforms
  - **Higher maintenance:** OS updates frequently break desktop apps, ongoing compatibility testing required
  - **Delayed validation:** Takes so long to build that you can't validate product-market fit until much later
- **Why Not Chosen:** Completely misaligned with 12-month MVP timeline and solo development constraints. The 80-90% of development time would go to building desktop infrastructure rather than the core value (collaborative AI training). Small businesses primarily use web-based SaaS applications anyway. This would be a Year 2+ consideration only if strong customer demand emerges and resources exist for multi-platform development.

**Alternative 3: Local OCR Processing (Client-Side)**
- **Description:** User installs software that runs OCR locally (Tesseract or similar), processes screenshots on their machine, sends results to cloud
- **Pros:**
  - No per-image API costs (one-time software cost)
  - Works offline (no internet required for OCR step)
  - Faster processing for low-bandwidth users
  - User data stays more private (images don't leave their machine)
- **Cons:**
  - **Inferior OCR quality:** Local libraries (Tesseract) have 60-70% accuracy vs. 95%+ for cloud APIs
  - **No UI understanding:** Local OCR only extracts text, doesn't understand buttons, layouts, UI hierarchy
  - **Still requires installation:** All the drawbacks of desktop app (installation friction, security concerns, multi-platform complexity)
  - **User hardware dependency:** Processing speed varies wildly based on user's CPU, causes support issues
  - **Maintenance burden:** Must update local libraries, handle compatibility issues
  - **Slower development:** Must package, test, distribute local processing software
- **Why Not Chosen:** Worse user experience (lower accuracy) AND more development complexity. Cloud APIs are objectively superior for computer vision tasks. The pennies-per-image cost is negligible compared to development time saved and quality gained.

### Implementation Notes

**MVP Development Priority (Months 1-6):**
1. Basic React web app with drag-and-drop screenshot upload
2. Integration with Google Cloud Vision API for OCR and element detection
3. Pattern storage in PostgreSQL database
4. Conversational Q&A interface for training
5. Simple documentation generation from templates

**Technical Debt Accepted:**
- No offline mode (acceptable for target market)
- No mobile-optimized interface (users documenting on desktop/laptop)
- No browser extension (can add later if needed)
- No video processing initially (screenshots only for MVP)

**Decision Review Triggers:**
- If 50%+ of beta customers specifically request one-click capture → Evaluate browser extension
- If customers need to document non-web desktop applications → Evaluate desktop app
- If cloud vision API costs exceed $500/month → Evaluate cost optimization or local processing
- If Google/AWS APIs have significant outages → Evaluate redundancy strategy

**Success Metrics for This Decision:**
- Can deliver functional MVP by Month 6 (would be impossible with desktop app)
- Cloud vision API provides 80%+ accuracy in UI element detection
- Upload latency under 5 seconds for typical screenshots (2-3MB)
- Less than 10% of pilot users cite "manual screenshot" as major friction point
- Zero installation-related support tickets (vs. expected 30%+ with desktop app)

### References
- Google Cloud Vision API Pricing: https://cloud.google.com/vision/pricing
- AWS Rekognition Pricing: https://aws.amazon.com/rekognition/pricing/
- Architecture discussion: TechLedger project planning session, 2025-10-12

### Related Decisions
- ADR 002: Frontend Technology Stack (React + TypeScript) - To be created
- ADR 003: Backend Technology Stack (Node.js vs. Python) - To be created
- ADR 004: Computer Vision Provider Selection (Google vs. AWS) - To be created
- ADR 005: Authentication Provider Selection - To be created

---

## 2. Role-Based and Task-Based Navigation Model

**Date:** 2025-10-12  
**Status:** Accepted  
**Deciders:** John Lamont  
**Decision Type:** Architecture - Data Model & User Experience

### Context

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

### Decision

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

### Consequences

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

### Alternatives Considered

**Alternative 1: Hierarchy Only (Status Quo)**
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

**Alternative 2: Flat Tags Instead of Structured Relationships**
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

**Alternative 3: Separate Documentation Sets per User Type**
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

**Alternative 4: User-Created Custom Views**
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

**Alternative 5: AI-Only Navigation (No Structure)**
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

### Implementation Notes

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

### Decision Review Triggers

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

### Related Decisions

- **ADR 001:** Pure Cloud-Based Architecture
- **Future ADR:** Hierarchy Implementation Timeline (when/if to build full 6 levels)
- **Future ADR:** AI-Powered Navigation Assistant (augmenting structured navigation)

### References

- Discussion: TechLedger architecture planning session, 2025-10-12
- Concept: "Data as atomic foundation, transformations as operations" (project philosophy)
- Pattern: Many-to-many navigation (similar to Notion, Confluence, modern wikis)

---

## 4. [Next Decision]
[Future architectural decisions will be added here]