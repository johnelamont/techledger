# Data Models & Schemas

**Project:** techledger  
**Last Updated:** 2025-10-12  
**Database:** PostgreSQL 15+ with Prisma ORM

## Database Schema Overview

TechLedger uses a relational database (PostgreSQL) to store users, organizations, screenshots, patterns, training data, and generated documentation. The schema is designed to support:

- Multi-tenancy (organizations with multiple users)
- Hierarchical tech stack organization (System → Department → ... → Actions)
- Pattern learning and reuse
- Training history and audit trails
- Document versioning

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== User Management ====================

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  clerkId   String   @unique  // Clerk authentication ID
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relationships
  organizations     OrganizationMember[]
  screenshots       Screenshot[]
  patterns          Pattern[]
  documents         Document[]
  trainingQuestions TrainingQuestion[]
  trainingAnswers   TrainingAnswer[]

  @@index([email])
  @@index([clerkId])
}

model Organization {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  stripeCustomerId String? @unique
  subscriptionStatus SubscriptionStatus @default(TRIAL)
  subscriptionTier   SubscriptionTier   @default(FREE)
  trialEndsAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relationships
  members     OrganizationMember[]
  systems     System[]
  documents   Document[]

  @@index([slug])
  @@index([stripeCustomerId])
}

model OrganizationMember {
  id             String   @id @default(cuid())
  userId         String
  organizationId String
  role           Role     @default(MEMBER)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relationships
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([userId, organizationId])
  @@index([userId])
  @@index([organizationId])
}

// ==================== Tech Stack Hierarchy ====================

model System {
  id             String   @id @default(cuid())
  organizationId String
  name           String   // e.g., "Sales & Marketing System"
  description    String?
  order          Int      @default(0)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relationships
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  departments  Department[]

  @@index([organizationId])
  @@index([organizationId, order])
}

model Department {
  id          String   @id @default(cuid())
  systemId    String
  name        String   // e.g., "Customer Relations"
  description String?
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relationships
  system         System          @relation(fields: [systemId], references: [id], onDelete: Cascade)
  practiceGroups PracticeGroup[]

  @@index([systemId])
  @@index([systemId, order])
}

model PracticeGroup {
  id           String   @id @default(cuid())
  departmentId String
  name         String   // e.g., "Lead Management"
  description  String?
  order        Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relationships
  department   Department    @relation(fields: [departmentId], references: [id], onDelete: Cascade)
  actionGroups ActionGroup[]

  @@index([departmentId])
  @@index([departmentId, order])
}

model ActionGroup {
  id              String   @id @default(cuid())
  practiceGroupId String
  name            String   // e.g., "Lead Creation"
  description     String?
  order           Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relationships
  practiceGroup PracticeGroup @relation(fields: [practiceGroupId], references: [id], onDelete: Cascade)
  actions       Action[]

  @@index([practiceGroupId])
  @@index([practiceGroupId, order])
}

model Action {
  id            String   @id @default(cuid())
  actionGroupId String
  name          String   // e.g., "Create Lead from Web Form"
  description   String?
  applicationName String // e.g., "Salesforce", "HubSpot"
  order         Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relationships
  actionGroup    ActionGroup     @relation(fields: [actionGroupId], references: [id], onDelete: Cascade)
  transformations Transformation[]
  workflows      Workflow[]
  documents      Document[]

  @@index([actionGroupId])
  @@index([actionGroupId, order])
  @@index([applicationName])
}

model Transformation {
  id          String   @id @default(cuid())
  actionId    String
  name        String   // e.g., "Validate email format"
  description String?
  inputData   Json?    // Structured input requirements
  outputData  Json?    // Expected output format
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relationships
  action Action @relation(fields: [actionId], references: [id], onDelete: Cascade)

  @@index([actionId])
  @@index([actionId, order])
}

// ==================== Training & Screenshots ====================

model Workflow {
  id              String   @id @default(cuid())
  userId          String
  actionId        String?  // Link to hierarchy (optional for MVP)
  name            String   // e.g., "Create Sales Opportunity"
  applicationName String   // e.g., "Salesforce"
  description     String?
  status          WorkflowStatus @default(ACTIVE)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relationships
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  action       Action?      @relation(fields: [actionId], references: [id], onDelete: SetNull)
  screenshots  Screenshot[]

  @@index([userId])
  @@index([actionId])
  @@index([applicationName])
  @@index([status])
}

model Screenshot {
  id              String   @id @default(cuid())
  userId          String
  workflowId      String
  originalUrl     String   // S3 URL of original screenshot
  thumbnailUrl    String?  // S3 URL of thumbnail
  annotatedUrl    String?  // S3 URL with bounding boxes drawn
  fileSize        Int      // Bytes
  dimensions      Json     // { width: number, height: number }
  status          ScreenshotStatus @default(UPLOADED)
  visionJobId     String?  // Bull queue job ID
  analysisResult  Json?    // Raw Google Vision API response
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relationships
  user              User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  workflow          Workflow           @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  detectedElements  DetectedElement[]
  trainingQuestions TrainingQuestion[]

  @@index([userId])
  @@index([workflowId])
  @@index([status])
  @@index([visionJobId])
}

model DetectedElement {
  id            String   @id @default(cuid())
  screenshotId  String
  elementType   ElementType
  boundingBox   Json     // { top, left, width, height }
  text          String?
  confidence    Float    // 0.0 to 1.0
  properties    Json?    // Additional visual properties
  patternId     String?  // Matched pattern (if any)
  matchConfidence Float? // Confidence of pattern match
  createdAt     DateTime @default(now())

  // Relationships
  screenshot Screenshot @relation(fields: [screenshotId], references: [id], onDelete: Cascade)
  pattern    Pattern?   @relation(fields: [patternId], references: [id], onDelete: SetNull)
  questions  TrainingQuestion[]

  @@index([screenshotId])
  @@index([patternId])
  @@index([elementType])
}

// ==================== Training Q&A ====================

model TrainingQuestion {
  id               String   @id @default(cuid())
  userId           String
  screenshotId     String
  detectedElementId String?
  questionText     String
  questionType     QuestionType
  priority         Int      @default(5)  // 1-10, higher = more important
  suggestedAnswers Json?    // Array of suggested answers
  status           QuestionStatus @default(PENDING)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // Relationships
  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  screenshot      Screenshot       @relation(fields: [screenshotId], references: [id], onDelete: Cascade)
  detectedElement DetectedElement? @relation(fields: [detectedElementId], references: [id], onDelete: SetNull)
  answer          TrainingAnswer?

  @@index([userId])
  @@index([screenshotId])
  @@index([status])
  @@index([priority])
}

model TrainingAnswer {
  id             String   @id @default(cuid())
  questionId     String   @unique
  userId         String
  answerText     String
  confidence     Float    @default(1.0)  // User-provided = high confidence
  metadata       Json?    // Additional context
  createdAt      DateTime @default(now())

  // Relationships
  question   TrainingQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)
  user       User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  patterns   Pattern[]

  @@index([userId])
  @@index([questionId])
}

// ==================== Learned Patterns ====================

model Pattern {
  id              String   @id @default(cuid())
  userId          String
  answerId        String?  // Training answer that created this pattern
  applicationName String
  elementType     ElementType
  boundingBox     Json     // Approximate position
  text            String?
  purpose         String   // What this element does
  action          String   // How to use it
  businessContext String?  // Business-specific context
  confidence      Float    @default(1.0)
  usageCount      Int      @default(0)  // Times this pattern has been matched
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relationships
  user             User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  answer           TrainingAnswer?   @relation(fields: [answerId], references: [id], onDelete: SetNull)
  detectedElements DetectedElement[]

  @@index([userId])
  @@index([applicationName])
  @@index([elementType])
  @@index([userId, applicationName])
  @@index([isActive])
}

// ==================== Generated Documentation ====================

model Document {
  id              String   @id @default(cuid())
  userId          String
  organizationId  String
  actionId        String?  // Link to hierarchy
  title           String
  content         String   @db.Text  // Markdown content
  contentType     ContentType @default(MARKDOWN)
  applicationName String
  status          DocumentStatus @default(DRAFT)
  version         Int      @default(1)
  metadata        Json?    // Additional metadata
  publishedAt     DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relationships
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  action       Action?      @relation(fields: [actionId], references: [id], onDelete: SetNull)
  versions     DocumentVersion[]

  @@index([userId])
  @@index([organizationId])
  @@index([actionId])
  @@index([applicationName])
  @@index([status])
}

model DocumentVersion {
  id         String   @id @default(cuid())
  documentId String
  version    Int
  content    String   @db.Text
  changelog  String?
  createdBy  String
  createdAt  DateTime @default(now())

  // Relationships
  document Document @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@unique([documentId, version])
  @@index([documentId])
}

// ==================== Enums ====================

enum Role {
  ADMIN
  OWNER
  MEMBER
  VIEWER
}

enum SubscriptionStatus {
  TRIAL
  ACTIVE
  PAST_DUE
  CANCELED
  EXPIRED
}

enum SubscriptionTier {
  FREE
  STARTER
  PROFESSIONAL
  ENTERPRISE
}

enum WorkflowStatus {
  ACTIVE
  COMPLETED
  ARCHIVED
}

enum ScreenshotStatus {
  UPLOADED
  PROCESSING
  ANALYZED
  FAILED
}

enum ElementType {
  BUTTON
  INPUT
  DROPDOWN
  CHECKBOX
  RADIO
  TABLE
  LABEL
  LINK
  MENU
  DIALOG
  UNKNOWN
}

enum QuestionType {
  PURPOSE      // "What does this do?"
  ACTION       // "What happens when..."
  INPUT        // "What goes in this field?"
  CONTEXT      // "Why is this used?"
}

enum QuestionStatus {
  PENDING
  ANSWERED
  SKIPPED
}

enum ContentType {
  MARKDOWN
  HTML
  PDF
}

enum DocumentStatus {
  DRAFT
  REVIEW
  PUBLISHED
  ARCHIVED
}
```

## Relationships Diagram

```
User ─(1:N)─ OrganizationMember ─(N:1)─ Organization
  │                                          │
  │                                          │
  ├─(1:N)─ Workflow                          │
  │          │                               │
  │          └─(1:N)─ Screenshot             │
  │                     │                    │
  │                     └─(1:N)─ DetectedElement
  │                                 │
  ├─(1:N)─ TrainingQuestion ────────┘
  │          │
  │          └─(1:1)─ TrainingAnswer
  │                     │
  ├─(1:N)─ Pattern ─────┘
  │
  └─(1:N)─ Document


Organization ─(1:N)─ System
                       │
                       └─(1:N)─ Department
                                  │
                                  └─(1:N)─ PracticeGroup
                                             │
                                             └─(1:N)─ ActionGroup
                                                        │
                                                        └─(1:N)─ Action
                                                                   │
                                                                   ├─(1:N)─ Transformation
                                                                   ├─(1:N)─ Workflow
                                                                   └─(1:N)─ Document
```

## Key Data Flows

### 1. Screenshot Upload & Analysis

```sql
-- 1. Create workflow
INSERT INTO "Workflow" (id, user_id, name, application_name, status)
VALUES ('wf123', 'user456', 'Create Lead', 'Salesforce', 'ACTIVE');

-- 2. Upload screenshot
INSERT INTO "Screenshot" (id, user_id, workflow_id, original_url, status)
VALUES ('ss789', 'user456', 'wf123', 's3://...', 'UPLOADED');

-- 3. After vision API analysis, store detected elements
INSERT INTO "DetectedElement" (screenshot_id, element_type, bounding_box, text, confidence)
VALUES 
  ('ss789', 'BUTTON', '{"top":100,"left":50,"width":120,"height":40}', 'Submit', 0.95),
  ('ss789', 'INPUT', '{"top":50,"left":50,"width":200,"height":30}', 'Email', 0.92);

-- 4. Generate questions for unknown elements
INSERT INTO "TrainingQuestion" (user_id, screenshot_id, detected_element_id, question_text, status)
SELECT 'user456', 'ss789', id, 'What happens when you click "Submit"?', 'PENDING'
FROM "DetectedElement"
WHERE screenshot_id = 'ss789' AND pattern_id IS NULL;
```

### 2. Answer Questions & Learn Patterns

```sql
-- 1. User answers question
INSERT INTO "TrainingAnswer" (question_id, user_id, answer_text, confidence)
VALUES ('q123', 'user456', 'Creates a new lead in Salesforce', 1.0);

-- 2. Create pattern from answer
INSERT INTO "Pattern" (
  user_id, answer_id, application_name, element_type,
  boundingBox, text, purpose, action, confidence
)
SELECT 
  'user456',
  'ans789',
  'Salesforce',
  'BUTTON',
  de.bounding_box,
  de.text,
  'Submit button for lead creation',
  'Click to create new lead',
  1.0
FROM "DetectedElement" de
JOIN "TrainingQuestion" tq ON tq.detected_element_id = de.id
WHERE tq.id = 'q123';

-- 3. Link pattern to detected element
UPDATE "DetectedElement"
SET pattern_id = 'pattern456', match_confidence = 1.0
WHERE id = 'element789';
```

### 3. Generate Documentation

```sql
-- 1. Compile all answered questions and matched patterns
SELECT 
  s.id as screenshot_id,
  s.original_url,
  de.element_type,
  de.text,
  de.bounding_box,
  COALESCE(ta.answer_text, p.action) as action_description,
  COALESCE(ta.metadata->>'businessContext', p.business_context) as context
FROM "Screenshot" s
JOIN "DetectedElement" de ON de.screenshot_id = s.id
LEFT JOIN "TrainingQuestion" tq ON tq.detected_element_id = de.id
LEFT JOIN "TrainingAnswer" ta ON ta.question_id = tq.id
LEFT JOIN "Pattern" p ON p.id = de.pattern_id
WHERE s.workflow_id = 'wf123'
ORDER BY 
  (de.bounding_box->>'top')::int,  -- Sort by vertical position
  (de.bounding_box->>'left')::int; -- Then horizontal

-- 2. Create document
INSERT INTO "Document" (
  user_id, organization_id, title, content,
  application_name, status
)
VALUES (
  'user456',
  'org123',
  'How to Create a Lead in Salesforce',
  '[Generated markdown content]',
  'Salesforce',
  'DRAFT'
);
```

## JSON Field Structures

### DetectedElement.boundingBox
```json
{
  "top": 100,
  "left": 50,
  "width": 120,
  "height": 40,
  "vertices": [
    {"x": 50, "y": 100},
    {"x": 170, "y": 100},
    {"x": 170, "y": 140},
    {"x": 50, "y": 140}
  ]
}
```

### DetectedElement.properties
```json
{
  "color": "#007bff",
  "backgroundColor": "#ffffff",
  "fontSize": 14,
  "fontWeight": "bold",
  "borderRadius": 4,
  "visualHash": "abc123..."  // For similarity comparison
}
```

### Screenshot.analysisResult
```json
{
  "text": {
    "fullText": "Email: Submit Order Details",
    "words": [
      {"text": "Email", "confidence": 0.98, "boundingBox": {...}},
      {"text": "Submit", "confidence": 0.95, "boundingBox": {...}}
    ]
  },
  "objects": [
    {"name": "Button", "score": 0.95, "boundingPoly": {...}},
    {"name": "Text box", "score": 0.92, "boundingPoly": {...}}
  ],
  "metadata": {
    "width": 1920,
    "height": 1080,
    "dominantColors": ["#ffffff", "#007bff"]
  }
}
```

### Screenshot.dimensions
```json
{
  "width": 1920,
  "height": 1080,
  "aspectRatio": 1.778
}
```

### TrainingQuestion.suggestedAnswers
```json
[
  "Saves the form",
  "Submits for approval",
  "Cancels the action",
  "Opens a new dialog",
  "Other"
]
```

### Document.metadata
```json
{
  "estimatedReadTime": 5,  // minutes
  "screenshotCount": 8,
  "wordCount": 450,
  "lastReviewed": "2025-10-12T10:00:00Z",
  "tags": ["salesforce", "leads", "crm"],
  "difficulty": "beginner"
}
```

## Validation Rules

### User
- `email`: Valid email format, max 255 chars
- `name`: 1-100 chars (optional)

### Organization
- `name`: 1-100 chars
- `slug`: 3-50 chars, lowercase, alphanumeric + hyphens

### Screenshot
- `fileSize`: Max 10MB (10,485,760 bytes)
- `dimensions.width`: 100-10,000 pixels
- `dimensions.height`: 100-10,000 pixels

### DetectedElement
- `confidence`: 0.0 to 1.0
- `matchConfidence`: 0.0 to 1.0

### TrainingQuestion
- `priority`: 1 to 10
- `questionText`: 10-500 chars

### TrainingAnswer
- `answerText`: 1-2000 chars
- `confidence`: 0.0 to 1.0

### Pattern
- `confidence`: 0.0 to 1.0
- `usageCount`: >= 0
- `purpose`: 1-500 chars
- `action`: 1-1000 chars

### Document
- `title`: 1-200 chars
- `version`: >= 1
- `content`: 1-100,000 chars for MVP

## Indexes

```sql
-- User lookups
CREATE INDEX idx_users_email ON "User"(email);
CREATE INDEX idx_users_clerk_id ON "User"("clerkId");

-- Organization member queries
CREATE INDEX idx_org_members_user ON "OrganizationMember"("userId");
CREATE INDEX idx_org_members_org ON "OrganizationMember"("organizationId");

-- Hierarchy navigation
CREATE INDEX idx_systems_org_order ON "System"("organizationId", "order");
CREATE INDEX idx_departments_system_order ON "Department"("systemId", "order");
CREATE INDEX idx_practice_groups_dept_order ON "PracticeGroup"("departmentId", "order");
CREATE INDEX idx_action_groups_pg_order ON "ActionGroup"("practiceGroupId", "order");
CREATE INDEX idx_actions_ag_order ON "Action"("actionGroupId", "order");

-- Screenshot processing
CREATE INDEX idx_screenshots_user ON "Screenshot"("userId");
CREATE INDEX idx_screenshots_workflow ON "Screenshot"("workflowId");
CREATE INDEX idx_screenshots_status ON "Screenshot"("status");
CREATE INDEX idx_screenshots_job ON "Screenshot"("visionJobId");

-- Pattern matching (most critical for performance)
CREATE INDEX idx_patterns_user_app ON "Pattern"("userId", "applicationName");
CREATE INDEX idx_patterns_type ON "Pattern"("elementType");
CREATE INDEX idx_patterns_active ON "Pattern"("isActive") WHERE "isActive" = true;

-- Training questions
CREATE INDEX idx_questions_screenshot ON "TrainingQuestion"("screenshotId");
CREATE INDEX idx_questions_status ON "TrainingQuestion"("status");
CREATE INDEX idx_questions_priority ON "TrainingQuestion"("priority" DESC);

-- Documents
CREATE INDEX idx_docs_org ON "Document"("organizationId");
CREATE INDEX idx_docs_user ON "Document"("userId");
CREATE INDEX idx_docs_status ON "Document"("status");
CREATE INDEX idx_docs_app ON "Document"("applicationName");

-- Composite index for common query pattern
CREATE INDEX idx_patterns_user_app_type ON "Pattern"("userId", "applicationName", "elementType");
```

## Data Migration Strategy

### Version Control
- Use Prisma Migrate for schema changes
- All migrations tracked in `prisma/migrations/` directory
- Each migration has descriptive name: `20251012_add_pattern_confidence_field`

### Migration Process
```bash
# Create migration
npx prisma migrate dev --name add_pattern_confidence

# Apply to production
npx prisma migrate deploy
```

### Backward Compatibility
- Add new fields as nullable initially
- Deprecate old fields before removing
- Use database views for major schema changes
- Always provide default values for new required fields

### Example Migration (Add field)
```sql
-- Migration: 20251012_add_pattern_usage_count
ALTER TABLE "Pattern" 
ADD COLUMN "usageCount" INTEGER NOT NULL DEFAULT 0;

-- Backfill with actual counts
UPDATE "Pattern" p
SET "usageCount" = (
  SELECT COUNT(*)
  FROM "DetectedElement"
  WHERE "patternId" = p.id
);
```

## Data Retention & Cleanup

### Soft Deletes
- Documents: Mark as `ARCHIVED` instead of deleting
- Patterns: Set `isActive = false` instead of deleting
- Allows data recovery and audit trails

### Hard Deletes (After Retention Period)
```sql
-- Delete old screenshots (after 90 days)
DELETE FROM "Screenshot"
WHERE "createdAt" < NOW() - INTERVAL '90 days'
  AND "workflowId" IN (
    SELECT id FROM "Workflow" WHERE status = 'ARCHIVED'
  );

-- Delete unanswered training questions (after 30 days)
DELETE FROM "TrainingQuestion"
WHERE status = 'PENDING'
  AND "createdAt" < NOW() - INTERVAL '30 days';
```

### S3 Lifecycle Policies
- Move old screenshots to S3 Glacier after 90 days
- Delete from Glacier after 1 year

## Related Documents
- [Web Application Architecture](./architecture-webapp.md)
- [AI Engine Architecture](./architecture-tool.md)
- [API Specification](./api-spec.md)
- [Tech Stack](./tech-stack.md)