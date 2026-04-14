from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from app.api.api_client import APIClient
from fastapi.responses import RedirectResponse
from fastapi import Request, Body
from fastapi import Cookie
from datetime import datetime, timedelta, timezone
import os
import uuid
import json
import tempfile
from pydantic import BaseModel
from jsonschema import validate, ValidationError
import yaml
from app.file_store.file_store import StoreThreatModel, secure_sanitize_filepath
from pathlib import Path
from app.errors import (
    APIException,
    ValidationException,
    FileException,
    AuthenticationException,
    log_error,
)
from app.config import get_config

router = APIRouter()

# Load configuration
config = get_config()

sessions = {}


def _get_session(session_id: str | None):
    if not session_id:
        return None
    session = sessions.get(session_id)
    if not session:
        return None
    expires_at = session.get("expires_at")
    if isinstance(expires_at, datetime) and expires_at <= datetime.now(timezone.utc):
        sessions.pop(session_id, None)
        return None
    return session


def _get_access_token(session_id: str | None) -> str | None:
    session = _get_session(session_id)
    if not session:
        return None
    return session.get("access_token")


class SaveConfig(BaseModel):
    destination: list[str]
    final_local_path: str | None = None
    github_repo: str | None = None
    github_branch: str | None = None
    github_file_path: str | None = None
    github_overwrite_confirmed: bool = False
    model_name: str
    yaml_model: str


def get_api_client():
    return APIClient()


@router.get("/auth/github-url")
def get_github_login_url(api_client: APIClient = Depends(get_api_client)):
    try:
        url = api_client.get_github_auth_url()
        return JSONResponse(content={"url": url})
    except APIException as e:
        return e.to_response()
    except Exception as e:
        log_error("ERROR", "Failed to generate GitHub auth URL", error_code="GITHUB_URL_ERROR", exception=e)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "Failed to generate GitHub authentication URL",
                "error_code": "GITHUB_URL_ERROR",
            },
        )


@router.get("/auth/callback")
async def github_callback(request: Request, api_client: APIClient = Depends(get_api_client)):
    try:
        code = request.query_params.get("code")
        if not code:
            raise ValidationException("Missing code from GitHub")

        try:
            access_token = await api_client.exchange_code_for_token(code)
        except APIException:
            raise
        except Exception as e:
            log_error("ERROR", "Failed to exchange GitHub code for token", error_code="TOKEN_EXCHANGE_ERROR", exception=e)
            raise AuthenticationException("Failed to obtain access token from GitHub")

        session_id = uuid.uuid4().hex
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=config.session_ttl_seconds)
        sessions[session_id] = {
            "access_token": access_token,
            "expires_at": expires_at,
        }

        try:
            user_info = await api_client.get_user_info(access_token)
        except APIException:
            raise
        except Exception as e:
            log_error("ERROR", "Failed to fetch user info", error_code="USER_INFO_ERROR", exception=e)
            raise AuthenticationException("Failed to fetch user information")

        response = RedirectResponse(url="http://localhost:5173/draw")
        response.set_cookie(
            key="session_id",
            value=session_id,
            httponly=True,
            secure=config.cookie_secure,
            samesite=config.cookie_samesite,
            max_age=config.session_ttl_seconds,
            expires=expires_at,
        )
        return response
    except APIException as e:
        return e.to_response()
    except Exception as e:
        log_error("ERROR", "Unexpected error in GitHub callback", error_code="CALLBACK_ERROR", exception=e)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "An unexpected error occurred during authentication",
                "error_code": "CALLBACK_ERROR",
            },
        )


@router.get("/me")
async def get_current_user(session_id: str = Cookie(None), api_client: APIClient = Depends(get_api_client)):
    try:
        if not session_id:
            raise AuthenticationException("Not authenticated")

        access_token = _get_access_token(session_id)
        if not access_token:
            raise AuthenticationException("Session not found or expired")

        try:
            user_info = await api_client.get_user_info(access_token)
        except APIException:
            raise
        except Exception as e:
            log_error("ERROR", "Failed to fetch current user info", error_code="USER_INFO_ERROR", exception=e)
            raise AuthenticationException("Failed to fetch user information")

        return user_info["login"]
    except APIException as e:
        return e.to_response()
    except Exception as e:
        log_error("ERROR", "Unexpected error in /me endpoint", error_code="ME_ENDPOINT_ERROR", exception=e)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "An unexpected error occurred",
                "error_code": "ME_ENDPOINT_ERROR",
            },
        )


@router.post("/logout")
async def logout(session_id: str = Cookie(None)):
    if session_id:
        sessions.pop(session_id, None)
    response = JSONResponse(content={"success": True})
    response.delete_cookie("session_id")
    return response


@router.get("/execution-methods")
async def get_execution_methods():
    try:
        methods = config.get_available_methods()
        return {"methods": methods}
    except Exception as e:
        log_error("ERROR", "Failed to get execution methods", error_code="EXECUTION_METHODS_ERROR", exception=e)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "Failed to retrieve execution methods",
                "error_code": "EXECUTION_METHODS_ERROR",
            },
        )


@router.get("/local-paths")
async def get_local_paths():
    try:
        storeTM = StoreThreatModel()
        base_paths = storeTM.get_allowed_paths()
        results = list(base_paths)

        for base in base_paths:
            try:
                base_dir = os.path.abspath(base)
                for root, dirs, _files in os.walk(base_dir):
                    for d in dirs:
                        full_path = os.path.join(root, d)
                        rel_path = os.path.relpath(full_path, os.getcwd())
                        results.append(rel_path.replace("\\", "/"))
            except OSError as e:
                log_error("WARNING", f"Failed to walk directory {base}", error_code="DIR_WALK_ERROR", exception=e)
                continue

        results = sorted(results, key=lambda x: len(x))
        return {"paths": results}
    except APIException as e:
        return e.to_response()
    except Exception as e:
        log_error("ERROR", "Failed to get local paths", error_code="LOCAL_PATHS_ERROR", exception=e)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "Failed to retrieve local paths",
                "error_code": "LOCAL_PATHS_ERROR",
            },
        )


@router.get("/github-repos")
async def get_github_repos(api_client: APIClient = Depends(get_api_client), session_id: str = Cookie(None)):
    try:
        if not session_id:
            raise AuthenticationException("Not authenticated")

        access_token = _get_access_token(session_id)
        if not access_token:
            raise AuthenticationException("Session not found or expired")

        try:
            repos = await api_client.get_github_repos(access_token)
        except APIException:
            raise
        except Exception as e:
            log_error("ERROR", "Failed to fetch GitHub repos", error_code="REPOS_FETCH_ERROR", exception=e)
            raise

        return {"repos": repos}
    except APIException as e:
        return e.to_response()
    except Exception as e:
        log_error("ERROR", "Unexpected error in /github-repos endpoint", error_code="REPOS_ENDPOINT_ERROR", exception=e)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "Failed to retrieve GitHub repositories",
                "error_code": "REPOS_ENDPOINT_ERROR",
            },
        )


@router.get("/github-branches")
async def get_github_branches(request: Request, api_client: APIClient = Depends(get_api_client), session_id: str = Cookie(None)):
    try:
        if not session_id:
            raise AuthenticationException("Not authenticated")

        access_token = _get_access_token(session_id)
        if not access_token:
            raise AuthenticationException("Session not found or expired")

        repo = request.query_params.get("repo")
        if not repo:
            raise ValidationException("Missing 'repo' query parameter")

        try:
            branches = await api_client.get_github_branches(repo, access_token)
        except APIException:
            raise
        except Exception as e:
            log_error("ERROR", f"Failed to fetch branches for {repo}", error_code="BRANCHES_FETCH_ERROR", exception=e)
            raise

        return {"branches": branches}
    except APIException as e:
        return e.to_response()
    except Exception as e:
        log_error("ERROR", "Unexpected error in /github-branches endpoint", error_code="BRANCHES_ENDPOINT_ERROR", exception=e)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "Failed to retrieve GitHub branches",
                "error_code": "BRANCHES_ENDPOINT_ERROR",
            },
        )


@router.get("/github-files")
async def get_github_files(request: Request, api_client: APIClient = Depends(get_api_client), session_id: str = Cookie(None)):
    try:
        if not session_id:
            raise AuthenticationException("Not authenticated")

        access_token = _get_access_token(session_id)
        if not access_token:
            raise AuthenticationException("Session not found or expired")

        repo = request.query_params.get("repo")
        if not repo:
            raise ValidationException("Missing 'repo' query parameter")

        branch = request.query_params.get("branch")
        if not branch:
            raise ValidationException("Missing 'branch' query parameter")

        paths = [""]
        try:
            await api_client.walk_github_directory(repo, branch, access_token, "", paths)
        except APIException:
            raise
        except Exception as e:
            log_error("ERROR", f"Failed to walk GitHub directory {repo}/{branch}", error_code="FILES_FETCH_ERROR", exception=e)
            raise

        return {"paths": paths}
    except APIException as e:
        return e.to_response()
    except Exception as e:
        log_error("ERROR", "Unexpected error in /github-files endpoint", error_code="FILES_ENDPOINT_ERROR", exception=e)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "Failed to retrieve GitHub file paths",
                "error_code": "FILES_ENDPOINT_ERROR",
            },
        )


@router.post("/execute-threat-model")
async def execute_threat_model(
    save_config: SaveConfig = Body(...),
    session_id: str = Cookie(None),
    api_client: APIClient = Depends(get_api_client),
):
    try:
        threagile_directory = os.getenv("THREAGILE_DIRECTORY")
        if not threagile_directory:
            raise FileException(
                "THREAGILE_DIRECTORY environment variable is not set",
                details={"variable": "THREAGILE_DIRECTORY"},
            )

        store_local_enabled = os.getenv("STORE_LOCAL_ENABLED", "true").lower() == "true"
        store_github_enabled = os.getenv("STORE_GITHUB_ENABLED", "true").lower() == "true"

        if not save_config.destination:
            raise ValidationException("No destination specified for threat model execution")

        if not save_config.yaml_model:
            raise ValidationException("YAML model is required")

        try:
            final_local_path_sanitized = secure_sanitize_filepath(save_config.final_local_path) if save_config.final_local_path else None
            github_file_path_sanitized = secure_sanitize_filepath(save_config.github_file_path) if save_config.github_file_path else None
        except Exception as e:
            log_error("ERROR", "Failed to sanitize file paths", error_code="PATH_SANITIZATION_ERROR", exception=e)
            raise ValidationException(
                "Invalid file path format",
                details={"error": str(e)},
            )

        try:
            yaml_data = yaml.safe_load(save_config.yaml_model)
            if yaml_data is None:
                raise ValidationException("YAML model is empty")

            yaml_string = yaml.safe_dump(
                yaml_data,
                sort_keys=False,
                default_flow_style=False,
            )
        except yaml.YAMLError as e:
            log_error("ERROR", "Failed to parse YAML model", error_code="YAML_PARSE_ERROR", exception=e)
            raise ValidationException(
                f"Invalid YAML format: {str(e)}",
                details={"error": str(e)},
            )
        except Exception as e:
            log_error("ERROR", "Failed to process YAML", error_code="YAML_PROCESS_ERROR", exception=e)
            raise ValidationException(
                f"Failed to process YAML: {str(e)}",
                details={"error": str(e)},
            )

        try:
            schema_path = f"{threagile_directory}/support/schema.json"
            if not os.path.exists(schema_path):
                raise FileException(
                    f"Schema file not found: {schema_path}",
                    details={"path": schema_path},
                )

            with open(schema_path, "r") as f:
                schema = json.load(f)
        except FileException:
            raise
        except json.JSONDecodeError as e:
            log_error("ERROR", "Failed to parse schema JSON", error_code="SCHEMA_PARSE_ERROR", exception=e)
            raise FileException(
                "Invalid schema JSON",
                details={"error": str(e)},
            )
        except Exception as e:
            log_error("ERROR", "Failed to load schema", error_code="SCHEMA_LOAD_ERROR", exception=e)
            raise FileException(
                f"Failed to load schema: {str(e)}",
                details={"error": str(e)},
            )

        try:
            validate(instance=yaml_data, schema=schema)
        except ValidationError as e:
            log_error("WARNING", "YAML validation failed", error_code="VALIDATION_FAILED")
            raise ValidationException(
                f"YAML validation failed: {e.message}",
                details={
                    "path": list(e.path),
                    "message": e.message,
                    "failing_value": str(e.instance)[:100],
                },
            )

        execution_results = {}
        storeTM = StoreThreatModel()

        if "server" in save_config.destination:
            if store_local_enabled:
                try:
                    path = Path(final_local_path_sanitized)
                    path.parent.mkdir(parents=True, exist_ok=True)
                    with open(f"{final_local_path_sanitized}", "w") as f:
                        f.write(yaml_string)
                        f.flush()
                        os.fsync(f.fileno())

                    result = storeTM.store_local(threagile_directory, final_local_path_sanitized)
                    execution_results["local"] = result
                except Exception as e:
                    log_error("ERROR", "Failed to execute threat model locally", error_code="LOCAL_EXEC_ERROR", exception=e)
                    execution_results["local"] = {
                        "success": False,
                        "message": f"Failed to execute locally: {str(e)}",
                        "return_code": -1,
                        "error_code": "LOCAL_EXEC_ERROR",
                    }
            else:
                execution_results["local"] = {
                    "success": False,
                    "message": "Local storage is disabled via STORE_LOCAL_ENABLED environment variable",
                    "return_code": -1,
                    "error_code": "LOCAL_STORAGE_DISABLED",
                }

        if "github" in save_config.destination:
            if store_github_enabled:
                try:
                    if not config.github_pr_enabled:
                        raise ValidationException("GitHub PR workflow is disabled")

                    if not save_config.github_repo:
                        raise ValidationException("GitHub repository is required for github destination")

                    if not save_config.github_branch:
                        raise ValidationException("GitHub target branch is required for github destination")

                    access_token = _get_access_token(session_id)
                    if not access_token:
                        raise AuthenticationException("Session not found or expired")

                    safe_model_name = secure_sanitize_filepath(save_config.model_name or "threatmodel.yaml")
                    default_result_file = secure_sanitize_filepath(config.github_result_default_file)
                    if not safe_model_name:
                        safe_model_name = default_result_file.split("/")[-1] or "threatmodel.yaml"

                    with tempfile.TemporaryDirectory(prefix="threagile-exec-") as work_dir:
                        yaml_file_path = Path(work_dir) / safe_model_name
                        yaml_file_path.parent.mkdir(parents=True, exist_ok=True)

                        with open(yaml_file_path, "w") as f:
                            f.write(yaml_string)

                        exec_result = storeTM.store_local(threagile_directory, str(yaml_file_path))
                        if not exec_result.get("success", False):
                            execution_results["github"] = exec_result
                        else:
                            artifacts: list[tuple[str, bytes]] = []
                            for root, _dirs, files in os.walk(work_dir):
                                for file_name in files:
                                    full_path = Path(root) / file_name
                                    rel_path = full_path.relative_to(work_dir).as_posix()
                                    with open(full_path, "rb") as artifact_file:
                                        artifacts.append((rel_path, artifact_file.read()))

                            source_branch = api_client.generate_source_branch_name(save_config.github_branch)
                            publish_result = await api_client.publish_execution_artifacts_as_pr(
                                repo=save_config.github_repo,
                                target_branch=save_config.github_branch,
                                source_branch=source_branch,
                                repo_base_path=github_file_path_sanitized or "",
                                artifacts=artifacts,
                                overwrite_confirmed=save_config.github_overwrite_confirmed,
                                access_token=access_token,
                                model_name=safe_model_name,
                            )

                            execution_results["github"] = {
                                "success": True,
                                "message": "Threat model execution succeeded and pull request was created.",
                                "return_code": exec_result.get("return_code", 0),
                                "source_branch": publish_result["source_branch"],
                                "target_branch": publish_result["target_branch"],
                                "commit_sha": publish_result["commit_sha"],
                                "pull_request_url": publish_result["pull_request_url"],
                                "pull_request_number": publish_result["pull_request_number"],
                                "uploaded_paths": publish_result["uploaded_paths"],
                            }
                except APIException as e:
                    execution_results["github"] = {
                        "success": False,
                        "message": e.message,
                        "return_code": -1,
                        "error_code": e.error_code.value,
                        "details": e.details,
                    }
                except Exception as e:
                    log_error("ERROR", "Failed to execute threat model from GitHub", error_code="GITHUB_EXEC_ERROR", exception=e)
                    execution_results["github"] = {
                        "success": False,
                        "message": f"Failed to execute from GitHub: {str(e)}",
                        "return_code": -1,
                        "error_code": "GITHUB_EXEC_ERROR",
                    }
            else:
                execution_results["github"] = {
                    "success": False,
                    "message": "GitHub storage is disabled via STORE_GITHUB_ENABLED environment variable",
                    "return_code": -1,
                    "error_code": "GITHUB_STORAGE_DISABLED",
                }

        all_successful = all(result.get("success", False) for result in execution_results.values()) if execution_results else True

        log_error(
            "INFO",
            "Threat model execution completed",
            error_code="EXECUTION_COMPLETE",
            success=all_successful,
            destinations=list(execution_results.keys()),
        )

        return {
            "success": all_successful,
            "execution_results": execution_results,
        }
    except APIException as e:
        return e.to_response()
    except Exception as e:
        log_error("ERROR", "Unexpected error in threat model execution", error_code="EXECUTION_UNEXPECTED_ERROR", exception=e)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "An unexpected error occurred during threat model execution",
                "error_code": "EXECUTION_UNEXPECTED_ERROR",
            },
        )
