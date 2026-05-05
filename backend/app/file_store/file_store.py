"""
File storage and threat model execution via Docker.

Provides:
  - secure_sanitize_filepath: multi-layer path sanitization to prevent traversal attacks
    (decodes URL encoding, strips leading slashes, removes .., and applies pathvalidate)
  - StoreThreatModel: manages allowed filesystem paths and executes the threagile Docker
    container against a YAML model file, capturing stdout/stderr and return codes

Supports both Docker and Podman (auto-detected via --version output).
"""

import shutil
import subprocess
from pathvalidate import sanitize_filepath
from pathlib import Path
import os
import urllib.parse
from app.errors import FileException, log_error
from app.config import get_config


def _is_podman() -> bool:
    docker_path = shutil.which("docker")
    if docker_path is None:
        return False
    try:
        result = subprocess.run([docker_path, "--version"], capture_output=True, text=True, timeout=10)
        return "podman" in result.stdout.lower()
    except Exception:
        return False


def secure_sanitize_filepath(filepath: str) -> str:
    if not filepath:
        return ""

    decoded = filepath
    for _ in range(3):
        try:
            new_decoded = urllib.parse.unquote(decoded)
            if new_decoded == decoded:
                break
            decoded = new_decoded
        except Exception:
            break

    decoded = decoded.replace('\x00', '')

    decoded = decoded.replace('\\', '/')

    while decoded.startswith('/'):
        decoded = decoded[1:]

    parts = decoded.split('/')
    safe_parts = []
    for part in parts:
        if part in ('..', '.', ''):
            continue
        safe_parts.append(part)

    result = '/'.join(safe_parts) if safe_parts else 'file'

    result = sanitize_filepath(result)

    return result


class StoreThreatModel:
    def __init__(self):
        config = get_config()

        if config.allowed_paths:
            self.allowed_paths = config.allowed_paths.split(",")
        else:
            self.allowed_paths = []

    def get_allowed_paths(self):
        if not self.allowed_paths:
            log_error("WARNING", "No allowed paths configured (USING_LOCAL_STORAGE may be disabled)")
            return []

        results = []
        for path in self.allowed_paths:
            try:
                base_dir = os.path.abspath(path)
                if not os.path.exists(base_dir):
                    os.makedirs(base_dir, exist_ok=True)
                results.append(path)
            except OSError as e:
                log_error(
                    "ERROR", f"Failed to access/create directory {path}",
                    error_code="FILE_ACCESS_ERROR", exception=e,
                )
                raise FileException(
                    f"Cannot access directory: {path}",
                    details={"path": path, "error": str(e)}
                )
        return results

    def store_local(self, threagile_directory_sanitized, file_path_sanitized):
        try:
            file_path = Path(file_path_sanitized).resolve()
            work_dir = file_path.parent

            if not file_path.exists():
                log_error("WARNING", f"Threat model file not found: {file_path}", error_code="FILE_NOT_FOUND")
                return {
                    "success": False,
                    "message": f"Threat model file not found: {file_path}",
                    "return_code": -1,
                    "error_code": "FILE_NOT_FOUND"
                }

            log_error("INFO", f"Executing threat model locally: {file_path}")

            cmd = ["docker", "run", "--rm"]
            if _is_podman():
                cmd.append("--userns=keep-id")
            cmd += [
                "-v", f"{work_dir}:/app/work:Z",
                "threagile/threagile",
                "-verbose",
                "-model", f"/app/work/{file_path.name}",
                "-output", "/app/work/"
            ]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)

            if result.returncode == 0:
                log_error("INFO", f"Threat model executed successfully: {file_path}")
                return {
                    "success": True,
                    "message": result.stdout,
                    "return_code": result.returncode
                }
            else:
                log_error("ERROR", f"Threat model execution failed: {file_path}", error_code="DOCKER_EXECUTION_FAILED")
                return {
                    "success": False,
                    "message": result.stderr if result.stderr else "Docker execution failed with unknown error",
                    "return_code": result.returncode,
                    "error_code": "DOCKER_EXECUTION_FAILED"
                }
        except subprocess.TimeoutExpired as e:
            log_error(
                "ERROR", f"Threat model execution timed out: {file_path_sanitized}",
                error_code="DOCKER_TIMEOUT", exception=e,
            )
            return {
                "success": False,
                "message": "Threat model execution timed out (>5 minutes)",
                "return_code": -1,
                "error_code": "DOCKER_TIMEOUT"
            }
        except FileNotFoundError as e:
            log_error("ERROR", "Docker is not installed or not in PATH", error_code="DOCKER_NOT_FOUND", exception=e)
            return {
                "success": False,
                "message": "Docker is not installed or not available in PATH",
                "return_code": -1,
                "error_code": "DOCKER_NOT_FOUND"
            }
        except Exception as e:
            log_error(
                "ERROR", "Failed to execute threat model locally",
                error_code="LOCAL_EXECUTION_ERROR", exception=e,
            )
            return {
                "success": False,
                "message": f"Failed to execute threat model: {str(e)}",
                "return_code": -1,
                "error_code": "LOCAL_EXECUTION_ERROR"
            }

    def store_github(self, threagile_directory, yaml_model, github_repo, github_branch, github_file_path):
        try:
            if not os.path.exists(threagile_directory):
                log_error(
                    "WARNING", f"Threagile directory not found: {threagile_directory}",
                    error_code="DIR_NOT_FOUND",
                )
                return {
                    "success": False,
                    "message": f"Threagile directory not found: {threagile_directory}",
                    "return_code": -1,
                    "error_code": "DIR_NOT_FOUND"
                }

            log_error("INFO", f"Executing threat model from GitHub: {github_repo}/{github_file_path}")

            cmd = ["docker", "run", "--rm"]
            if _is_podman():
                cmd.append("--userns=keep-id")
            cmd += [
                "-v", f"{threagile_directory}:/app/work:Z",
                "threagile/threagile",
                "-verbose",
                "-model", f"/app/work/{github_file_path}",
                "-output", "/app/work/"
            ]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)

            if result.returncode == 0:
                log_error("INFO", f"Threat model executed successfully from GitHub: {github_repo}")
                return {
                    "success": True,
                    "message": result.stdout,
                    "return_code": result.returncode
                }
            else:
                log_error(
                    "ERROR",
                    f"Threat model execution failed from GitHub: {github_repo}",
                    error_code="DOCKER_EXECUTION_FAILED",
                )
                return {
                    "success": False,
                    "message": result.stderr if result.stderr else "Docker execution failed with unknown error",
                    "return_code": result.returncode,
                    "error_code": "DOCKER_EXECUTION_FAILED"
                }
        except subprocess.TimeoutExpired as e:
            log_error(
                "ERROR",
                f"Threat model execution timed out from GitHub: {github_repo}",
                error_code="DOCKER_TIMEOUT", exception=e,
            )
            return {
                "success": False,
                "message": "Threat model execution timed out (>5 minutes)",
                "return_code": -1,
                "error_code": "DOCKER_TIMEOUT"
            }
        except FileNotFoundError as e:
            log_error("ERROR", "Docker is not installed or not in PATH", error_code="DOCKER_NOT_FOUND", exception=e)
            return {
                "success": False,
                "message": "Docker is not installed or not available in PATH",
                "return_code": -1,
                "error_code": "DOCKER_NOT_FOUND"
            }
        except Exception as e:
            log_error(
                "ERROR", "Failed to execute threat model from GitHub",
                error_code="GITHUB_EXECUTION_ERROR", exception=e,
            )
            return {
                "success": False,
                "message": f"Failed to execute threat model: {str(e)}",
                "return_code": -1,
                "error_code": "GITHUB_EXECUTION_ERROR"
            }
