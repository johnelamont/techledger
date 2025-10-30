# Data Models & Schemas

**Project:** techledger  
**Last Updated:** 2025-10-12  
**Database:** PostgreSQL 15+ with SQLAlchemy ORM (Python)

## Database Schema Overview

TechLedger uses a relational database (PostgreSQL) to store users, organizations, screenshots, patterns, training data, and generated documentation. The schema is designed to support:

- Multi-tenancy (organizations with multiple users)
- Hierarchical tech stack organization (System → Department → ... → Actions)
- Role-based and Task-based navigation (many-to-many)
- Rich, block-based content with branching support (OneNote-like)
- Pattern learning and reuse
- Training history and audit trails
- Action templates (organization-wide sharing)
- Edit locking (one user at a time)
- Future-ready version history

## SQLAlchemy Schema (Python)

```python
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ARRAY, Index, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

# ==================== User Management ====================

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(100))
    clerk_id = Column(String, unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    organization_members = relationship("OrganizationMember", back_populates="user", cascade="all, delete-orphan")
    screenshots = relationship("Screenshot", back_populates="user")
    patterns = relationship("Pattern", back_populates="user")
    documents = relationship("Document", back_populates="user")

class Organization(Base):
    __tablename__ = "organizations"
    
    id = Column(String, primary_key=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(50), unique=True, nullable=False, index=True)
    stripe_customer_id = Column(String, unique=True)
    subscription_status = Column(String(20), default="TRIAL")
    subscription_tier = Column(String(20), default="FREE")
    trial_ends_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    members = relationship("OrganizationMember", back_populates="organization")
    systems = relationship("System", back_populates="organization")
    documents = relationship("Document", back_populates="organization")
    templates = relationship("ActionTemplate", back_populates="organization")

class OrganizationMember(Base):
    __tablename__ = "organization_members"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    organization_id = Column(String, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), default="MEMBER")  # ADMIN, OWNER, MEMBER, VIEWER
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="organization_members")
    organization = relationship("Organization", back_populates="members")

# ==================== Tech Stack Hierarchy ====================

class System(Base):
    __tablename__ = "systems"
    
    id = Column(String, primary_key=True)
    organization_id = Column(String, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_edited_by = Column(String, nullable=False)
    
    # Relationships
    organization = relationship("Organization", back_populates="systems")
    departments = relationship("Department", back_populates="system", cascade="all, delete-orphan")

class Department(Base):
    __tablename__ = "departments"
    
    id = Column(String, primary_key=True)
    system_id = Column(String, ForeignKey("systems.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_edited_by = Column(String, nullable=False)
    
    # Relationships
    system = relationship("System", back_populates="departments")
    practice_groups = relationship("PracticeGroup", back_populates="department", cascade="all, delete-orphan")

class PracticeGroup(Base):
    __tablename__ = "practice_groups"
    
    id = Column(String, primary_key=True)
    department_id = Column(String, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_edited_by = Column(String, nullable=False)
    
    # Relationships
    department = relationship("Department", back_populates="practice_groups")
    action_groups = relationship("ActionGroup", back_populates="practice_group", cascade="all, delete-orphan")

class ActionGroup(Base):
    __tablename__ = "action_groups"
    
    id = Column(String, primary_key=True)
    practice_group_id = Column(String, ForeignKey("practice_groups.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_edited_by = Column(String, nullable=False)
    
    # Relationships
    practice_group = relationship("PracticeGroup", back_populates="action_groups")
    actions = relationship("Action", back_populates="action_group", cascade="all, delete-orphan")

class Action(Base):
    """
    Action: Atomic documentation unit with rich, OneNote-like content.
    Supports branching workflows and multimedia content blocks.
    """
    __tablename__ = "actions"
    
    id = Column(String, primary_key=True)
    action_group_id = Column(String, ForeignKey("action_groups.id", ondelete="CASCADE"))
    
    # Basic Info
    name = Column(String(200), nullable=False)
    description = Column(String(1000), nullable=False)
    application_name = Column(String(100), nullable=False, index=True)
    
    # Rich Content (JSONB for flexibility and queryability)
    content = Column(JSONB, nullable=False)  # ActionContent structure
    
    # Relationships (stored as arrays for simplicity)
    related_actions = Column(ARRAY(String), default=[])
    prerequisites = Column(ARRAY(String), default=[])
    
    # Discovery Metadata
    difficulty = Column(String(20), default="beginner")  # beginner, intermediate, advanced
    estimated_time = Column(Integer, default=0)  # minutes
    tags = Column(ARRAY(String), default=[])
    
    # Many-to-many with Tasks (via TaskAction junction table)
    # tasks = relationship defined via TaskAction
    
    # Version Tracking (future-ready for full version history)
    version = Column(Integer, default=1)
    
    # Edit Locking (one user at a time)
    locked_by = Column(String)
    locked_at = Column(DateTime)
    lock_expires_at = Column(DateTime)
    
    # Status
    status = Column(String(20), default="draft", index=True)  # draft, published, archived
    is_active = Column(Boolean, default=True, index=True)
    
    # Audit
    created_by = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_edited_by = Column(String, nullable=False)
    last_edited_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    action_group = relationship("ActionGroup", back_populates="actions")
    transformations = relationship("Transformation", back_populates="action", cascade="all, delete-orphan")
    task_actions = relationship("TaskAction", back_populates="action")
    
# Indexes for Actions
Index('idx_actions_content_search', Action.content, postgresql_using='gin')
Index('idx_actions_tags', Action.tags, postgresql_using='gin')
Index('idx_actions_active_locks', 
      Action.locked_by, Action.lock_expires_at,
      postgresql_where=(Action.locked_by.isnot(None)))

class Transformation(Base):
    """
    Transformation: Technical details about data operations.
    For power users and developers only.
    """
    __tablename__ = "transformations"
    
    id = Column(String, primary_key=True)
    action_id = Column(String, ForeignKey("actions.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(200), nullable=False)
    description = Column(Text)
    
    # Data transformation schemas
    input_data = Column(JSONB)  # DataSchema structure
    output_data = Column(JSONB)  # DataSchema structure
    
    # Technical content (markdown)
    content = Column(Text)
    
    # Visibility control
    visibility = Column(String(20), default="power_users")  # all, power_users, developers
    
    order = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    last_edited_by = Column(String, nullable=False)
    last_edited_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    action = relationship("Action", back_populates="transformations")

# ==================== Role-Based Navigation (ADR 002) ====================

class Role(Base):
    """
    Role: Job function or position (e.g., Sales Rep, Office Manager)
    """
    __tablename__ = "roles"
    
    id = Column(String, primary_key=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text)
    order = Column(Integer, default=0)
    is_system_role = Column(Boolean, default=False)  # Built-in vs custom
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    role_tasks = relationship("RoleTask", back_populates="role")

class Task(Base):
    """
    Task: Goal-oriented collection of Actions (e.g., "Process Vendor Payment")
    """
    __tablename__ = "tasks"
    
    id = Column(String, primary_key=True)
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    role_tasks = relationship("RoleTask", back_populates="task")
    task_actions = relationship("TaskAction", back_populates="task")

class RoleTask(Base):
    """
    Junction table: Roles ↔ Tasks (many-to-many)
    """
    __tablename__ = "role_tasks"
    
    id = Column(String, primary_key=True)
    role_id = Column(String, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)
    task_id = Column(String, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    order = Column(Integer, default=0)
    
    # Relationships
    role = relationship("Role", back_populates="role_tasks")
    task = relationship("Task", back_populates="role_tasks")

class TaskAction(Base):
    """
    Junction table: Tasks ↔ Actions (many-to-many)
    """
    __tablename__ = "task_actions"
    
    id = Column(String, primary_key=True)
    task_id = Column(String, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    action_id = Column(String, ForeignKey("actions.id", ondelete="CASCADE"), nullable=False)
    order = Column(Integer, default=0)
    notes = Column(Text)  # Optional context for this step
    
    # Relationships
    task = relationship("Task", back_populates="task_actions")
    action = relationship("Action", back_populates="task_actions")

# ==================== Action Templates ====================

class ActionTemplate(Base):
    """
    Action Templates: Reusable starting points for creating Actions.
    Shared organization-wide.
    """
    __tablename__ = "action_templates"
    
    id = Column(String, primary_key=True)
    organization_id = Column(String, ForeignKey("organizations.id", ondelete="CASCADE"))
    
    name = Column(String(200), nullable=False)
    description = Column(String(1000))
    category = Column(String(50), index=True)  # authentication, data_entry, reporting, etc.
    
    # Template content (same structure as Action.content)
    content = Column(JSONB, nullable=False)
    
    # Template metadata
    is_system_template = Column(Boolean, default=False, index=True)  # TechLedger built-in
    created_by = Column(String)
    use_count = Column(Integer, default=0)  # Track popularity
    thumbnail_url = Column(String)
    tags = Column(ARRAY(String), default=[])
    
    # Future: sharing between organizations
    is_public = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    organization = relationship("Organization", back_populates="templates")

Index('idx_templates_category_usage', ActionTemplate.category, ActionTemplate.use_count)

# ==================== Training & Screenshots ====================

class Workflow(Base):
    __tablename__ = "workflows"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action_id = Column(String, ForeignKey("actions.id", ondelete="SET NULL"))
    name = Column(String(200), nullable=False)
    application_name = Column(String(100), nullable=False, index=True)
    description = Column(Text)
    status = Column(String(20), default="ACTIVE", index=True)  # ACTIVE, COMPLETED, ARCHIVED
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    screenshots = relationship("Screenshot", back_populates="workflow")

class Screenshot(Base):
    __tablename__ = "screenshots"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    workflow_id = Column(String, ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    
    original_url = Column(String, nullable=False)  # S3 URL
    thumbnail_url = Column(String)
    annotated_url = Column(String)  # With bounding boxes
    file_size = Column(Integer)  # Bytes
    dimensions = Column(JSONB)  # {width, height}
    
    status = Column(String(20), default="UPLOADED", index=True)  # UPLOADED, PROCESSING, ANALYZED, FAILED
    vision_job_id = Column(String, index=True)  # Celery job ID
    analysis_result = Column(JSONB)  # Raw Vision API response
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="screenshots")
    workflow = relationship("Workflow", back_populates="screenshots")
    detected_elements = relationship("DetectedElement", back_populates="screenshot")

class DetectedElement(Base):
    __tablename__ = "detected_elements"
    
    id = Column(String, primary_key=True)
    screenshot_id = Column(String, ForeignKey("screenshots.id", ondelete="CASCADE"), nullable=False)
    
    element_type = Column(String(20), nullable=False, index=True)  # BUTTON, INPUT, etc.
    bounding_box = Column(JSONB, nullable=False)  # {top, left, width, height}
    text = Column(String)
    confidence = Column(Float)  # 0.0 to 1.0
    properties = Column(JSONB)  # Visual properties
    
    # Pattern matching
    pattern_id = Column(String, ForeignKey("patterns.id", ondelete="SET NULL"))
    match_confidence = Column(Float)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    screenshot = relationship("Screenshot", back_populates="detected_elements")
    pattern = relationship("Pattern", back_populates="detected_elements")

class TrainingQuestion(Base):
    __tablename__ = "training_questions"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    screenshot_id = Column(String, ForeignKey("screenshots.id", ondelete="CASCADE"), nullable=False)
    detected_element_id = Column(String, ForeignKey("detected_elements.id", ondelete="SET NULL"))
    
    question_text = Column(String(500), nullable=False)
    question_type = Column(String(20), nullable=False)  # PURPOSE, ACTION, INPUT, CONTEXT
    priority = Column(Integer, default=5)  # 1-10
    suggested_answers = Column(JSONB)  # Array of suggested answers
    
    status = Column(String(20), default="PENDING", index=True)  # PENDING, ANSWERED, SKIPPED
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class TrainingAnswer(Base):
    __tablename__ = "training_answers"
    
    id = Column(String, primary_key=True)
    question_id = Column(String, ForeignKey("training_questions.id", ondelete="CASCADE"), unique=True, nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    answer_text = Column(String(2000), nullable=False)
    confidence = Column(Float, default=1.0)
    metadata = Column(JSONB)
    
    created_at = Column(DateTime, default=datetime.utcnow)

# ==================== Learned Patterns ====================

class Pattern(Base):
    __tablename__ = "patterns"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    answer_id = Column(String, ForeignKey("training_answers.id", ondelete="SET NULL"))
    
    application_name = Column(String(100), nullable=False, index=True)
    element_type = Column(String(20), nullable=False, index=True)
    bounding_box = Column(JSONB)
    text = Column(String)
    
    # What this pattern means
    purpose = Column(String(500), nullable=False)
    action = Column(String(1000), nullable=False)
    business_context = Column(Text)
    
    confidence = Column(Float, default=1.0)
    usage_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="patterns")
    detected_elements = relationship("DetectedElement", back_populates="pattern")

Index('idx_patterns_user_app', Pattern.user_id, Pattern.application_name)
Index('idx_patterns_user_app_type', Pattern.user_id, Pattern.application_name, Pattern.element_type)

# ==================== Generated Documentation ====================

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    organization_id = Column(String, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    action_id = Column(String, ForeignKey("actions.id", ondelete="SET NULL"))
    
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)  # Markdown content
    content_type = Column(String(20), default="MARKDOWN")  # MARKDOWN, HTML, PDF
    application_name = Column(String(100), nullable=False, index=True)
    
    status = Column(String(20), default="DRAFT", index=True)  # DRAFT, REVIEW, PUBLISHED, ARCHIVED
    version = Column(Integer, default=1)
    metadata = Column(JSONB)
    
    published_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="documents")
    organization = relationship("Organization", back_populates="documents")
    versions = relationship("DocumentVersion", back_populates="document")

class DocumentVersion(Base):
    __tablename__ = "document_versions"
    
    id = Column(String, primary_key=True)
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    version = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    changelog = Column(String(500))
    created_by = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    document = relationship("Document", back_populates="versions")
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