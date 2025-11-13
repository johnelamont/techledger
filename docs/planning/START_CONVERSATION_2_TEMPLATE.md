# Prompt Template for Starting Conversation 2

Copy and paste this into a new Claude conversation to start Conversation 2.

---

## 📝 **The Prompt:**

```
I'm starting Conversation 2: Role/Task Navigation System for my TechLedger project.

CONTEXT:
I've completed Conversation 1 with working CRUD operations for Users, Systems, 
Actions, and Screenshots. My backend uses:
- TypeScript + Node.js + Express
- PostgreSQL database
- All queries consolidated in queries.ts file
- Routes follow the pattern: express router with proper error handling
- Validation with exported functions (validateRequired, validateEmail, validatePositiveInteger)

PROJECT OVERVIEW:
TechLedger is a SaaS platform using collaborative AI to help small businesses 
create and maintain technology documentation. I'm implementing the Role/Task 
navigation system from ADR 002 to solve the "messy middle" problem between 
organizational hierarchy and user mental models.

DATABASE SCHEMA READY:
I already have these tables in my database (schema-v2.sql):
- roles (id, user_id, name, description, display_order, created_at)
- tasks (id, user_id, name, description, display_order, created_at)
- role_tasks (id, role_id, task_id, display_order) - junction table
- task_actions (id, task_id, action_id, display_order, notes) - junction table

WHAT I NEED:
Please create the complete implementation for Conversation 2:

1. TypeScript types to add to models.ts:
   - Role, CreateRoleInput, UpdateRoleInput
   - Task, CreateTaskInput, UpdateTaskInput
   - RoleTask, CreateRoleTaskInput
   - TaskAction, CreateTaskActionInput
   - Any helper types needed

2. Query functions (follow my existing queries.ts pattern):
   - Role CRUD: createRole, getRoleById, getRolesByUserId, updateRole, deleteRole
   - Task CRUD: createTask, getTaskById, getTasksByUserId, updateTask, deleteTask
   - RoleTask junction: linkTaskToRole, unlinkTaskFromRole, getTasksForRole, 
     getRolesForTask, reorderTaskInRole
   - TaskAction junction: linkActionToTask, unlinkActionFromTask, getActionsForTask,
     getTasksForAction, reorderActionInTask

3. Complete roleRoutes.ts with endpoints:
   - GET /api/roles - List all roles for user
   - POST /api/roles - Create role
   - GET /api/roles/:id - Get role by ID
   - PUT /api/roles/:id - Update role
   - DELETE /api/roles/:id - Delete role
   - GET /api/roles/:roleId/tasks - Get all tasks for role (with order)
   - POST /api/roles/:roleId/tasks - Link task to role
   - DELETE /api/roles/:roleId/tasks/:taskId - Unlink task from role
   - PUT /api/roles/:roleId/tasks/:taskId/order - Update task order

4. Complete taskRoutes.ts with endpoints:
   - GET /api/tasks - List all tasks for user
   - POST /api/tasks - Create task
   - GET /api/tasks/:id - Get task by ID
   - PUT /api/tasks/:id - Update task
   - DELETE /api/tasks/:id - Delete task
   - GET /api/tasks/:taskId/actions - Get all actions for task (with order)
   - POST /api/tasks/:taskId/actions - Link action to task
   - DELETE /api/tasks/:taskId/actions/:actionId - Unlink action from task
   - PUT /api/tasks/:taskId/actions/:actionId/order - Update action order

REQUIREMENTS:
- Follow the same patterns as my existing code
- All queries use parameterized SQL
- Routes have proper error handling (400, 404, 409, 500)
- Input validation using validateRequired, validatePositiveInteger
- Consistent JSON response format: {success, data, message}
- Support pagination on list endpoints
- Include helpful comments

Please provide complete, production-ready code that I can copy directly into 
my project files.
```

---

## 📎 **Files to Attach:**

When you start the new conversation, attach these files:

1. **CONVERSATION_2_KICKOFF.md** - Overview and requirements
2. **ADR_001__Cloud-Based_Architecture_Decision.md** - From your /mnt/project/ directory
3. **Current models.ts** - So Claude can add types in the right format
4. **Sample from queries.ts** - First 200 lines to show pattern
5. **Sample route file** (systemRoutes.ts or userRoutes.ts) - To show route pattern

---

## 💡 **Tips:**

1. Start with a fresh conversation (don't continue this one - context gets too large)
2. Attach the kickoff guide and your current files
3. Use the prompt above
4. Claude will generate all the code you need
5. Copy the files into your project
6. Wire them up in server.ts
7. Test with Postman

---

## ✅ **What You'll Get:**

After running this prompt with a fresh Claude, you'll receive:
- Complete TypeScript types for roles and tasks
- All query functions for CRUD and linking
- Complete roleRoutes.ts file
- Complete taskRoutes.ts file
- Integration instructions

Then just:
1. Add types to models.ts
2. Add queries to queries.ts (or create separate files)
3. Copy route files to src/routes/
4. Register routes in server.ts
5. Test!

---

## 🎯 **Expected Time:**

- Claude generating code: 5-10 minutes
- You integrating code: 20-30 minutes
- Testing: 30 minutes
- **Total: ~1 hour**

Much faster than Conversation 1 because patterns are established!

---

## 🚀 **Ready to Start?**

1. Open a new Claude conversation
2. Copy the prompt above
3. Attach the required files
4. Let Claude generate the code
5. Integrate and test

Good luck with Conversation 2! 🎉
