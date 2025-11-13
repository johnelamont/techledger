# Conversation 2: Role/Task Navigation System

**Status:** Ready to Start  
**Estimated Time:** 2-3 hours  
**Dependencies:** Conversation 1 ✅ Complete

---

## 🎯 **What We're Building**

From ADR 002, we're implementing the **Role-Based and Task-Based Navigation Model** that solves the "messy middle" problem:

**The Challenge:**
- Large companies think: Departments → Practice Groups → Actions
- Small businesses think: "What do I need to do today?"

**The Solution:**
Many-to-many relationships allowing multiple navigation paths to the same content:
```
Role ←(many-to-many)→ Task ←(many-to-many)→ Action
```

---

## 📋 **Deliverables**

### **Database Layer (queries)**
- [ ] CRUD functions for Roles table
- [ ] CRUD functions for Tasks table
- [ ] Junction table: Role ↔ Task (role_tasks)
- [ ] Junction table: Task ↔ Action (task_actions)
- [ ] Order management (display_order handling)
- [ ] Get all tasks for a role
- [ ] Get all actions for a task
- [ ] Get all roles that have a specific task
- [ ] Reorder tasks within a role
- [ ] Reorder actions within a task

### **API Routes**
- [ ] `GET /api/roles` - List all roles
- [ ] `POST /api/roles` - Create role
- [ ] `GET /api/roles/:id` - Get role by ID
- [ ] `PUT /api/roles/:id` - Update role
- [ ] `DELETE /api/roles/:id` - Delete role
- [ ] `GET /api/roles/:roleId/tasks` - Get all tasks for a role
- [ ] `POST /api/roles/:roleId/tasks` - Link task to role
- [ ] `DELETE /api/roles/:roleId/tasks/:taskId` - Unlink task from role
- [ ] `PUT /api/roles/:roleId/tasks/:taskId/order` - Reorder task

- [ ] `GET /api/tasks` - List all tasks
- [ ] `POST /api/tasks` - Create task
- [ ] `GET /api/tasks/:id` - Get task by ID
- [ ] `PUT /api/tasks/:id` - Update task
- [ ] `DELETE /api/tasks/:id` - Delete task
- [ ] `GET /api/tasks/:taskId/actions` - Get all actions for a task
- [ ] `POST /api/tasks/:taskId/actions` - Link action to task
- [ ] `DELETE /api/tasks/:taskId/actions/:actionId` - Unlink action from task
- [ ] `PUT /api/tasks/:taskId/actions/:actionId/order` - Reorder action

**Total:** ~18 new endpoints

---

## 📊 **Database Schema (Already Done!)**

You already have this in `schema-v2.sql`:

```sql
-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role-Task junction
CREATE TABLE IF NOT EXISTS role_tasks (
    id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    UNIQUE(role_id, task_id)
);

-- Task-Action junction
CREATE TABLE IF NOT EXISTS task_actions (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    action_id INTEGER REFERENCES actions(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    notes TEXT,
    UNIQUE(task_id, action_id)
);
```

✅ **Schema is ready!** Just need to implement queries and routes.

---

## 🎓 **Key Concepts**

### **1. Roles**
Who someone is in the organization
- Examples: "Sales Representative", "Office Manager", "Accountant"
- Small businesses: Few roles, people wear multiple hats
- Large businesses: Many roles, typically one per person

### **2. Tasks**
What needs to be accomplished
- Examples: "Qualify New Lead", "Process Vendor Payment", "Generate Monthly Report"
- Goal-oriented collections of actions
- Same task can be relevant to multiple roles

### **3. Actions**
Atomic documentation units (already built in Conversation 1)
- Examples: "Login to Salesforce", "Create Invoice", "Update Lead Score"
- Can belong to multiple tasks
- Single source of truth - update once, changes everywhere

### **4. Many-to-Many Relationships**
- One Role can have many Tasks
- One Task can belong to many Roles
- One Task can have many Actions
- One Action can belong to many Tasks

---

## 🔍 **Example Use Case**

**Small Business Owner:**
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

**Power User Search:**
```
Search: "Create Invoice"
  → Action: "Create Vendor Payment"
    → Found via:
      • Role: Office Manager → Task: Pay Vendors → Step 3
      • Role: Accountant → Task: Month-End Close → Step 7
```

---

## 📁 **Files to Create**

### **1. Types** (add to existing `types/models.ts`)
```typescript
// Role types
export interface Role {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  display_order: number;
  created_at: Date;
}

export interface CreateRoleInput {
  user_id: number;
  name: string;
  description?: string;
  display_order?: number;
}

// Task types
export interface Task {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  display_order: number;
  created_at: Date;
}

// Junction types
export interface RoleTask {
  id: number;
  role_id: number;
  task_id: number;
  display_order: number;
}

export interface TaskAction {
  id: number;
  task_id: number;
  action_id: number;
  display_order: number;
  notes: string | null;
}
```

### **2. Queries** (either add to `queries.ts` or create separate files)
- Role CRUD functions
- Task CRUD functions
- RoleTask junction functions
- TaskAction junction functions
- Navigation helper functions

### **3. Routes**
- `roleRoutes.ts` - Role management + task linking
- `taskRoutes.ts` - Task management + action linking

---

## 🎯 **Success Criteria**

After Conversation 2, you should be able to:
- [ ] Create roles (e.g., "Sales Rep", "Office Manager")
- [ ] Create tasks (e.g., "Qualify Lead", "Pay Vendors")
- [ ] Link tasks to roles
- [ ] Link actions to tasks
- [ ] Get all tasks for a role (in order)
- [ ] Get all actions for a task (in order)
- [ ] Reorder tasks within a role
- [ ] Reorder actions within a task
- [ ] Same action appears in multiple tasks
- [ ] Navigate: Role → Task → Actions

---

## 🧪 **Testing Example**

```bash
# 1. Create a role
POST /api/roles
{
  "user_id": 1,
  "name": "Office Manager",
  "description": "Handles daily operations"
}

# 2. Create a task
POST /api/tasks
{
  "user_id": 1,
  "name": "Pay Vendors",
  "description": "Process vendor payments"
}

# 3. Link task to role
POST /api/roles/1/tasks
{
  "task_id": 1,
  "display_order": 1
}

# 4. Link actions to task
POST /api/tasks/1/actions
{
  "action_id": 1,  # "Login to QuickBooks"
  "display_order": 1
}

POST /api/tasks/1/actions
{
  "action_id": 2,  # "Navigate to Vendors"
  "display_order": 2
}

# 5. Get the full navigation
GET /api/roles/1/tasks
# Returns tasks for Office Manager

GET /api/tasks/1/actions
# Returns ordered actions for "Pay Vendors"
```

---

## 💡 **Implementation Strategy**

### **Phase A: Basic CRUD (1 hour)**
1. Add types to `models.ts`
2. Add Role CRUD queries
3. Add Task CRUD queries
4. Create `roleRoutes.ts` (basic CRUD only)
5. Create `taskRoutes.ts` (basic CRUD only)
6. Test basic CRUD works

### **Phase B: Linking (1 hour)**
1. Add RoleTask junction queries
2. Add TaskAction junction queries
3. Add linking endpoints to routes
4. Test linking works

### **Phase C: Navigation (30 min)**
1. Add "get tasks for role" queries
2. Add "get actions for task" queries
3. Add navigation endpoints
4. Test full navigation flow

---

## 🔗 **Context for Claude**

When starting Conversation 2, provide:
1. **This file** (CONVERSATION_2_KICKOFF.md)
2. **ADR 002** (Role/Task Navigation Decision)
3. Your current `queries.ts` file (so patterns match)
4. Your current `models.ts` file (to add types)
5. One example route file (e.g., `systemRoutes.ts`) for pattern reference

---

## 📝 **Conversation 2 Prompt Template**

When you start the new conversation, say:

```
I'm ready to start Conversation 2: Role/Task Navigation System.

I've completed Conversation 1 with working CRUD operations for Users, Systems, 
Actions, and Screenshots. Now I need to build the Role/Task navigation system 
described in ADR 002.

I have:
- Database schema already created (roles, tasks, role_tasks, task_actions tables)
- Types that need to be added to models.ts
- Need queries for Role/Task CRUD and junction tables
- Need routes for roles and tasks

Please create:
1. TypeScript types for Role, Task, RoleTask, TaskAction (to add to models.ts)
2. Query functions for Role/Task CRUD and linking
3. roleRoutes.ts with all endpoints
4. taskRoutes.ts with all endpoints

Follow the same patterns from Conversation 1 (queries.ts style, route structure).
```

Attach:
- CONVERSATION_2_KICKOFF.md (this file)
- ADR_001__Cloud-Based_Architecture_Decision.md (from your project)
- Your current backend/src/types/models.ts
- Your current backend/src/db/queries.ts (first 100 lines for pattern)
- Your current backend/src/routes/systemRoutes.ts (for route pattern)

---

## ⏭️ **After Conversation 2**

Once complete, you'll have:
- ✅ Full navigation system (Role → Task → Action)
- ✅ Multiple discovery paths to same content
- ✅ Ready for small business use case
- ✅ Foundation for large company hierarchy

**Next:** Conversation 3: Screenshot Processing Pipeline

---

## 🎉 **You're Ready!**

Conversation 1 was the hardest part (database foundation). Conversation 2 follows the same patterns you've already established. You've got this!

Start whenever you're ready. Good luck! 🚀
