# TechLedger

AI-assisted documentation generation for business processes.

**Last Updated:** 2025-10-31  
**Current Phase:** Planning & Architecture

---

## Project Structure

```
techledger/
├── docs/               # All project documentation
│   ├── ADRs/          # Architecture Decision Records
│   ├── architecture/  # System design, tech stack, data models
│   ├── operations/    # Deployment, security, testing strategy
│   ├── planning/      # Project planning and open issues
│   ├── strategy/      # VMOSA, requirements, success metrics
│   └── user-guides/   # User documentation (post-MVP)
├── src/               # Application source code
│   ├── frontend/      # React + TypeScript SPA
│   ├── backend/       # Node.js + Express API
│   └── shared/        # Shared types and utilities
├── infrastructure/    # Deployment configurations
├── tests/             # Test suites
└── README.md          # This file
```

---

## Current Development Phase

### Phase 0: Planning & Architecture ✅ (Complete)
- ✅ ADR 001: Cloud-Based Architecture
- ✅ ADR 002: Role-Based Navigation Model
- ✅ Repository structure established
- ✅ Technology stack decisions documented

### Phase 1: MVP Development (Months 1-6) - Starting Soon
- React frontend with screenshot upload
- Google Cloud Vision integration
- Conversational AI training interface
- Basic documentation generation
- PostgreSQL database setup

**Next Milestone:** Begin frontend development - Date TBD

---

## Architecture Decisions

All major architectural decisions are documented as ADRs:

- [ADR 001: Cloud-Based Architecture](docs/ADRs/001-cloud-architecture.md) - Pure cloud processing with browser upload
- [ADR 002: Role-Based Navigation](docs/ADRs/002-role-based-navigation.md) - Multi-path navigation model

**Future ADRs planned:**
- Frontend Technology Stack (React + TypeScript details)
- Backend Technology Stack (Node.js implementation)
- Computer Vision Provider Selection (Google vs AWS)
- Authentication Provider Selection

---

## Key Documentation

### Strategy & Planning
- **Vision & Mission:** `docs/strategy/vmosa.md`
- **Requirements:** `docs/strategy/requirements-features.md`
- **Success Metrics:** `docs/strategy/success-metrics.md`
- **Timeline:** `docs/strategy/timeline-milestones.md`
- **User Flows:** `docs/strategy/user-flows-ux.md`
- **Glossary:** `docs/strategy/glossary.md`

### Technical Architecture
- **Tech Stack:** `docs/architecture/tech-stack.md`
- **Data Models:** `docs/architecture/data_models_schemas_md.md`
- **Architecture Overview:** `docs/architecture/architecture-webapp.md`
- **API Specifications:** `docs/architecture/api-spec.md`
- **Dependencies:** `docs/architecture/dependencies.md`

### Operations
- **Business Operations:** `docs/operations/business_operations_md.md`
- **Deployment & DevOps:** `docs/operations/deployment-devops.md`
- **Security & Compliance:** `docs/operations/security-compliance.md`
- **Testing Strategy:** `docs/operations/testing-strategy.md`

---

## Using This Manifest with Claude.ai

This is a **living documentation system** designed to be used iteratively with Claude.ai to manage project complexity.

### Workflow

1. **Upload relevant files** to Claude.ai (or add to Claude Projects)
2. **Ask questions** or provide commands about features, architecture, or decisions
3. **Review Claude's output** - code, documentation updates, or recommendations
4. **Integrate approved changes** back into the manifest
5. **Commit to Git** to maintain version history

### Best Practices

- **Keep documentation current** - Update files as decisions are made
- **Document major decisions** - Create new ADRs for significant architectural choices
- **Update timestamps** - Change "Last Updated" dates in modified files
- **Track changes** - Use `changelog.md` for significant manifest updates
- **Link decisions** - Reference ADRs in code comments and related docs

### Managing Complexity

As TechLedger grows:
- Add new documentation files as needed
- Reorganize folders when it makes sense
- Update this README when structure changes
- Document structural changes in `changelog.md`
- Keep the ADR index current

---

## Getting Started

### For New Team Members

1. Read the [Vision & Mission](docs/strategy/vmosa.md) to understand project goals
2. Review [ADR 001](docs/ADRs/001-cloud-architecture.md) for architectural foundation
3. Check [Requirements](docs/strategy/requirements-features.md) for feature scope
4. Review [Tech Stack](docs/architecture/tech-stack.md) for implementation decisions

### For Development

Source code development begins in Phase 1. See ADRs for technical stack decisions.

**Tech Stack Overview:**
- **Frontend:** React + TypeScript SPA
- **Backend:** Node.js + Express API
- **Vision Processing:** Google Cloud Vision API
- **Database:** PostgreSQL
- **Hosting:** Vercel (frontend) + Railway/Render (backend)
- **Authentication:** Clerk, Auth0, or Supabase Auth

---

## Project Team

- **Project Lead:** John Lamont
- **Technical Lead:** John Lamont
- **Stakeholders:** John Lamont
- **Development Model:** Solo developer, 12-18 month MVP timeline

---

## Links

- **Repository:** [GitHub - johnelamont/techledger](https://github.com/johnelamont/techledger)
- **Project Board:** TBD
- **Live Site:** TBD (post-MVP)
- **Public Documentation:** TBD (post-MVP)

---

## Quick Reference

### Making Decisions
1. Discuss options (with Claude.ai or team)
2. Create an ADR in `docs/ADRs/` using the established format
3. Link related decisions in the ADR
4. Update this README if it affects project structure

### Adding Features
1. Document requirements in `docs/strategy/requirements-features.md`
2. Create technical specs in `docs/architecture/`
3. Update data models if needed
4. Link to relevant ADRs

### Development Workflow (Phase 1+)
1. Check `docs/planning/` for current priorities
2. Review relevant ADRs for technical guidance
3. Implement in `src/frontend/` or `src/backend/`
4. Add tests in `tests/`
5. Update documentation as needed

---

**Note:** This structure is flexible and will evolve with the project. Document significant changes in `changelog.md` and update this README accordingly.
