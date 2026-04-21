"""
Unit tests for configuration module.

Tests configuration loading, validation, and feature flag behavior.
"""

import os
import pytest
from unittest.mock import patch
from app.config import Config, get_config
from app.errors import ConfigurationException


@pytest.mark.unit
class TestConfigValidation:

    def test_config_with_all_features_enabled(self, test_env_vars):
        env_vars = {**test_env_vars, "USING_GITHUB": "true"}
        env_vars.update({
            "GITHUB_CLIENT_ID": "test_id",
            "GITHUB_CLIENT_SECRET": "test_secret",
            "GITHUB_REDIRECT_URI": "http://test",
            "GITHUB_ORG_URI": "http://test-org",
        })
        
        with patch.dict(os.environ, env_vars, clear=True):
            config = Config()
            assert config.using_local_storage is True
            assert config.using_github is True
            assert config.allowed_paths is not None
            assert config.github_client_id is not None

    def test_config_with_local_storage_only(self, test_env_vars):
        with patch.dict(os.environ, test_env_vars, clear=True):
            config = Config()
            assert config.using_local_storage is True
            assert config.using_github is False
            assert config.allowed_paths == "/tmp/test-models"
            assert config.github_client_id is None

    def test_config_with_github_only(self, test_env_with_github):
        with patch.dict(os.environ, test_env_with_github, clear=True):
            config = Config()
            assert config.using_local_storage is False
            assert config.using_github is True
            assert config.allowed_paths is None
            assert config.github_client_id == "test_client_id"

    def test_config_with_both_disabled(self):
        env_vars = {
            "USING_LOCAL_STORAGE": "false",
            "USING_GITHUB": "false",
            "THREAGILE_DIRECTORY": "/tmp/threagile",
        }
        
        with patch.dict(os.environ, env_vars, clear=True):
            config = Config()
            assert config.using_local_storage is False
            assert config.using_github is False
            assert config.allowed_paths is None
            assert config.github_client_id is None

    def test_config_missing_required_threagile_directory(self):
        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(ConfigurationException) as exc_info:
                Config()
            assert "THREAGILE_DIRECTORY" in str(exc_info.value)

    def test_config_missing_github_vars_when_enabled(self):
        env_vars = {
            "USING_LOCAL_STORAGE": "false",
            "USING_GITHUB": "true",
            "THREAGILE_DIRECTORY": "/tmp/threagile",
        }
        
        with patch.dict(os.environ, env_vars, clear=True):
            with pytest.raises(ConfigurationException) as exc_info:
                Config()
            error_msg = str(exc_info.value)
            assert "GITHUB_CLIENT_ID" in error_msg or "Missing required configuration" in error_msg

    def test_config_missing_allowed_paths_when_local_enabled(self):
        env_vars = {
            "USING_LOCAL_STORAGE": "true",
            "USING_GITHUB": "false",
            "THREAGILE_DIRECTORY": "/tmp/threagile",
        }
        
        with patch.dict(os.environ, env_vars, clear=True):
            with pytest.raises(ConfigurationException) as exc_info:
                Config()
            assert "ALLOWED_PATHS" in str(exc_info.value)


@pytest.mark.unit
class TestGetAvailableMethods:
    def test_all_methods_available(self, test_env_vars):
        env_vars = {**test_env_vars, "USING_GITHUB": "true", "STORE_GITHUB_ENABLED": "true"}
        env_vars.update({
            "GITHUB_CLIENT_ID": "test_id",
            "GITHUB_CLIENT_SECRET": "test_secret",
            "GITHUB_REDIRECT_URI": "http://test",
            "GITHUB_ORG_URI": "http://test-org",
        })
        
        with patch.dict(os.environ, env_vars, clear=True):
            config = Config()
            methods = config.get_available_methods()
            assert "local" in methods
            assert "server" in methods
            assert "github" in methods

    def test_only_local_method_when_features_disabled(self):
        env_vars = {
            "USING_LOCAL_STORAGE": "false",
            "USING_GITHUB": "false",
            "THREAGILE_DIRECTORY": "/tmp/threagile",
        }
        
        with patch.dict(os.environ, env_vars, clear=True):
            config = Config()
            methods = config.get_available_methods()
            assert methods == ["local"]

    def test_server_method_when_local_enabled(self, test_env_vars):
        with patch.dict(os.environ, test_env_vars, clear=True):
            config = Config()
            methods = config.get_available_methods()
            assert "local" in methods
            assert "server" in methods

    def test_no_server_when_store_local_disabled(self, test_env_vars):
        env_vars = {**test_env_vars, "STORE_LOCAL_ENABLED": "false"}
        
        with patch.dict(os.environ, env_vars, clear=True):
            config = Config()
            methods = config.get_available_methods()
            assert "local" in methods
            assert "server" not in methods


@pytest.mark.unit
class TestConfigDefaults:
    def test_default_session_ttl(self, test_env_vars):
        env_vars = dict(test_env_vars)
        del env_vars["SESSION_TTL_SECONDS"]
        
        with patch.dict(os.environ, env_vars, clear=True):
            config = Config()
            assert config.session_ttl_seconds == 43200

    def test_default_cookie_secure(self, test_env_vars):
        env_vars = dict(test_env_vars)
        del env_vars["COOKIE_SECURE"]
        
        with patch.dict(os.environ, env_vars, clear=True):
            config = Config()
            assert config.cookie_secure is False

    def test_default_cookie_samesite(self, test_env_vars):
        env_vars = dict(test_env_vars)
        del env_vars["COOKIE_SAMESITE"]
        
        with patch.dict(os.environ, env_vars, clear=True):
            config = Config()
            assert config.cookie_samesite == "lax"

    def test_invalid_cookie_samesite_falls_back_to_lax(self, test_env_vars):
        env_vars = {**test_env_vars, "COOKIE_SAMESITE": "invalid"}
        
        with patch.dict(os.environ, env_vars, clear=True):
            config = Config()
            assert config.cookie_samesite == "lax"
