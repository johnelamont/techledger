# Technology Stack

**Project:** techledger  
**Last Updated:** 2025-10-29  
**Status:** Planning Phase - Architecture Defined

---

## Frontend

### Web Application
- **Framework:** React 18+
- **Language:** TypeScript 5+
- **Styling:** Tailwind CSS 3+
- **State Management:** Zustand (lightweight) or React Context + hooks
- **Build Tool:** Vite
- **UI Components:** shadcn/ui (Radix UI primitives + Tailwind)
- **Forms:** React Hook Form + Zod validation
- **HTTP Client:** Axios or native fetch with React Query
- **Routing:** React Router v6

**Rationale:** 
- **React + TypeScript:** Industry standard, massive ecosystem, excellent TypeScript support, component reusability
- **Vite:** Lightning-fast dev server, superior DX compared to Webpack, optimized production builds
- **Tailwind CSS:** Utility-first approach enables rapid UI development, smaller CSS bundles, consistent design system
- **Zustand:** Simpler than Redux, less boilerplate, perfect for MVP scope (can upgrade to Redux if needed later)
- **shadcn/ui:** Pre-built accessible components, copy-paste approach (no package bloat), customizable, modern design

---

## Backend

### API Server
- **Language:** Python 3.11+
- **Framework:** FastAPI 0.104+
- **ASGI Server:** Uvicorn (production: Gunicorn + Uvicorn workers)
- **ORM:** SQLAlchemy 2.0+
- **Migration Tool:** Alembic
- **Validation:** Pydantic v2 (built into FastAPI)
- **Background Jobs:** Celery 5+ with Redis backend
- **Task Queue:** Bull (for image processing) or Celery

**Rationale:**
- **Python over Node.js:** 
  - Superior AI/ML ecosystem (if we expand to custom vision models)
  - Excellent libraries for image processing (Pillow, OpenCV)
  - SQLAlchemy ORM is more mature than TypeORM/Prisma for complex queries
  - Team expertise in Python data processing
  - Better integration with Google Cloud Vision API (official Python SDK)
- **FastAPI over Flask/Django:**
  - Automatic API documentation (OpenAPI/Swagger)
  - Built-in request/response validation with Pydantic
  - Async support for handling concurrent screenshot uploads
  - Type hints throughout (matches TypeScript frontend philosophy)
  - Modern Python 3.10+ features (pattern matching, structural pattern matching)
  - Faster than Flask, less bloat than Django
- **SQLAlchemy 2.0:** Most powerful Python ORM, handles complex relationships (Role→Task→Action many-to-many), excellent query optimization
- **Celery + Redis:** Industry-standard async job processing for screenshot analysis, decouples heavy Vision API calls from HTTP requests

### Python Package Management
- **Package Manager:** pip + requirements.txt (MVP) → Poetry (post-MVP for better dependency management)
- **Virtual Environment:** venv or virtualenv

---

## Database

### Primary Database
- **Type:** PostgreSQL 15+
- **ORM:** SQLAlchemy 2.0+
- **Hosting:** Supabase (free tier: 500MB) OR Neon (free tier: 3GB)
- **Connection Pooling:** SQLAlchemy built-in + pgBouncer (if needed at scale)
- **Migrations:** Alembic (SQLAlchemy's migration tool)

**Rationale:**
- **PostgreSQL over MySQL/MongoDB:**
  - Superior JSON/JSONB support for storing vision API responses
  - Excellent full-text search capabilities (for documentation search)
  - Better support for complex joins (hierarchy + many-to-many relationships)
  - ACID compliance critical for training data integrity
  - Array types for storing tags, keywords
  - Proven scalability (handles millions of rows easily)
- **Supabase vs Neon:**
  - Both offer PostgreSQL with automatic backups
  - Supabase: More features (auth, storage, real-time) but we're using Clerk for auth
  - Neon: Better free tier (3GB vs 500MB), faster scaling, serverless
  - **Decision:** Start with Neon for better free tier, migrate to Supabase if we want unified platform later

### Cache & Session Store
- **Type:** Redis 7+
- **Hosting:** Upstash Redis (free tier: 10,000 commands/day)
- **Client:** redis-py

**Rationale:**
- Redis for fast pattern matching lookups (cache frequent queries)
- Session management if needed (though Clerk handles most auth)
- Celery task queue backend
- Rate limiting for API endpoints

---

## Cloud Services & APIs

### Computer Vision
- **Primary:** Google Cloud Vision API
- **Backup:** AWS Rekognition
- **SDK:** google-cloud-vision (Python)

**Cost:** $1.50 per 1,000 images (first 1,000/month free)

### File Storage
- **Service:** AWS S3
- **Buckets:** 
  - `techledger-uploads-prod` (original screenshots)
  - `techledger-uploads-dev` (development)
- **CDN:** AWS CloudFront OR Cloudflare (for fast image delivery)
- **SDK:** boto3 (Python AWS SDK)

**Cost:** ~$5-20/month (MVP phase)

### Authentication
- **Service:** Clerk
- **Tier:** Free (up to 10,000 MAU)
- **SDK:** clerk-sdk-python (backend) + @clerk/clerk-react (frontend)

**Rationale:** 
- Drop-in auth UI components
- No need to build login/signup/password reset flows
- Webhooks for user lifecycle events
- JWT tokens for API authentication

### Payments
- **Service:** Stripe
- **SDK:** stripe (Python) + @stripe/stripe-js (frontend)
- **Cost:** 2.9% + $0.30 per transaction

### Email
- **Service:** Resend
- **SDK:** resend (Python)
- **Tier:** Free (3,000 emails/month)

**Rationale:** Modern API, great DX, better deliverability than SendGrid

---

## Infrastructure & Hosting

### Frontend Hosting
- **Platform:** Vercel
- **Tier:** Hobby (Free - 100GB bandwidth/month)
- **Features:**
  - Automatic deployments from GitHub
  - Edge network (global CDN)
  - Preview deployments for PRs
  - Custom domain support

### Backend Hosting
- **Platform:** Railway OR Render
- **Tier:** 
  - Railway: ~$20-50/month (pay-as-you-go)
  - Render: Free tier with spin-down, $7/month for always-on
- **Features:**
  - Automatic deployments from GitHub
  - Environment variables management
  - Built-in PostgreSQL add-on (alternative to Neon)
  - Logs and monitoring

**Decision:** Start with Render free tier (accept spin-down latency for MVP testing), upgrade to Railway when ready for beta customers ($20/month for better performance)

### DNS & CDN
- **Service:** Cloudflare
- **Tier:** Free
- **Features:**
  - DNS management
  - DDoS protection
  - WAF (Web Application Firewall)
  - Page rules
  - SSL/TLS

### Domain
- **Domain:** techledger.ai
- **Registrar:** Cloudflare Registrar
- **Cost:** $70/year ($140 for 2 years)

---

## Development Tools

### Version Control
- **Platform:** GitHub
- **Workflow:** Git Flow (main, develop, feature branches)
- **CI/CD:** GitHub Actions
  - Run tests on PR
  - Deploy to staging (develop branch)
  - Deploy to production (main branch)

### IDE/Editors
- **Primary:** VS Code
- **Extensions:**
  - Python (Pylance)
  - ESLint + Prettier
  - Tailwind CSS IntelliSense
  - SQLAlchemy extension

### Package Managers
- **Frontend:** npm (or pnpm for faster installs)
- **Backend:** pip + venv → Poetry (post-MVP)

### Code Quality
- **Python Linting:** Ruff (fast Python linter, replaces Flake8 + Black)
- **Python Type Checking:** mypy
- **Python Formatting:** Black (auto-formatter)
- **JavaScript/TypeScript:** ESLint + Prettier
- **Pre-commit Hooks:** pre-commit (runs linters before commits)

### Testing
- **Backend:** pytest + pytest-asyncio
- **Frontend:** Vitest (faster than Jest) + React Testing Library
- **E2E:** Playwright (cross-browser testing)
- **Coverage:** pytest-cov (backend), Vitest coverage (frontend)

---

## Monitoring & Observability

### Error Tracking
- **Service:** Sentry
- **Tier:** Free (5,000 errors/month)
- **SDK:** sentry-sdk (Python) + @sentry/react

**Rationale:** Industry standard, excellent error grouping, source maps support, performance monitoring

### Analytics
- **Service:** PostHog (self-hosted analytics)
- **Tier:** Free (1M events/month)
- **Alternative:** Plausible ($9/month for 10K pageviews)

**Rationale:** 
- PostHog: Product analytics, feature flags, session recording, all-in-one
- Privacy-focused (GDPR compliant)
- Self-hosted option if needed

### Application Performance
- **Service:** Sentry (built-in performance monitoring)
- **Alternative:** New Relic (if budget allows)

### Logging
- **Development:** Python logging module → stdout
- **Production:** Railway/Render built-in logs → (future: Papertrail or Datadog)

---

## Third-Party Services Summary

| Service | Purpose | Tier | Monthly Cost |
|---------|---------|------|--------------|
| Clerk | Authentication | Free | $0 |
| Google Cloud Vision | OCR/Computer Vision | Pay-per-use | $10-50 |
| AWS S3 + CloudFront | File storage + CDN | Pay-per-use | $5-20 |
| Neon | PostgreSQL Database | Free | $0-25 |
| Upstash Redis | Cache + Queue | Free | $0 |
| Vercel | Frontend Hosting | Hobby | $0 |
| Railway/Render | Backend Hosting | Starter | $20-50 |
| Stripe | Payments | Transaction fees | ~$30 (on $1K MRR) |
| Resend | Email | Free | $0-20 |
| Sentry | Error Tracking | Free | $0 |
| PostHog | Analytics | Free | $0 |
| Cloudflare | DNS + CDN | Free | $0 |
| GitHub | Version Control + CI | Free | $0 |
| **TOTAL** | | | **$65-195/month** |

---

## Architecture Decisions

### Why Python Backend (vs Node.js)?

**Initial Consideration:** ADR 001 mentioned Node.js + Express as an option.

**Final Decision:** Python + FastAPI

**Reasons:**
1. **Data Model Complexity:** SQLAlchemy handles the Role→Task→Action many-to-many relationships better than Prisma
2. **Computer Vision Ecosystem:** Better libraries for image processing if we need custom vision logic
3. **AI/ML Future-Proofing:** If we build custom pattern recognition models, Python is essential
4. **Async Support:** FastAPI's async capabilities match or exceed Node.js for I/O-bound operations
5. **Type Safety:** Python 3.11+ type hints + Pydantic provide similar safety to TypeScript
6. **Developer Productivity:** FastAPI's automatic API docs and validation save massive development time
7. **SQLAlchemy Maturity:** More powerful query capabilities for complex hierarchical data

**Trade-offs Accepted:**
- JavaScript/TypeScript monorepo not possible (separate frontend/backend languages)
- Slightly slower cold start times vs Node.js (mitigated by keeping backend warm)
- Need to maintain two language environments (but both are common, well-supported)

### Technology Selection Principles

1. **Prefer managed services over self-hosted** (Clerk over self-built auth, Neon over self-managed Postgres)
2. **Choose proven, mainstream technologies** (React, PostgreSQL, FastAPI) over bleeding-edge
3. **Optimize for solo developer velocity** (FastAPI auto-docs, Tailwind rapid UI, Clerk drop-in auth)
4. **Free tiers for MVP, scale costs with revenue** (every service has generous free tier)
5. **Type safety everywhere** (TypeScript frontend, Python type hints backend, Pydantic validation)
6. **API-first architecture** (REST API can support future mobile apps, integrations)

---

## Development Environment Setup

### Prerequisites
- Python 3.11+
- Node.js 18+ (for frontend)
- PostgreSQL 15+ (local) OR connection to Neon
- Redis (local) OR connection to Upstash

### Backend Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Run migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Full Stack Development
```bash
# Terminal 1: Backend
cd backend && uvicorn app.main:app --reload

# Terminal 2: Frontend  
cd frontend && npm run dev

# Terminal 3: Celery worker (for background jobs)
cd backend && celery -A app.celery worker --loglevel=info

# Terminal 4: Redis (if running locally)
redis-server
```

---

## Future Considerations

### Post-MVP Enhancements (Months 13+)
- **GraphQL API** (if REST becomes limiting with complex queries)
- **WebSockets** (for real-time collaborative editing)
- **Mobile apps** (React Native reusing business logic via API)
- **Browser extension** (Chrome/Firefox for one-click screenshot capture)
- **Custom ML models** (fine-tuned vision models for specific business apps)

### Scalability Milestones
- **100 users:** Current stack handles easily
- **1,000 users:** Add Redis caching for pattern matching queries, consider read replicas
- **10,000 users:** Microservices architecture (separate vision processing service), Kubernetes deployment
- **100,000 users:** CDN optimization, multi-region deployment, dedicated database cluster

---

## Related Documents
- [Architecture Decision Records](../decisions/decisions-log.md)
- [Data Models & Schemas](./data_models_schemas_md.md)
- [Web Application Architecture](./architecture-webapp.md)
- [Business Operations](../operations/business_operations_md.md)
- [Dependencies](./dependencies.md)

---

## Revision History
- **2025-10-11:** Initial template created
- **2025-10-29:** Complete tech stack defined - Python/FastAPI backend, React/TypeScript frontend, PostgreSQL database, comprehensive service selection with rationale
