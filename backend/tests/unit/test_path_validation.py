"""
Unit tests for path validation and sanitization.

CRITICAL SECURITY TESTS - These test protection against path traversal attacks.
"""

import os
import pytest
from pathlib import Path
from app.file_store.file_store import secure_sanitize_filepath, StoreThreatModel
from unittest.mock import patch


@pytest.mark.unit
class TestPathSanitization:

    def test_sanitize_filepath_basic(self):
        result = secure_sanitize_filepath("normal_file.yaml")
        assert result == "normal_file.yaml"

    def test_sanitize_filepath_with_spaces(self):
        result = secure_sanitize_filepath("my file.yaml")
        assert "my file.yaml" in result or "my_file.yaml" in result

    def test_sanitize_filepath_removes_dangerous_chars(self):
        dangerous = "file\x00name.yaml"  # null byte
        result = secure_sanitize_filepath(dangerous)
        assert "\x00" not in result

    def test_path_traversal_attempt_basic(self):
        malicious = "../../etc/passwd"
        result = secure_sanitize_filepath(malicious)
        assert "." not in result or ".." not in result

    def test_path_traversal_attempt_complex(self):
        malicious = "../../../var/log/system.log"
        result = secure_sanitize_filepath(malicious)
        assert ".." not in result


@pytest.mark.unit
class TestStoreThreatModelPathValidation:

    def test_get_allowed_paths_with_valid_paths(self, tmp_allowed_path):
        import app.config
        app.config._config = None
        
        with patch.dict(os.environ, {
            "USING_LOCAL_STORAGE": "true",
            "ALLOWED_PATHS": str(tmp_allowed_path),
            "THREAGILE_DIRECTORY": "/tmp/threagile",
        }):
            store = StoreThreatModel()
            paths = store.get_allowed_paths()
            assert len(paths) > 0
            assert str(tmp_allowed_path) in paths

    def test_get_allowed_paths_creates_missing_dirs(self, tmp_path):
        import app.config
        app.config._config = None
        
        new_path = tmp_path / "new_allowed_path"
        
        with patch.dict(os.environ, {
            "USING_LOCAL_STORAGE": "true",
            "ALLOWED_PATHS": str(new_path),
            "THREAGILE_DIRECTORY": "/tmp/threagile",
        }):
            store = StoreThreatModel()
            paths = store.get_allowed_paths()
            assert new_path.exists()
            assert str(new_path) in paths

    def test_get_allowed_paths_empty_when_disabled(self):
        import app.config
        app.config._config = None
        
        with patch.dict(os.environ, {
            "USING_LOCAL_STORAGE": "false",
            "USING_GITHUB": "false",
            "ALLOWED_PATHS": "",
            "THREAGILE_DIRECTORY": "/tmp/threagile",
        }):
            store = StoreThreatModel()
            paths = store.get_allowed_paths()
            assert paths == []

    def test_store_local_requires_valid_file_path(self, tmp_allowed_path, tmp_threagile_dir):
        with patch.dict(os.environ, {
            "USING_LOCAL_STORAGE": "true",
            "ALLOWED_PATHS": str(tmp_allowed_path),
            "THREAGILE_DIRECTORY": str(tmp_threagile_dir),
        }):
            store = StoreThreatModel()
            
            result = store.store_local(
                str(tmp_threagile_dir),
                str(tmp_allowed_path / "nonexistent.yaml")
            )
            
            assert result["success"] is False
            assert "not found" in result["message"].lower()


@pytest.mark.unit
class TestPathResolution:

    def test_resolve_relative_path(self, tmp_path):
        relative = Path("./test.yaml")
        absolute = relative.resolve()
        assert absolute.is_absolute()

    def test_resolve_handles_symlinks(self, tmp_path):
        real_dir = tmp_path / "real"
        real_dir.mkdir()
        
        link_dir = tmp_path / "link"
        try:
            link_dir.symlink_to(real_dir)
            assert link_dir.resolve() == real_dir.resolve()
        except OSError:
            pytest.skip("Platform doesn't support symlinks")

    def test_path_comparison_normalized(self, tmp_path):
        path1 = tmp_path / "dir1" / ".." / "dir2" / "file.yaml"
        path2 = tmp_path / "dir2" / "file.yaml"
        
        assert path1.resolve() == path2.resolve()


@pytest.mark.unit
class TestSecurityScenarios:

    def test_null_byte_injection(self):
        malicious = "file.yaml\x00.txt"
        result = secure_sanitize_filepath(malicious)
        assert "\x00" not in result

    def test_absolute_path_in_filename(self):
        if os.name == 'nt':
            malicious = "C:\\Windows\\System32\\config\\sam"
        else:
            malicious = "/etc/shadow"
        
        result = secure_sanitize_filepath(malicious)
        assert not os.path.isabs(result)

    def test_unicode_path_traversal(self):
        malicious_variants = [
            "..%2F..%2Fetc%2Fpasswd",
            "..\\//..\\/etc/passwd",
        ]
        
        for malicious in malicious_variants:
            result = secure_sanitize_filepath(malicious)
            assert ".." not in result
