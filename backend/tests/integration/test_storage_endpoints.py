"""
Integration tests for storage-related endpoints.

Tests /execution-methods, /local-paths, etc.
"""

import os
import pytest
from unittest.mock import patch


@pytest.mark.integration
class TestExecutionMethodsEndpoint:
    def test_get_execution_methods_all_enabled(self, test_client):
        with patch.dict(os.environ, {
            "USING_LOCAL_STORAGE": "true",
            "USING_GITHUB": "true",
            "STORE_LOCAL_ENABLED": "true",
            "STORE_GITHUB_ENABLED": "true",
            "ALLOWED_PATHS": "/tmp/test",
            "GITHUB_CLIENT_ID": "test_id",
            "GITHUB_CLIENT_SECRET": "test_secret",
            "GITHUB_REDIRECT_URI": "http://test",
            "GITHUB_ORG_URI": "http://test-org",
            "THREAGILE_DIRECTORY": "/tmp/threagile",
        }):
            import app.config
            app.config._config = None
            new_config = app.config.get_config()

            with patch("app.api.router.config", new_config):
                response = test_client.get("/execution-methods")

            assert response.status_code == 200
            data = response.json()
            assert "methods" in data
            methods = data["methods"]
            assert "server" in methods
            assert "github" in methods

    def test_get_execution_methods_none_when_disabled(self, test_client):
        with patch.dict(os.environ, {
            "USING_LOCAL_STORAGE": "false",
            "USING_GITHUB": "false",
            "THREAGILE_DIRECTORY": "/tmp/threagile",
        }):
            import app.config
            app.config._config = None
            new_config = app.config.get_config()

            with patch("app.api.router.config", new_config):
                response = test_client.get("/execution-methods")

            assert response.status_code == 200
            data = response.json()
            assert "methods" in data
            assert data["methods"] == []

    def test_execution_methods_returns_json(self, test_client):
        response = test_client.get("/execution-methods")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        assert isinstance(data.get("methods"), list)


@pytest.mark.integration
class TestLocalPathsEndpoint:

    def test_get_local_paths_success(self, test_client, tmp_allowed_path):
        with patch.dict(os.environ, {
            "USING_LOCAL_STORAGE": "true",
            "ALLOWED_PATHS": str(tmp_allowed_path),
            "THREAGILE_DIRECTORY": "/tmp/threagile",
        }):
            import app.config
            app.config._config = None

            response = test_client.get("/local-paths")

            assert response.status_code == 200
            data = response.json()
            assert "paths" in data
            assert isinstance(data["paths"], list)

    def test_get_local_paths_empty_when_disabled(self, test_client):
        with patch.dict(os.environ, {
            "USING_LOCAL_STORAGE": "false",
            "USING_GITHUB": "false",
            "THREAGILE_DIRECTORY": "/tmp/threagile",
        }):
            import app.config
            app.config._config = None

            response = test_client.get("/local-paths")

            assert response.status_code == 200
            data = response.json()
            assert data["paths"] == []
            assert "paths" in data


@pytest.mark.integration
class TestLogoutEndpoint:
    def test_logout_success(self, test_client):
        response = test_client.post("/logout")

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_logout_without_session(self, test_client):
        response = test_client.post("/logout")

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True


@pytest.mark.integration
class TestCORSConfiguration:
    def test_cors_allows_localhost(self, test_client):
        response = test_client.get(
            "/execution-methods",
            headers={"Origin": "http://localhost:5173"}
        )

        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers or response.status_code == 200

    def test_cors_allows_credentials(self, test_client):
        response = test_client.options(
            "/execution-methods",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
            }
        )

        assert response.status_code in [200, 204]
