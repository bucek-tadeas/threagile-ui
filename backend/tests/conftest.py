"""
Pytest configuration and shared fixtures.
"""

import os
import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch


@pytest.fixture(autouse=True)
def clear_config_cache():
    import app.config
    app.config._config = None
    yield
    app.config._config = None


@pytest.fixture
def test_client():
    with patch.dict(os.environ, {
        "USING_LOCAL_STORAGE": "true",
        "USING_GITHUB": "false",
        "ALLOWED_PATHS": "/tmp/test-models",
        "THREAGILE_DIRECTORY": "/tmp/threagile",
        "SESSION_TTL_SECONDS": "3600",
        "COOKIE_SECURE": "false",
        "COOKIE_SAMESITE": "lax",
        "STORE_LOCAL_ENABLED": "true",
        "STORE_GITHUB_ENABLED": "false",
    }):
        from app.main import app
        client = TestClient(app)
        yield client


@pytest.fixture
def test_env_vars():
    return {
        "USING_LOCAL_STORAGE": "true",
        "USING_GITHUB": "false",
        "ALLOWED_PATHS": "/tmp/test-models",
        "THREAGILE_DIRECTORY": "/tmp/threagile",
        "SESSION_TTL_SECONDS": "3600",
        "COOKIE_SECURE": "false",
        "COOKIE_SAMESITE": "lax",
        "STORE_LOCAL_ENABLED": "true",
        "STORE_GITHUB_ENABLED": "false",
    }


@pytest.fixture
def test_env_with_github():
    return {
        "USING_LOCAL_STORAGE": "false",
        "USING_GITHUB": "true",
        "GITHUB_CLIENT_ID": "test_client_id",
        "GITHUB_CLIENT_SECRET": "test_client_secret",
        "GITHUB_REDIRECT_URI": "http://localhost:8000/auth/callback",
        "GITHUB_ORG_URI": "https://api.github.com/orgs/test-org",
        "THREAGILE_DIRECTORY": "/tmp/threagile",
        "SESSION_TTL_SECONDS": "3600",
        "STORE_GITHUB_ENABLED": "true",
    }


@pytest.fixture
def sample_valid_yaml():
    return """
threagile_version: 1.0.0

title: Test Threat Model
date: 2024-01-01
author:
  name: Test Author
  homepage: https://example.com

business_overview:
  description: Test business overview

technical_assets:
  web-server:
    id: web-server
    title: Web Server
    type: process
    usage: business
    technologies:
      - web-server
    data_assets_processed:
      - customer-data
    data_formats_accepted:
      - json

data_assets:
  customer-data:
    id: customer-data
    title: Customer Data
    usage: business
    confidentiality: confidential
    integrity: critical
    availability: critical
"""


@pytest.fixture
def sample_invalid_yaml():
    return """
threagile_version: 1.0.0
title: Test
technical_assets:
  - invalid: [unclosed
"""


@pytest.fixture
def sample_yaml_missing_required():
    return """
threagile_version: 1.0.0
title: Test Threat Model
"""


@pytest.fixture
def mock_docker(monkeypatch):
    mock_result = MagicMock()
    mock_result.returncode = 0
    mock_result.stdout = "Docker execution successful"
    mock_result.stderr = ""

    mock_run = MagicMock(return_value=mock_result)
    monkeypatch.setattr("subprocess.run", mock_run)

    return mock_run


@pytest.fixture
def tmp_allowed_path(tmp_path):
    allowed_path = tmp_path / "allowed"
    allowed_path.mkdir(parents=True, exist_ok=True)
    return allowed_path


@pytest.fixture
def tmp_threagile_dir(tmp_path):
    threagile_dir = tmp_path / "threagile"
    threagile_dir.mkdir(parents=True, exist_ok=True)

    support_dir = threagile_dir / "support"
    support_dir.mkdir()

    schema_file = support_dir / "schema.json"
    schema_file.write_text('{"type": "object", "properties": {}}')

    return threagile_dir


@pytest.fixture
def mock_config():
    config = MagicMock()
    config.using_local_storage = True
    config.using_github = False
    config.session_ttl_seconds = 3600
    config.cookie_secure = False
    config.cookie_samesite = "lax"
    config.threagile_directory = "/tmp/threagile"
    config.store_local_enabled = True
    config.store_github_enabled = False
    config.allowed_paths = "/tmp/test-models"
    config.get_available_methods.return_value = ["local", "server"]

    return config
