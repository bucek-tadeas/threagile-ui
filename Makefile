# Threagile UI - Makefile
# 
# Available commands:
#   make install          - Install all dependencies (backend + frontend)
#   make install-backend  - Install backend dependencies
#   make install-frontend - Install frontend dependencies
#   make dev             - Start both backend and frontend in development mode
#   make backend         - Start only backend
#   make frontend        - Start only frontend
#   make test            - Run all tests (backend + frontend)
#   make test-backend    - Run backend tests
#   make test-frontend   - Run frontend tests
#   make test-coverage   - Run tests with coverage reports
#   make lint            - Run linters on both projects
#   make clean           - Clean build artifacts and caches
#   make setup           - First-time setup (create venv, install deps)

.PHONY: help install install-backend install-frontend dev backend frontend test test-backend test-frontend test-coverage lint clean setup build

# Default target - show help
help:
	@echo "Threagile UI - Development Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make setup           - First-time setup (creates venv, installs all deps)"
	@echo "  make install         - Install/update all dependencies"
	@echo "  make install-backend - Install backend dependencies only"
	@echo "  make install-frontend- Install frontend dependencies only"
	@echo ""
	@echo "Development:"
	@echo "  make dev             - Start both backend and frontend (recommended)"
	@echo "  make backend         - Start backend only (http://localhost:8000)"
	@echo "  make frontend        - Start frontend only (http://localhost:5173)"
	@echo ""
	@echo "Testing:"
	@echo "  make test            - Run all tests"
	@echo "  make test-backend    - Run backend tests with pytest"
	@echo "  make test-frontend   - Run frontend tests with vitest"
	@echo "  make test-coverage   - Run tests with coverage reports"
	@echo "  make test-watch      - Run tests in watch mode"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint            - Run linters"
	@echo "  make typecheck       - Run TypeScript type checking"
	@echo ""
	@echo "Build & Deploy:"
	@echo "  make build           - Build production bundles"
	@echo "  make clean           - Clean build artifacts and caches"

# =============================================================================
# SETUP AND INSTALLATION
# =============================================================================

# First-time setup
setup: setup-backend setup-frontend
	@echo "Setup complete!"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Copy backend/.env.example to backend/.env and configure"
	@echo "  2. Run 'make dev' to start development servers"

setup-backend:
	@echo "Setting up backend..."
	@if [ ! -d "backend/venv" ]; then \
		echo "Creating Python virtual environment..."; \
		cd backend && python3 -m venv venv; \
	fi
	@cd backend && . ./venv/bin/activate && pip install --upgrade pip
	@cd backend && . ./venv/bin/activate && pip install -r requirements.txt -r requirements-dev.txt
	@echo "Backend setup complete"

setup-frontend:
	@echo "Setting up frontend..."
	@cd frontend && npm install --legacy-peer-deps
	@echo "Frontend setup complete"

install: install-backend install-frontend
	@echo "All dependencies installed"

install-backend:
	@echo "Installing backend dependencies..."
	@cd backend && . ./venv/bin/activate && pip install -r requirements.txt -r requirements-dev.txt
	@echo "Backend dependencies installed"

install-frontend:
	@echo "Installing frontend dependencies..."
	@cd frontend && npm install --legacy-peer-deps
	@echo "Frontend dependencies installed"

# =============================================================================
# DEVELOPMENT SERVERS
# =============================================================================

dev:
	@echo "Starting development servers..."
	@echo "   Backend:  http://$${HOST:-0.0.0.0}:$${PORT:-8000}"
	@echo "   Frontend: http://localhost:5173"
	@echo ""
	@echo "Press Ctrl+C to stop both servers"
	@trap 'kill 0' EXIT; \
	(cd backend && . ./venv/bin/activate && uvicorn app.main:app --reload --host $${HOST:-0.0.0.0} --port $${PORT:-8000}) & \
	(cd frontend && npm run dev)

backend:
	@echo "Starting backend server..."
	@echo "   URL: http://$${HOST:-0.0.0.0}:$${PORT:-8000}"
	@echo "   API Docs: http://$${HOST:-0.0.0.0}:$${PORT:-8000}/docs"
	@cd backend && . ./venv/bin/activate && uvicorn app.main:app --reload --host $${HOST:-0.0.0.0} --port $${PORT:-8000}

frontend:
	@echo "Starting frontend server..."
	@echo "   URL: http://localhost:5173"
	@cd frontend && npm run dev

start: dev
start-backend: backend
start-frontend: frontend
start-all: dev

# =============================================================================
# TESTING
# =============================================================================

test: test-backend test-frontend
	@echo "All tests completed"

test-backend:
	@echo "Running backend tests..."
	@cd backend && . ./venv/bin/activate && pytest -v

test-frontend:
	@echo "Running frontend tests..."
	@cd frontend && npm test -- --run

test-coverage:
	@echo "Running tests with coverage..."
	@echo ""
	@echo "Backend coverage:"
	@cd backend && . ./venv/bin/activate && pytest --cov=app --cov-report=term --cov-report=html
	@echo ""
	@echo "Frontend coverage:"
	@cd frontend && npm run test:coverage -- --run
	@echo ""
	@echo "Coverage reports generated:"
	@echo "   Backend:  backend/htmlcov/index.html"
	@echo "   Frontend: frontend/coverage/index.html"

test-watch:
	@echo "Running tests in watch mode..."
	@echo "Choose which to watch:"
	@echo "  1) Backend"
	@echo "  2) Frontend"
	@echo "  3) Both (in separate terminals)"
	@read -p "Enter choice [1-3]: " choice; \
	case $$choice in \
		1) cd backend && . ./venv/bin/activate && pytest-watch ;; \
		2) cd frontend && npm test ;; \
		3) echo "Open two terminals and run:" && \
		   echo "  Terminal 1: cd backend && . ./venv/bin/activate && pytest-watch" && \
		   echo "  Terminal 2: cd frontend && npm test" ;; \
		*) echo "Invalid choice" ;; \
	esac

test-file:
	@read -p "Enter test file path (e.g., backend/tests/unit/test_config.py): " file; \
	if [ -f "$$file" ]; then \
		case "$$file" in \
			backend/*) cd backend && . ./venv/bin/activate && pytest "$$file" -v ;; \
			frontend/*) cd frontend && npm test "$$file" -- --run ;; \
			*) echo "Unable to determine project type" ;; \
		esac \
	else \
		echo "File not found: $$file"; \
	fi

# =============================================================================
# CODE QUALITY
# =============================================================================

lint: lint-backend lint-frontend
	@echo "All linting complete"

lint-backend:
	@echo "Linting backend..."
	@cd backend && . ./venv/bin/activate && flake8 app/ tests/ --max-line-length=120 || true
	@cd backend && . ./venv/bin/activate && mypy app/ || true

lint-frontend:
	@echo "Linting frontend..."
	@cd frontend && npm run lint

typecheck:
	@echo "Running type checks..."
	@cd frontend && npm run typecheck

format:
	@echo "Formatting code..."
	@cd backend && . ./venv/bin/activate && black app/ tests/
	@cd frontend && npm run lint -- --fix

# =============================================================================
# BUILD AND DEPLOY
# =============================================================================

build: build-frontend
	@echo "Production build complete"

build-frontend:
	@echo "Building frontend for production..."
	@cd frontend && npm run build
	@echo "Frontend build complete: frontend/dist/"

preview:
	@echo "Previewing production build..."
	@cd frontend && npm run preview

# =============================================================================
# CLEANUP
# =============================================================================

clean:
	@echo "Cleaning build artifacts and caches..."
	@rm -rf backend/__pycache__
	@rm -rf backend/app/__pycache__
	@rm -rf backend/app/**/__pycache__
	@rm -rf backend/tests/__pycache__
	@rm -rf backend/tests/**/__pycache__
	@rm -rf backend/.pytest_cache
	@rm -rf backend/htmlcov
	@rm -rf backend/.coverage
	@rm -rf frontend/dist
	@rm -rf frontend/node_modules/.vite
	@rm -rf frontend/coverage
	@find . -type f -name "*.pyc" -delete
	@find . -type d -name "__pycache__" -delete
	@echo "Cleanup complete"

clean-all: clean
	@echo "Deep cleaning (including dependencies)..."
	@rm -rf backend/venv
	@rm -rf frontend/node_modules
	@echo "Deep clean complete"
	@echo "Run 'make setup' to reinstall dependencies"

# =============================================================================
# UTILITIES
# =============================================================================

check:
	@echo "Checking prerequisites..."
	@command -v python3 >/dev/null 2>&1 || { echo "python3 not found"; exit 1; }
	@command -v node >/dev/null 2>&1 || { echo "node not found"; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo "npm not found"; exit 1; }
	@command -v docker >/dev/null 2>&1 || { echo "docker not found (required for execution)"; }
	@echo "All prerequisites found"
	@echo ""
	@python3 --version
	@node --version
	@npm --version

status:
	@echo "Project Status"
	@echo ""
	@echo "Backend:"
	@if [ -d "backend/venv" ]; then \
		echo "Virtual environment exists"; \
		cd backend && . ./venv/bin/activate && pip list | grep -E "fastapi|pytest" | head -5; \
	else \
		echo "Virtual environment not found - run 'make setup'"; \
	fi
	@echo ""
	@echo "Frontend:"
	@if [ -d "frontend/node_modules" ]; then \
		echo "Node modules installed"; \
	else \
		echo "Node modules not found - run 'make setup'"; \
	fi
	@echo ""
	@if [ -f "backend/.env" ]; then \
		echo "Backend .env configured"; \
	else \
		echo "Backend .env not found - copy from .env.example"; \
	fi

commit:
	@git status
	@echo ""
	@read -p "Commit message: " msg; \
	git add . && git commit -m "$$msg"

push:
	@git push origin $$(git branch --show-current)