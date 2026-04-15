# threagile-ui

A web-based UI for [Threagile](https://threagile.io) threat modeling, with a React + TypeScript frontend and a Python (FastAPI) backend.

## Table of Contents

- [Quick Start](#quick-start)
- [Common Commands](#common-commands)
- [Configuration](#configuration)
- [Execution Methods](#execution-methods)
- [Error Handling](#error-handling)
- [Testing](#testing)

---

## Quick Start

### First Time Setup

1. **Check prerequisites:**
   ```bash
   make check
   ```
   Ensures you have Python 3, Node.js, npm, and Docker installed.

2. **Setup project:**
   ```bash
   make setup
   ```
   Creates the Python virtual environment and installs all dependencies.

3. **Configure environment:**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your settings
   ```

4. **Start development:**
   ```bash
   make dev
   ```
   Starts both backend (http://localhost:8000) and frontend (http://localhost:5173)

---

## Common Commands

### Development
```bash
make dev          # Start both backend and frontend
make backend      # Start only backend
make frontend     # Start only frontend
```

### Testing
```bash
make test              # Run all tests
make test-backend      # Run backend tests only
make test-frontend     # Run frontend tests only
make test-coverage     # Generate coverage reports
```

### Code Quality
```bash
make lint        # Run linters
make typecheck   # TypeScript type checking
```

### Maintenance
```bash
make install     # Update dependencies
make clean       # Clean build artifacts
make status      # Check project status
```

### Installing Missing Dependencies

**Backend:**
```bash
make install-backend
# OR manually:
cd backend && source venv/bin/activate && pip install -r requirements.txt -r requirements-dev.txt
```

**Frontend:**
```bash
make install-frontend
# OR manually:
cd frontend && npm install
```

Run `make help` or just `make` to see all available commands.

---

## Configuration

### Environment Variables

| Variable | Default | Required When | Description |
|---|---|---|---|
| `USING_LOCAL_STORAGE` | `true` | Always | Enable local storage execution |
| `USING_GITHUB` | `true` | Always | Enable GitHub integration |
| `STORE_LOCAL_ENABLED` | `true` | `USING_LOCAL_STORAGE=true` | Enable local execution in backend |
| `STORE_GITHUB_ENABLED` | `true` | `USING_GITHUB=true` | Enable GitHub execution in backend |
| `ALLOWED_PATHS` | — | `USING_LOCAL_STORAGE=true` | Comma-separated allowed base paths |
| `GITHUB_CLIENT_ID` | — | `USING_GITHUB=true` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | — | `USING_GITHUB=true` | GitHub OAuth client secret |
| `GITHUB_REDIRECT_URI` | — | `USING_GITHUB=true` | GitHub OAuth redirect URI |
| `GITHUB_ORG_URI` | — | `USING_GITHUB=true` | GitHub org API URI |
| `THREAGILE_DIRECTORY` | — | Always | Path to threagile installation |
| `SESSION_TTL_SECONDS` | `43200` | No | Session TTL (default 12h) |
| `COOKIE_SECURE` | `false` | No | Set `true` for HTTPS |
| `COOKIE_SAMESITE` | `lax` | No | `lax`, `strict`, or `none` |

### Example Configurations

**Full feature set (development):**
```bash
USING_LOCAL_STORAGE=true
USING_GITHUB=true
STORE_LOCAL_ENABLED=true
STORE_GITHUB_ENABLED=true
ALLOWED_PATHS=/path/to/models
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_REDIRECT_URI=http://localhost:8000/auth/callback
GITHUB_ORG_URI=https://api.github.com/orgs/your-org
THREAGILE_DIRECTORY=/path/to/threagile
```

**Local storage only:**
```bash
USING_LOCAL_STORAGE=true
USING_GITHUB=false
ALLOWED_PATHS=/path/to/models
THREAGILE_DIRECTORY=/path/to/threagile
```

**Minimal (browser download only):**
```bash
USING_LOCAL_STORAGE=false
USING_GITHUB=false
THREAGILE_DIRECTORY=/path/to/threagile
```

---

## Execution Methods

The `GET /execution-methods` endpoint returns which methods are available based on configuration:

| Method | Description | Available When |
|---|---|---|
| `local` | Browser download | Always |
| `server` | Save on backend host | `USING_LOCAL_STORAGE=true` and `STORE_LOCAL_ENABLED=true` |
| `github` | Save to GitHub | `USING_GITHUB=true` and `STORE_GITHUB_ENABLED=true` |

The execution dialog in the UI only displays checkboxes for the methods returned by this endpoint.

---

## Error Handling

### Backend

All API errors follow a consistent response format:

```json
{
  "success": false,
  "error": "User-friendly message",
  "error_code": "VALIDATION_ERROR",
  "details": { ... }
}
```

Custom exception classes: `ValidationException` (400), `AuthenticationException` (401), `FileException` (500), `GitHubException` (500), `ConfigurationException` (500), `DockerException` (500).

The application fails fast at startup if required configuration is missing.

### Frontend

The `ApiErrorHandler` utility (`frontend/src/api/errorHandler.ts`) provides type guards and formatters for API error responses. Errors are displayed via MUI `Alert` components in the execution dialog.

---

## Testing

### Backend Tests

```bash
cd backend
pytest                                          # Run all tests
pytest --cov=app --cov-report=html --cov-report=term  # With coverage
pytest -m unit                                  # Unit tests only
pytest -m integration                           # Integration tests only
pytest tests/unit/test_config.py                # Specific file
pytest -x                                       # Stop at first failure
```

**Test structure:**
```
backend/tests/
├── conftest.py                        # Shared fixtures
├── unit/
│   ├── test_config.py                 # Configuration validation
│   └── test_path_validation.py        # Path traversal prevention
└── integration/
    ├── test_execution_endpoints.py    # Execution flow
    └── test_storage_endpoints.py      # Storage access
```

### Frontend Tests

```bash
cd frontend
npm test                  # Watch mode
npm test -- --run         # CI mode
npm run test:coverage     # With coverage
```

**Test structure:**
```
frontend/tests/
├── setup.ts
└── unit/
    ├── validation.test.ts    # Strict model validation
    └── apiClient.test.ts     # API client methods
```

### Coverage

```bash
# Backend
cd backend && pytest --cov=app --cov-report=term --cov-report=json

# Frontend
cd frontend && npm run test:coverage
```

---

## Troubleshooting

| Issue | Fix |
|---|---|
| "venv not found" | `make setup-backend` |
| "node_modules not found" | `make setup-frontend` |
| Tests failing | `make status`, then `make clean && make setup` |
| Backend `ModuleNotFoundError` | Activate venv and `pip install -r requirements.txt -r requirements-dev.txt` |
| Frontend import errors | `rm -rf node_modules && npm install` |
| Both servers won't start together | Run `make backend` and `make frontend` in separate terminals |


<img src="https://fit.cvut.cz/static/images/fit-cvut-logo-en.svg" alt="FIT CTU logo" height="200">

This software was developed with the support of the **Faculty of Information Technology, Czech Technical University in Prague**.
For more information, visit [fit.cvut.cz](https://fit.cvut.cz).
