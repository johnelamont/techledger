# TechLedger

AI-assisted documentation generation for business processes.

## Project Structure

- `docs/` - All project documentation
  - `ADRs/` - Architecture Decision Records
  - `api/` - Post MVP external facing REST API documentation
  - `architecture/` - System design docs
  - `operations/` - Business, Deployment, Security and Compliance
  - `planning/` - Project planning and open issues
  - `strategy/` - VMOSA, Glossary, Features, Success metrics, etc.
  - `user-guides` - Post MVP
- `src/` - Application source code (Phase 1 development)
  - `frontend/` - React + TypeScript SPA
  - `backend/` - Node.js + Express API
  - `shared/` - Shared types and utilities
- `infrastructure/` - Deployment configurations
- `tests/` - Test suites

## Current Phase

**Phase 0: Planning & Architecture** ✅
- ✅ ADR 001: Cloud-Based Architecture
- ✅ ADR 002: Role-Based Navigation Model

**Phase 1: MVP Development** (Months 1-6) - Starting Soon
- React frontend with screenshot upload
- Google Cloud Vision integration
- Basic documentation generation

## Architecture Decisions

- [ADR 001: Cloud-Based Architecture](docs/ADRs/001-cloud-architecture.md)
- [ADR 002: Role-Based Navigation](docs/ADRs/002-role-based-navigation.md)

## Development

Source code development begins in Phase 1. See ADRs for technical stack decisions.

# techledger - Project Manifest

**Last Updated:** 2025-10-11  
**Current Phase:** Planning

## About This Manifest

This manifest is a living document that tracks all aspects of the techledger project. It is designed to be used iteratively with Claude.ai to manage project complexity over time.

## Structure

```
/strategy           - Vision, mission, objectives, and success metrics
/product           - Requirements, features, user flows, and terminology
/technical         - Architecture, tech stack, data models, and APIs
/operations        - Deployment, testing, and security
/decisions         - Decision log and open issues
/reference         - Constraints and external references
changelog.md       - Version history of manifest changes
```

## How to Use This Manifest

### With Claude.ai
1. Upload relevant manifest files to Claude.ai (or add to Claude Projects)
2. Ask questions or provide commands
3. Claude will generate updates or new content
4. Review Claude's output
5. Integrate approved changes back into the manifest
6. Commit changes to Git

### Updating the Manifest
- Keep files up to date as decisions are made
- Use the `decisions/decisions-log.md` for tracking major decisions
- Update `changelog.md` with significant changes
- Review and update the "Last Updated" date in modified files

## Quick Start

1. Fill out `strategy/vmosa.md` with your vision and mission
2. Define initial requirements in `product/requirements-features.md`
3. Make technology decisions in `technical/tech-stack.md`
4. Document decisions in `decisions/decisions-log.md`

## Current Status

**Phase:** Planning
**Sprint:** NA
**Next Milestone:** Development - date unknown

## Notes on Structure Changes

This structure is flexible. As the project evolves:
- Add new files as needed
- Reorganize folders if it makes sense
- Update this README when structure changes
- Document structural changes in changelog.md

## Key Contacts

- **Project Lead:** [Name]
- **Technical Lead:** [Name]
- **Stakeholders:** John Lamont

## Links

- **Repository:** [GitHub URL - to be added]
- **Project Board:** [URL if applicable]
- **Live Site:** [URL once deployed]
- **Documentation:** [URL if separate]
