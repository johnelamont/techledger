# ADR 001: Pure Cloud-Based Architecture with Browser Upload

**Date:** 2025-10-12  
**Status:** Accepted  
**Deciders:** John Lamont  
**Decision Type:** Architecture - Foundational

## Context

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

## Decision

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

## Consequences

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

## Alternatives Considered

### Alternative 1: Browser Extension + Cloud Hybrid
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

### Alternative 2: Desktop Application + Cloud Hybrid
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

### Alternative 3: Local OCR Processing (Client-Side)
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

## Implementation Notes

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

## References
- Google Cloud Vision API Pricing: https://cloud.google.com/vision/pricing
- AWS Rekognition Pricing: https://aws.amazon.com/rekognition/pricing/
- Architecture discussion: TechLedger project planning session, 2025-10-12

## Related Decisions
- ADR 002: Role-Based and Task-Based Navigation Model
- Future ADR: Frontend Technology Stack (React + TypeScript)
- Future ADR: Backend Technology Stack (Node.js vs. Python)
- Future ADR: Computer Vision Provider Selection (Google vs. AWS)
- Future ADR: Authentication Provider Selection
