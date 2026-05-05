"""
Integration tests for threat model execution endpoint.

Tests /execute-threat-model with various scenarios.
"""

import os
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from app.errors import ValidationException


@pytest.mark.integration
class TestExecuteThreatModelEndpoint:
    def test_execute_requires_destination(self, test_client, sample_valid_yaml):
        response = test_client.post(
            "/execute-threat-model",
            json={
                "yaml_model": sample_valid_yaml,
                "model_name": "test.yaml",
                "destination": []
            }
        )

        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert "destination" in data["error"].lower()

    def test_execute_requires_yaml_model(self, test_client):
        response = test_client.post(
            "/execute-threat-model",
            json={
                "destination": ["server"],
                "model_name": "test.yaml",
                "yaml_model": ""
            }
        )

        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False

    def test_execute_rejects_invalid_yaml(self, test_client, sample_invalid_yaml, tmp_threagile_dir):
        with patch.dict(os.environ, {
            "THREAGILE_DIRECTORY": str(tmp_threagile_dir),
            "USING_LOCAL_STORAGE": "true",
            "ALLOWED_PATHS": "/tmp/test",
            "STORE_LOCAL_ENABLED": "true",
        }):
            response = test_client.post(
                "/execute-threat-model",
                json={
                    "destination": ["server"],
                    "model_name": "test.yaml",
                    "yaml_model": sample_invalid_yaml,
                    "final_local_path": "/tmp/test/test.yaml"
                }
            )

        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert "yaml" in data["error"].lower() or "invalid" in data["error"].lower()

    def test_execute_validates_against_schema(
        self, test_client, sample_yaml_missing_required, tmp_threagile_dir
    ):
        with patch.dict(os.environ, {
            "THREAGILE_DIRECTORY": str(tmp_threagile_dir),
            "USING_LOCAL_STORAGE": "true",
            "ALLOWED_PATHS": "/tmp/test",
            "STORE_LOCAL_ENABLED": "true",
        }):
            import app.config
            app.config._config = None

            response = test_client.post(
                "/execute-threat-model",
                json={
                    "destination": ["server"],
                    "model_name": "test.yaml",
                    "yaml_model": sample_yaml_missing_required,
                    "final_local_path": "/tmp/test/test.yaml"
                }
            )

            assert response.status_code in [200, 400]

    def test_execute_with_mock_docker(
        self, test_client, sample_valid_yaml, mock_docker, tmp_threagile_dir, tmp_allowed_path
    ):
        test_file = tmp_allowed_path / "test.yaml"

        with patch.dict(os.environ, {
            "THREAGILE_DIRECTORY": str(tmp_threagile_dir),
            "USING_LOCAL_STORAGE": "true",
            "ALLOWED_PATHS": str(tmp_allowed_path),
            "STORE_LOCAL_ENABLED": "true",
        }):
            import app.config
            app.config._config = None

            response = test_client.post(
                "/execute-threat-model",
                json={
                    "destination": ["server"],
                    "model_name": "test.yaml",
                    "yaml_model": sample_valid_yaml,
                    "final_local_path": str(test_file)
                }
            )

            assert response.status_code == 200
            response.json()

            assert mock_docker.called

    def test_execute_local_disabled_returns_error(self, test_client, sample_valid_yaml, tmp_threagile_dir):
        with patch.dict(os.environ, {
            "USING_LOCAL_STORAGE": "true",
            "ALLOWED_PATHS": "/tmp/test",
            "STORE_LOCAL_ENABLED": "false",
            "THREAGILE_DIRECTORY": str(tmp_threagile_dir),
        }):
            import app.config
            app.config._config = None

            response = test_client.post(
                "/execute-threat-model",
                json={
                    "destination": ["server"],
                    "model_name": "test.yaml",
                    "yaml_model": sample_valid_yaml,
                    "final_local_path": "/tmp/test/test.yaml"
                }
            )

            assert response.status_code == 200
            data = response.json()
            if "execution_results" in data:
                assert "local" in data["execution_results"]
                assert data["execution_results"]["local"]["success"] is False

    def test_execute_github_creates_pull_request(
        self,
        test_client,
        sample_valid_yaml,
        tmp_threagile_dir,
        mock_docker,
    ):
        from app.main import app as fastapi_app
        from app.api import router as router_module

        mock_api_client = MagicMock()
        mock_api_client.generate_source_branch_name.return_value = "threat-model-pr/main/20260317-000000-aaaa1111"
        mock_api_client.publish_execution_artifacts_as_pr = AsyncMock(
            return_value={
                "source_branch": "threat-model-pr/main/20260317-000000-aaaa1111",
                "target_branch": "main",
                "commit_sha": "abc123",
                "pull_request_url": "https://github.com/org/repo/pull/123",
                "pull_request_number": 123,
                "uploaded_paths": ["path/in/repo/threatmodel.yaml"],
            }
        )

        fastapi_app.dependency_overrides[router_module.get_api_client] = lambda: mock_api_client
        router_module.sessions.set("test-session", {
            "access_token": "token123",
            "expires_at": None,
        })

        try:
            with patch.dict(os.environ, {
                "THREAGILE_DIRECTORY": str(tmp_threagile_dir),
                "USING_LOCAL_STORAGE": "true",
                "USING_GITHUB": "true",
                "ALLOWED_PATHS": "/tmp/test",
                "STORE_LOCAL_ENABLED": "true",
                "STORE_GITHUB_ENABLED": "true",
                "GITHUB_PR_ENABLED": "true",
            }):
                import app.config as app_config
                app_config._config = None

                test_client.cookies.set("session_id", "test-session")

                response = test_client.post(
                    "/execute-threat-model",
                    json={
                        "destination": ["github"],
                        "model_name": "threatmodel.yaml",
                        "yaml_model": sample_valid_yaml,
                        "github_repo": "org/repo",
                        "github_branch": "main",
                        "github_file_path": "path/in/repo",
                        "github_overwrite_confirmed": True,
                    },
                )

            assert response.status_code == 200
            data = response.json()
            assert data["execution_results"]["github"]["success"] is True
            assert data["execution_results"]["github"]["pull_request_url"] == "https://github.com/org/repo/pull/123"
            assert mock_api_client.publish_execution_artifacts_as_pr.called
        finally:
            test_client.cookies.clear()
            fastapi_app.dependency_overrides.clear()
            router_module.sessions.delete("test-session")

    def test_execute_github_overwrite_requires_confirmation(
        self,
        test_client,
        sample_valid_yaml,
        tmp_threagile_dir,
        mock_docker,
    ):
        from app.main import app as fastapi_app
        from app.api import router as router_module

        mock_api_client = MagicMock()
        mock_api_client.generate_source_branch_name.return_value = "threat-model-pr/main/20260317-000001-bbbb2222"
        mock_api_client.publish_execution_artifacts_as_pr = AsyncMock(
            side_effect=ValidationException(
                "Target file already exists. Confirm overwrite to continue.",
                details={"path": "path/in/repo/threatmodel.yaml"},
            )
        )

        fastapi_app.dependency_overrides[router_module.get_api_client] = lambda: mock_api_client
        router_module.sessions.set("test-session", {
            "access_token": "token123",
            "expires_at": None,
        })

        try:
            with patch.dict(os.environ, {
                "THREAGILE_DIRECTORY": str(tmp_threagile_dir),
                "USING_LOCAL_STORAGE": "true",
                "USING_GITHUB": "true",
                "ALLOWED_PATHS": "/tmp/test",
                "STORE_LOCAL_ENABLED": "true",
                "STORE_GITHUB_ENABLED": "true",
                "GITHUB_PR_ENABLED": "true",
            }):
                import app.config as app_config
                app_config._config = None

                test_client.cookies.set("session_id", "test-session")

                response = test_client.post(
                    "/execute-threat-model",
                    json={
                        "destination": ["github"],
                        "model_name": "threatmodel.yaml",
                        "yaml_model": sample_valid_yaml,
                        "github_repo": "org/repo",
                        "github_branch": "main",
                        "github_file_path": "path/in/repo",
                        "github_overwrite_confirmed": False,
                    },
                )

            assert response.status_code == 200
            data = response.json()
            github_result = data["execution_results"]["github"]
            assert github_result["success"] is False
            assert github_result["error_code"] == "VALIDATION_ERROR"
        finally:
            test_client.cookies.clear()
            fastapi_app.dependency_overrides.clear()
            router_module.sessions.delete("test-session")


@pytest.mark.integration
class TestExecutionErrorHandling:
    def test_missing_threagile_directory(self, test_client, sample_valid_yaml):
        with patch.dict(os.environ, {}, clear=True):
            with patch.dict(os.environ, {
                "USING_LOCAL_STORAGE": "true",
                "ALLOWED_PATHS": "/tmp/test",
            }):
                pass

    def test_malformed_json_body(self, test_client):
        response = test_client.post(
            "/execute-threat-model",
            content="not json",
            headers={"Content-Type": "application/json"}
        )

        assert response.status_code == 422
