# Business Operations

**Project:** techledger  
**Last Updated:** 2025-10-12  
**Status:** Planning Phase

## Project Information

### Basic Information

**Product Name:** TechLedger  
**Legal Entity:** [To be determined]  
**Founded:** 2025  
**Primary Author:** John Lamont, Claude.AI
**Project Type:** SaaS (Software as a Service)  
**Industry:** Business Software / Documentation Tools / Knowledge Management

### Project Description

TechLedger is an AI-assisted, browser-based platform that simplifies and unifies business technology documentation. The platform uses collaborative AI training to help small businesses and organizations create, organize, and maintain comprehensive documentation for their tech stack without requiring dedicated technical writers.

**Key Value Proposition:**  
Reduce documentation time by 70% (from 2+ hours to 20 minutes per workflow) through AI-powered screenshot analysis and pattern learning.

---

## Domain & Web Properties

### Primary Domain

**Domain Name:** techledger.AI
**Registrar:** Cloudflare Registrar 
**Account Number: ** IN-49620709
**Registration Date:** [TBD]  
**Expiration Date:** [TBD]  
**Auto-Renewal:** Yes  
**DNS Provider:** Cloudflare  
**Cost:** $140/2 years

### Additional Domains (Consider registering)

- techledger.io
- tech-ledger.com

### Subdomains

- `app.techledger.ai` - Main application
- `api.techledger.ai` - Backend API
- `docs.techledger.ai` - Public documentation
- `blog.techledger.ai` - Marketing blog (future)
- `status.techledger.ai` - Status page (future)

---

## Contact Information

### Business Contact

**Email:** john@techledger.ai (to be set up)  
**Email 2** john@johnelamont.com
**Support Email:** support@techledger.ai  
**Sales Email:** sales@techledger.ai  
**Phone:** [TBD]  
**Address:** [TBD]

### Developer Contact

**Primary Developer:** John Lamont & Claude.AI
**GitHub:** https://github.com/johnelamont/techledger 
**LinkedIn:** [TBD]

---

## External Services & Dependencies

### Authentication & User Management

**Service:** Clerk  
**Purpose:** User authentication, session management, user management  
**Tier/Plan:** Free (up to 10,000 MAU)  
**Account Email:** [TBD]  
**Login URL:** https://dashboard.clerk.com  
**API Keys:** Stored in environment variables  
**Documentation:** https://clerk.com/docs  
**Support:** support@clerk.com  
**Cost:** 
- Free: Up to 10,000 monthly active users
- Pro: $25/month for up to 100,000 MAU  
**Critical:** Yes

---

### Cloud Vision / AI

**Service:** Google Cloud Vision API  
**Purpose:** Screenshot OCR, object detection, UI element recognition  
**Tier/Plan:** Pay-as-you-go  
**Account Email:** [TBD]  
**Login URL:** https://console.cloud.google.com  
**Project ID:** [TBD]  
**API Keys:** Service account JSON (stored securely)  
**Documentation:** https://cloud.google.com/vision/docs  
**Support URL:** https://cloud.google.com/support  
**Cost:**
- $1.50 per 1,000 images
- First 1,000 images/month free
- Estimated MVP: $10-50/month  
**Critical:** Yes  
**Backup:** AWS Rekognition

---

### Cloud Storage

**Service:** AWS S3  
**Purpose:** Screenshot storage, document storage, generated content  
**Tier/Plan:** Pay-as-you-go  
**Account Email:** [TBD]  
**Login URL:** https://console.aws.amazon.com  
**Region:** us-east-1 (or nearest to users)  
**Bucket Names:**
- `techledger-uploads-prod`
- `techledger-uploads-dev`  
**Access Keys:** IAM user credentials (stored in environment variables)  
**Documentation:** https://docs.aws.amazon.com/s3/  
**Support:** AWS Support (Basic tier free)  
**Cost:**
- Storage: $0.023 per GB/month
- Requests: $0.005 per 1,000 PUT requests
- Estimated MVP: $5-20/month  
**Critical:** Yes

**CDN:** AWS CloudFront or Cloudflare  
**CDN Cost:** $5-15/month

---

### Database

**Service:** Supabase OR Neon  
**Purpose:** PostgreSQL database hosting  
**Tier/Plan:**
- Supabase Free: 500MB database, 2GB bandwidth
- Neon Free: 3GB storage  
**Account Email:** [TBD]  
**Login URL:**
- Supabase: https://app.supabase.com
- Neon: https://console.neon.tech  
**Connection String:** Stored in environment variables  
**Backup Strategy:** Daily automated backups  
**Documentation:**
- Supabase: https://supabase.com/docs
- Neon: https://neon.tech/docs  
**Support Email:**
- Supabase: support@supabase.io
- Neon: support@neon.tech  
**Cost:**
- Free tier: $0
- Pro tier: $25/month (if needed)
- Estimated MVP: $0-25/month  
**Critical:** Yes

---

### Cache & Job Queue

**Service:** Upstash Redis  
**Purpose:** Caching, Celery job queue  
**Tier/Plan:** Free (10,000 commands/day)  
**Account Email:** [TBD]  
**Login URL:** https://console.upstash.com  
**Connection String:** Stored in environment variables  
**Documentation:** https://upstash.com/docs/redis  
**Support:** support@upstash.com  
**Cost:**
- Free: 10,000 commands/day
- Pay-as-you-go after that
- Estimated MVP: $0  
**Critical:** Yes

---

### Frontend Hosting

**Service:** Vercel  
**Purpose:** React SPA hosting, CDN, automatic deployments  
**Tier/Plan:** Hobby (Free)  
**Account Email:** [TBD]  
**Login URL:** https://vercel.com/dashboard  
**GitHub Integration:** Yes (auto-deploy from Git)  
**Custom Domain:** techledger.com  
**Documentation:** https://vercel.com/docs  
**Support URL:** https://vercel.com/support  
**Cost:**
- Hobby: Free (100GB bandwidth/month)
- Pro: $20/month if needed
- Estimated MVP: $0  
**Critical:** Yes

---

### Backend Hosting

**Service:** Railway OR Render  
**Purpose:** Python backend API hosting  
**Tier/Plan:**
- Railway: Trial credits, then ~$5/month minimum
- Render: Free tier (spins down after inactivity)  
**Account Email:** [TBD]  
**Login URL:**
- Railway: https://railway.app/dashboard
- Render: https://dashboard.render.com  
**GitHub Integration:** Yes (auto-deploy)  
**Environment Variables:** Managed in dashboard  
**Documentation:**
- Railway: https://docs.railway.app
- Render: https://render.com/docs  
**Support:**
- Railway: help@railway.app
- Render: support@render.com  
**Cost:**
- Railway: ~$20-50/month
- Render: $0 (free tier) or $7/month (starter)
- Estimated MVP: $20-50/month  
**Critical:** Yes

---

### Payment Processing

**Service:** Stripe  
**Purpose:** Subscription billing, payment processing  
**Tier/Plan:** Pay-per-transaction  
**Account Email:** [TBD]  
**Login URL:** https://dashboard.stripe.com  
**API Keys:**
- Test keys (for development)
- Live keys (for production)  
**Webhook URL:** `https://api.techledger.com/webhooks/stripe`  
**Documentation:** https://stripe.com/docs  
**Support URL:** https://support.stripe.com  
**Phone:** [Available after account creation]  
**Cost:**
- 2.9% + $0.30 per transaction
- No monthly fees
- Estimated MVP: ~$30/month (on $1K MRR)  
**Critical:** Yes (for paid plans)

---

### Email Service

**Service:** Resend  
**Purpose:** Transactional emails (welcome, notifications, password reset)  
**Tier/Plan:** Free (3,000 emails/month)  
**Account Email:** [TBD]  
**Login URL:** https://resend.com/login  
**API Key:** Stored in environment variables  
**Domain Verification:** Required for sending from @techledger.com  
**Documentation:** https://resend.com/docs  
**Support Email:** support@resend.com  
**Cost:**
- Free: 3,000 emails/month
- Pro: $20/month for 50,000 emails
- Estimated MVP: $0-20/month  
**Critical:** No (medium priority)

---

### Error Tracking & Monitoring

**Service:** Sentry  
**Purpose:** Error tracking, performance monitoring  
**Tier/Plan:** Free (5,000 errors/month)  
**Account Email:** [TBD]  
**Login URL:** https://sentry.io  
**DSN:** Stored in environment variables  
**Documentation:** https://docs.sentry.io  
**Support:** community forums  
**Cost:**
- Free: 5,000 errors/month
- Team: $26/month for 50K errors
- Estimated MVP: $0  
**Critical:** No (nice to have)

---

### Analytics

**Service:** PostHog OR Plausible  
**Purpose:** Product analytics, user behavior tracking  
**Tier/Plan:**
- PostHog: Free (1M events/month)
- Plausible: $9/month (10K pageviews)  
**Account Email:** [TBD]  
**Login URL:**
- PostHog: https://app.posthog.com
- Plausible: https://plausible.io  
**Documentation:**
- PostHog: https://posthog.com/docs
- Plausible: https://plausible.io/docs  
**Cost:**
- PostHog: $0 (free tier sufficient)
- Plausible: $9/month
- Estimated MVP: $0-9/month  
**Critical:** No (nice to have)

---

### DNS & CDN

**Service:** Cloudflare  
**Purpose:** DNS management, CDN, DDoS protection, WAF  
**Tier/Plan:** Free  
**Account Email:** [TBD]  
**Login URL:** https://dash.cloudflare.com  
**Nameservers:** [Provided after domain setup]  
**Documentation:** https://developers.cloudflare.com  
**Support:** community forums (free tier)  
**Cost:** Free  
**Critical:** Yes

---

### Version Control & CI/CD

**Service:** GitHub  
**Purpose:** Source code repository, version control, CI/CD  
**Tier/Plan:** Free (public or private repos)  
**Account Email:** [TBD]  
**Login URL:** https://github.com  
**Repository:** github.com/[username]/techledger  
**GitHub Actions:** Included free (2,000 minutes/month)  
**Documentation:** https://docs.github.com  
**Support:** community forums  
**Cost:** Free  
**Critical:** Yes

---

## Cost Summary

### Monthly Operating Costs (MVP Phase)

| Service | MVP (Months 1-6) | Beta (Months 7-12) | Scale (Months 13-18) |
|---------|------------------|-------------------|----------------------|
| Domain | $1.25 | $1.25 | $1.25 |
| Clerk (Auth) | $0 | $0 | $0-25 |
| Google Vision | $10-50 | $50-150 | $100-300 |
| AWS S3 + CDN | $5-20 | $20-50 | $50-100 |
| Database (Supabase/Neon) | $0-25 | $25 | $25-50 |
| Redis (Upstash) | $0 | $0 | $10-20 |
| Frontend Hosting (Vercel) | $0 | $0 | $0-20 |
| Backend Hosting (Railway) | $20-50 | $50-100 | $100-200 |
| Stripe (fees) | $0 | $30 | $100-300 |
| Email (Resend) | $0 | $0-20 | $20 |
| Sentry | $0 | $0 | $0-26 |
| Analytics | $0 | $0-9 | $9 |
| Cloudflare | $0 | $0 | $0 |
| GitHub | $0 | $0 | $0 |
| **Total** | **$36-146/mo** | **$176-385/mo** | **$415-1,071/mo** |

### Revenue vs. Cost Targets

**Month 6 (MVP Launch):**
- Monthly Cost: ~$100
- Revenue Target: $0 (beta testing)
- Net: -$100

**Month 12 (Beta with 10 customers):**
- Monthly Cost: ~$250
- Revenue Target: $1,000 MRR ($99/customer × 10)
- Net: +$750

**Month 18 (40-60 customers):**
- Monthly Cost: ~$600
- Revenue Target: $5,000-10,000 MRR
- Net: +$4,400-9,400

---

## Legal & Compliance

### Terms & Policies (To Be Created)

- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Cookie Policy
- [ ] GDPR Compliance Statement
- [ ] Acceptable Use Policy
- [ ] Data Processing Agreement (for enterprise customers)

### Intellectual Property

**Trademark:** TechLedger (to be filed)  
**Copyright:** © 2025 TechLedger. All rights reserved.  
**License:** Proprietary (closed source)

### Compliance Requirements

- **GDPR** (European users): Data protection, right to deletion, data portability
- **CCPA** (California users): Privacy disclosures, opt-out mechanisms
- **SOC 2** (enterprise customers): Future consideration

---

## Support & Documentation

### Internal Documentation

**Location:** `/docs` folder in repository  
**Format:** Markdown  
**Contents:**
- Architecture Decision Records (ADRs)
- Technical documentation
- API specifications
- Deployment guides

### Public Documentation

**URL:** https://docs.techledger.com (future)  
**Platform:** To be determined (GitBook, Docusaurus, or custom)  
**Contents:**
- User guides
- Getting started tutorials
- API reference
- FAQ

### Customer Support

**Support Hours:** [To be determined]  
**Response Time SLA:**
- Free tier: Best effort
- Paid tier: 24-48 hours
- Enterprise: 4-8 hours

**Support Channels:**
- Email: support@techledger.com
- In-app chat (future)
- Community forum (future)

---

## Security & Backups

### Data Backup Strategy

**Database Backups:**
- Frequency: Daily automated backups
- Retention: 30 days
- Storage: Supabase/Neon automated backups

**File Backups (S3):**
- Versioning: Enabled
- Lifecycle policy: Move to Glacier after 90 days
- Retention: 1 year

### Security Measures

- HTTPS/TLS encryption (all communications)
- Encryption at rest (database, S3)
- API key rotation: Quarterly
- Dependency security scanning: Weekly (via Dependabot)
- Penetration testing: Annual (future)

### Incident Response

**Security Incident Contact:** john@techledger.com  
**Breach Notification:** Within 72 hours (GDPR requirement)  
**Incident Log:** To be maintained in secure location

---

## Business Milestones

### Phase 1: Foundation (Months 1-6)

- [x] Project planning complete
- [x] Architecture decisions documented
- [ ] Domain registered
- [ ] All service accounts created
- [ ] Development environment setup
- [ ] MVP feature development
- [ ] 5 pilot users recruited

### Phase 2: Beta Launch (Months 7-12)

- [ ] MVP deployed to production
- [ ] 10 paying beta customers
- [ ] $1,000 MRR achieved
- [ ] Terms of Service and Privacy Policy published
- [ ] Support system established

### Phase 3: Growth (Months 13-18)

- [ ] 40-60 customers
- [ ] $5,000-10,000 MRR achieved
- [ ] Choose monetization path (bootstrap vs. acquisition)
- [ ] IP protection (trademark filed)
- [ ] Full hierarchy features launched

---

## Notes

- This document should be updated quarterly or when significant changes occur
- Service credentials and API keys are NEVER stored in this document - use environment variables and secure vaults
- Cost estimates are approximate and based on current pricing (subject to change)
- All TBD items should be filled in as decisions are made

---

## Related Documents

- [VMOSA Strategy](../strategy/vmosa.md)
- [Tech Stack](./tech-stack.md)
- [Dependencies](./dependencies.md)
- [Architecture - Web App](./architecture-webapp.md)
- [ADR Log](../decisions/decisions-log.md)