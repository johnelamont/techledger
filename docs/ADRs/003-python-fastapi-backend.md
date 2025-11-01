# ADR 003: Python Backend with FastAPI Framework

**Date:** 2025-10-31  
**Status:** Accepted  
**Deciders:** John Lamont  
**Decision Type:** Architecture - Technology Stack

## Context

ADR 001 initially specified Node.js + Express for the backend API. After further evaluation, a decision was made to use Python instead. This ADR documents the rationale for switching to Python and the selection of FastAPI as the backend framework.

**Key Considerations:**

**Development Efficiency:**
- Solo developer with 12-18 month MVP timeline
- Need to maximize productivity and minimize context switching
- Python's readability and ecosystem maturity

**AI/ML Integration:**
- Computer vision processing (Google Cloud Vision API)
- Future potential for local ML models or AI enhancements
- Python is the de facto standard for AI/ML work

**Data Processing:**
- OCR text extraction and parsing
- Pattern matching and documentation generation
- Python excels at text processing and data manipulation

**API Requirements:**
- RESTful API for frontend communication
- Asynchronous processing for vision API calls
- WebSocket support for real-time AI training feedback
- Type safety and automatic API documentation

## Decision

**Use Python with FastAPI framework for the backend API.**

### Technology Stack

**Backend Framework:** FastAPI
- Modern, fast (high-performance) Python web framework
- Built on Starlette (async) and Pydantic (validation)
- Automatic OpenAPI/Swagger documentation generation
- Native async/await support for I/O-bound operations
- Type hints throughout (matches frontend TypeScript philosophy)

**Python Version:** Python 3.11+ (for performance improvements)

**Key Libraries:**
- **FastAPI** - Web framework
- **Pydantic** - Data validation and settings management
- **SQLAlchemy** - ORM for PostgreSQL
- **Alembic** - Database migrations
- **google-cloud-vision** - Google Cloud Vision API client
- **Pillow (PIL)** - Image processing utilities
- **python-multipart** - File upload handling
- **python-jose** - JWT token handling for authentication
- **passlib** - Password hashing
- **httpx** - Async HTTP client for external APIs
- **pytest** + **pytest-asyncio** - Testing framework

**Development Tools:**
- **uvicorn** - ASGI server for development and production
- **black** - Code formatting
- **ruff** - Fast Python linter
- **mypy** - Static type checking
- **poetry** or **pip-tools** - Dependency management

### Architecture Overview

```
Frontend (React + TypeScript)
    ↓ HTTP/REST + WebSocket
Backend API (FastAPI)
    ↓
┌─────────────────────────────┐
│  FastAPI Application        │
│  - Routes/Endpoints         │
│  - Request/Response Models  │
│  - Business Logic           │
└─────────────────────────────┘
    ↓                    ↓
PostgreSQL          Cloud APIs
- Users             - Google Cloud Vision
- Actions           - (Future: other APIs)
- Patterns
- Documentation
```

## Consequences

### Positive

**Development Speed:**
- **Faster MVP delivery:** Python's conciseness means less code to write and maintain
- **Familiar territory:** Python is widely known, easier to hire help if needed later
- **Excellent IDE support:** PyCharm (developer's preferred editor) provides outstanding Python tooling
- **Rich standard library:** Built-in tools for common tasks reduce external dependencies

**FastAPI Advantages:**
- **Automatic API documentation:** FastAPI generates interactive Swagger UI and ReDoc automatically
- **Type safety:** Pydantic models catch errors at development time, not runtime
- **High performance:** Comparable to Node.js/Go for I/O-bound operations (which TechLedger is)
- **Modern async support:** Native async/await for concurrent API calls (crucial for vision API)
- **Developer experience:** Fast reload, clear error messages, excellent documentation
- **Easy testing:** Built-in test client, works seamlessly with pytest

**AI/ML Ready:**
- **Native Python AI libraries:** If we need local ML models later (text classification, pattern recognition), Python is the obvious choice
- **Computer vision tools:** OpenCV, scikit-image, and other CV libraries are Python-first
- **Easy experimentation:** Can prototype AI features in Jupyter notebooks, then integrate into FastAPI

**Data Processing Strengths:**
- **Text processing:** Python's string handling and regex support are superior
- **JSON manipulation:** Native, clean JSON handling
- **Data transformation:** Pandas, if needed for complex data analysis
- **Pattern matching:** Python 3.10+ structural pattern matching

**Deployment:**
- **Container-friendly:** Python apps dockerize easily
- **Platform support:** Runs on Railway, Render, Fly.io, AWS, GCP - all platforms mentioned in ADR 001
- **Lightweight:** FastAPI apps are resource-efficient
- **Production-ready:** Uvicorn/Gunicorn are mature ASGI servers

**Community & Ecosystem:**
- **Massive community:** Python is #1 or #2 in most popularity rankings
- **Mature libraries:** Battle-tested libraries for every use case
- **Active FastAPI community:** Growing rapidly, excellent Stack Overflow support
- **Long-term viability:** Python isn't going anywhere

### Negative

**Initial Node.js References:**
- **Documentation cleanup needed:** ADR 001 and README reference Node.js
- **Requires update cascade:** Any docs mentioning Node.js need revision
- **Mitigated by:** This ADR supersedes those references; documentation will be updated

**Deployment Considerations:**
- **Cold start times:** Python can be slower to cold start than Node.js (but irrelevant with warm containers)
- **Not JavaScript everywhere:** Frontend is TypeScript, backend is Python (but type systems are similar)
- **Mitigated by:** Most deployment platforms keep containers warm; TypeScript ↔ Python interop via REST API is standard

**Type System Differences:**
- **Different type syntax:** TypeScript types ≠ Python type hints (but Pydantic bridges this well)
- **Schema duplication possible:** Frontend TypeScript types and backend Pydantic models must stay in sync
- **Mitigated by:** OpenAPI generation provides single source of truth; can generate TypeScript types from OpenAPI spec

**Learning Curve (minimal):**
- **FastAPI is new-ish:** Released 2018, so less Stack Overflow history than Flask/Django
- **Async patterns:** If unfamiliar with async/await, slight learning curve
- **Mitigated by:** FastAPI documentation is excellent; async/await is straightforward

### Acceptable Trade-offs

- **Single language across stack would be nice:** But Python's AI/ML ecosystem and developer productivity outweigh this
- **Node.js has larger web development community:** But Python's overall ecosystem is larger and more relevant to TechLedger's needs
- **TypeScript/Python schema sync:** Manageable with OpenAPI code generation or shared validation rules

## Alternatives Considered

### Alternative 1: Node.js + Express (Original Choice in ADR 001)
- **Pros:**
  - JavaScript everywhere (same language as frontend)
  - Huge web development ecosystem
  - npm package ecosystem is massive
  - Fast startup times
- **Cons:**
  - **Weaker AI/ML ecosystem:** Node.js ML libraries are immature compared to Python
  - **Less suited for data processing:** JavaScript's text/data manipulation is more verbose
  - **Type safety requires more effort:** Even with TypeScript, validation libraries aren't as mature as Pydantic
  - **Async complexity:** Callback hell or promise chains less clean than Python's async/await
- **Why Not Chosen:** Python's AI/ML capabilities and data processing strengths are too important to give up. The "JavaScript everywhere" benefit is minor compared to Python's productivity advantages for this specific use case.

### Alternative 2: Python + Django
- **Pros:**
  - Full-featured framework (admin panel, ORM, auth built-in)
  - Battle-tested, mature (released 2005)
  - Excellent documentation
  - Large community
- **Cons:**
  - **Overkill for API-only backend:** Django is designed for server-rendered HTML apps
  - **Heavier:** More features than needed, larger footprint
  - **Synchronous by default:** Async support added later, not as clean as FastAPI
  - **Slower development for APIs:** More boilerplate than FastAPI
  - **Traditional request-response:** Not optimized for modern async API patterns
- **Why Not Chosen:** Django is excellent for full-stack web apps, but TechLedger is a SPA with API backend. FastAPI is purpose-built for this use case and requires less overhead.

### Alternative 3: Python + Flask
- **Pros:**
  - Lightweight, minimal (microframework)
  - Highly flexible
  - Large community, mature (released 2010)
  - Simple to learn
- **Cons:**
  - **No built-in async support:** Can use Quart (async Flask fork) but not as mature
  - **Manual validation:** Need separate libraries for request validation
  - **No automatic API docs:** Must add extensions (flask-restx, flasgger)
  - **More boilerplate:** Have to choose and integrate ORM, validation, etc.
  - **Older patterns:** Pre-async Python era design
- **Why Not Chosen:** Flask is great for simple APIs, but FastAPI provides everything Flask needs extensions for, built-in and with better ergonomics. For a new project in 2025, FastAPI is the more modern choice.

### Alternative 4: Go + Gin/Echo
- **Pros:**
  - Extremely fast (compiled language)
  - Low resource usage
  - Built-in concurrency (goroutines)
  - Single binary deployment
- **Cons:**
  - **Steeper learning curve:** Go is less beginner-friendly than Python
  - **Less AI/ML ecosystem:** Limited compared to Python
  - **More verbose:** More code to accomplish same tasks
  - **Smaller ecosystem:** Fewer libraries than Python
  - **Overkill for I/O-bound work:** TechLedger is I/O-bound (waiting on APIs), not CPU-bound
- **Why Not Chosen:** Go's performance advantage doesn't matter for I/O-bound workloads. Python's productivity and AI/ML ecosystem are more valuable.

## Implementation Notes

### Project Structure

```
src/backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app initialization
│   ├── config.py            # Settings (Pydantic BaseSettings)
│   ├── dependencies.py      # Dependency injection
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py      # Authentication endpoints
│   │   │   ├── screenshots.py   # Screenshot upload/processing
│   │   │   ├── actions.py       # Action CRUD
│   │   │   ├── patterns.py      # Pattern management
│   │   │   └── docs.py          # Documentation generation
│   │   └── models/          # Pydantic request/response models
│   │       ├── __init__.py
│   │       ├── user.py
│   │       ├── screenshot.py
│   │       └── action.py
│   ├── db/
│   │   ├── __init__.py
│   │   ├── base.py          # SQLAlchemy base
│   │   ├── session.py       # Database session management
│   │   └── models/          # SQLAlchemy ORM models
│   │       ├── __init__.py
│   │       ├── user.py
│   │       ├── action.py
│   │       └── pattern.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── vision.py        # Google Cloud Vision integration
│   │   ├── auth.py          # Authentication logic
│   │   ├── pattern_matching.py
│   │   └── doc_generation.py
│   └── core/
│       ├── __init__.py
│       ├── security.py      # JWT, password hashing
│       └── exceptions.py    # Custom exceptions
├── tests/
│   ├── __init__.py
│   ├── conftest.py          # Pytest fixtures
│   ├── test_api/
│   └── test_services/
├── alembic/                 # Database migrations
│   ├── versions/
│   └── env.py
├── pyproject.toml           # Poetry dependencies
├── alembic.ini              # Alembic config
├── .env.example             # Environment variables template
└── README.md
```

### FastAPI Application Example

```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth, screenshots, actions
from app.config import settings

app = FastAPI(
    title="TechLedger API",
    description="AI-assisted documentation generation",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(screenshots.router, prefix="/api/screenshots", tags=["screenshots"])
app.include_router(actions.router, prefix="/api/actions", tags=["actions"])

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

### Pydantic Model Example

```python
# app/api/models/screenshot.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class ScreenshotUpload(BaseModel):
    """Request model for screenshot upload"""
    # FastAPI will handle file upload separately
    description: Optional[str] = Field(None, max_length=500)
    
class DetectedElement(BaseModel):
    """UI element detected by vision API"""
    type: str  # "button", "input", "label", etc.
    text: str
    confidence: float
    position: dict  # x, y, width, height

class ScreenshotResponse(BaseModel):
    """Response after processing screenshot"""
    id: str
    url: str
    detected_elements: List[DetectedElement]
    ocr_text: str
    processed_at: datetime
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "scr_abc123",
                "url": "https://storage.example.com/screenshots/abc123.png",
                "detected_elements": [
                    {
                        "type": "button",
                        "text": "Submit",
                        "confidence": 0.98,
                        "position": {"x": 100, "y": 200, "width": 80, "height": 40}
                    }
                ],
                "ocr_text": "Login form...",
                "processed_at": "2025-10-31T12:00:00Z"
            }
        }
```

### PyCharm Configuration

**PyCharm is an excellent choice for this project. Here's what you'll want to set up:**

**Project Setup:**
1. **Python Interpreter:** Set to Python 3.11+ (PyCharm detects poetry/virtualenv automatically)
2. **Code Style:** Black formatting (PyCharm has built-in Black support)
3. **Type Checking:** Enable Mypy integration in settings
4. **Linting:** Configure Ruff (PyCharm plugins available)

**Recommended PyCharm Settings:**
- Enable "Type hints" inspection (catches type errors before runtime)
- Set Black as default formatter (Preferences → Tools → Black)
- Enable auto-import optimization
- Configure FastAPI run configuration for easy debugging

**Run Configurations:**
```
# PyCharm Run Configuration for FastAPI
Script: uvicorn
Parameters: app.main:app --reload --host 0.0.0.0 --port 8000
Working directory: src/backend
Environment variables: (from .env file)
```

**No Special Concerns:**
- PyCharm handles FastAPI projects beautifully (autocomplete, navigation, etc.)
- The project structure above is PyCharm-friendly
- PyCharm's debugger works perfectly with FastAPI/Uvicorn
- No conflicts with the chosen tech stack

### Development Workflow

**Local Development:**
```bash
# Install dependencies
cd src/backend
poetry install

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload

# Run tests
pytest

# Format code
black .
ruff check .
mypy .
```

**Environment Variables (.env):**
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/techledger

# Google Cloud Vision
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
ALLOWED_ORIGINS=["http://localhost:3000", "http://localhost:5173"]

# Storage
CLOUD_STORAGE_BUCKET=techledger-screenshots
```

### API Documentation

FastAPI automatically generates:
- **Swagger UI:** `http://localhost:8000/api/docs` (interactive API testing)
- **ReDoc:** `http://localhost:8000/api/redoc` (cleaner documentation)
- **OpenAPI JSON:** `http://localhost:8000/openapi.json` (machine-readable schema)

### Testing Strategy

```python
# tests/test_api/test_screenshots.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_upload_screenshot():
    with open("test_screenshot.png", "rb") as f:
        response = client.post(
            "/api/screenshots/upload",
            files={"file": ("test.png", f, "image/png")}
        )
    assert response.status_code == 200
    assert "detected_elements" in response.json()
```

## Migration from Node.js References

**Documentation Updates Required:**
1. ✅ This ADR supersedes Node.js references in ADR 001
2. Update README.md tech stack section (list Python/FastAPI)
3. Update `docs/architecture/tech-stack.md` with Python details
4. Update `docs/architecture/dependencies.md` with Python libraries
5. Any code examples in documentation should use Python syntax

**No Code Migration Needed:**
- ADR 001 was planning only; no Node.js code exists yet
- Starting fresh with Python/FastAPI

## Decision Review Triggers

**Reconsider this decision if:**

1. **Performance becomes critical:** If we discover CPU-bound operations (unlikely), consider Go or Rust for those specific services
2. **TypeScript expertise is abundant:** If hiring a team of TypeScript-only developers, might reconsider full-stack TypeScript
3. **FastAPI ecosystem stagnates:** If FastAPI loses community support (unlikely given current trajectory)
4. **Python 2 EOL issues emerge:** Python 3.11+ is stable; no concerns for next 5+ years

**Success Metrics for This Decision:**

- Can deliver MVP in 12 months with Python backend (vs. Node.js timeline)
- Google Cloud Vision integration is straightforward (Python client library)
- API development velocity meets or exceeds expectations
- Type safety via Pydantic catches errors during development
- FastAPI auto-documentation reduces frontend/backend integration time
- No performance bottlenecks in I/O-bound operations (vision API calls, database queries)

## Related Decisions

- **ADR 001:** Pure Cloud-Based Architecture (foundational)
- **ADR 002:** Role-Based Navigation Model (data model affects API design)
- **Future ADR 004:** Database Schema Design (SQLAlchemy models)
- **Future ADR 005:** Authentication Strategy (JWT implementation with python-jose)
- **Future ADR 006:** Cloud Storage Provider (S3 vs GCS, affects Python SDK choice)

## References

- FastAPI Documentation: https://fastapi.tiangolo.com/
- Pydantic Documentation: https://docs.pydantic.dev/
- Python Type Hints: https://docs.python.org/3/library/typing.html
- Google Cloud Vision Python Client: https://cloud.google.com/python/docs/reference/vision/latest
- SQLAlchemy Documentation: https://docs.sqlalchemy.org/
- Real Python FastAPI Tutorial: https://realpython.com/fastapi-python-web-apis/
