"""
GitHub API client for OAuth authentication, repository browsing, and pull request workflows.

Handles the full GitHub integration lifecycle:
  - OAuth token exchange and user info retrieval
  - Repository listing, branch listing, and recursive directory walking
  - Branch creation, file upload (create/update), and pull request creation
  - Orchestration of the full "execute and publish artifacts as PR" workflow

All HTTP interactions use httpx with timeouts and raise typed exceptions
(GitHubException, AuthenticationException, ValidationException) on failure.
"""

import os
import base64
import posixpath
import re
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv
import httpx
from app.errors import GitHubException, AuthenticationException, ValidationException, log_error
from app.config import get_config

load_dotenv()


class APIClient:
    def __init__(self):
        config = get_config()

        self.client_id = config.github_client_id
        self.client_secret = config.github_client_secret
        self.redirect_uri = config.github_redirect_uri
        self.org_uri = config.github_org_uri
        self.github_pr_branch_prefix = config.github_pr_branch_prefix
        self.github_pr_title_template = config.github_pr_title_template
        self.github_pr_body_template = config.github_pr_body_template
        self.api_base = os.getenv("GITHUB_API_BASE", "https://api.github.com").rstrip("/")
        self.app_work = os.getenv("APP_WORK")

    @staticmethod
    def _auth_headers(access_token: str) -> dict:
        return {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

    @staticmethod
    def _normalize_repo_path(path: str) -> str:
        if not path:
            return ""
        normalized = posixpath.normpath(path).replace("\\", "/")
        if normalized in (".", "/"):
            return ""
        return normalized.strip("/")

    def generate_source_branch_name(self, target_branch: str) -> str:
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
        suffix = uuid.uuid4().hex[:8]
        sanitized_target = re.sub(r"[^a-zA-Z0-9._-]", "-", target_branch.strip()) or "target"
        prefix = self.github_pr_branch_prefix.strip("/") or "threat-model-pr"
        return f"{prefix}/{sanitized_target}/{timestamp}-{suffix}"

    def get_github_auth_url(self) -> str:
        scope = "repo read:org read:user"
        return (
            f"https://github.com/login/oauth/authorize?"
            f"client_id={self.client_id}&redirect_uri={self.redirect_uri}&scope={scope}"
        )

    async def exchange_code_for_token(self, code: str) -> str:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://github.com/login/oauth/access_token",
                    data={
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "code": code,
                        "redirect_uri": self.redirect_uri,
                    },
                    headers={"Accept": "application/json"},
                    timeout=10.0,
                )
                response.raise_for_status()
                token_data = response.json()
                access_token = token_data.get("access_token", "")

                if not access_token:
                    error_msg = token_data.get("error_description", "Unknown error")
                    log_error(
                        "WARNING",
                        f"Failed to get access token from GitHub: {error_msg}",
                        error_code="GITHUB_TOKEN_FAILED",
                    )
                    raise GitHubException(
                        f"Failed to obtain access token: {error_msg}",
                        details={"github_error": token_data.get("error")}
                    )

                return access_token
        except httpx.HTTPError as e:
            log_error("ERROR", "GitHub OAuth token exchange failed", error_code="GITHUB_API_ERROR", exception=e)
            raise GitHubException(
                f"GitHub authentication failed: {str(e)}",
                details={"http_error": str(e)}
            )

    async def get_user_info(self, access_token: str) -> dict:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.github.com/user",
                    headers={"Authorization": f"Bearer {access_token}"},
                    timeout=10.0,
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                log_error("WARNING", "Invalid GitHub token", error_code="AUTH_INVALID_TOKEN")
                raise AuthenticationException(
                    "Invalid or expired GitHub token",
                    details={"status_code": e.response.status_code}
                )
            log_error(
                "ERROR", "Failed to fetch user info from GitHub",
                error_code="GITHUB_USER_INFO_ERROR", exception=e,
            )
            raise GitHubException(
                f"Failed to fetch user information: {str(e)}",
                details={"status_code": e.response.status_code}
            )
        except httpx.HTTPError as e:
            log_error("ERROR", "GitHub API error when fetching user info", error_code="GITHUB_API_ERROR", exception=e)
            raise GitHubException(
                f"GitHub API error: {str(e)}",
                details={"http_error": str(e)}
            )

    async def get_github_repos(self, access_token: str) -> list:
        try:
            repos = []
            async with httpx.AsyncClient() as client:
                page = 1
                while True:
                    response = await client.get(
                        f"{self.api_base}/user/repos",
                        headers=self._auth_headers(access_token),
                        params={
                            "affiliation": "owner,collaborator,organization_member",
                            "per_page": 100,
                            "page": page,
                        },
                        timeout=10.0,
                    )
                    response.raise_for_status()
                    chunk = response.json()
                    if not chunk:
                        break
                    repos.extend(chunk)
                    if len(chunk) < 100:
                        break
                    page += 1

            result = [f"{repo['owner']['login']}/{repo['name']}" for repo in repos]
            log_error("INFO", f"Successfully fetched {len(result)} repositories from GitHub")
            return result
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                log_error("WARNING", "Invalid GitHub token when fetching repos", error_code="AUTH_INVALID_TOKEN")
                raise AuthenticationException(
                    "Invalid or expired GitHub token",
                    details={"status_code": e.response.status_code}
                )
            log_error("ERROR", "Failed to fetch repositories from GitHub", error_code="GITHUB_REPOS_ERROR", exception=e)
            raise GitHubException(
                f"Failed to fetch repositories: {str(e)}",
                details={"status_code": e.response.status_code}
            )
        except httpx.HTTPError as e:
            log_error("ERROR", "GitHub API error when fetching repos", error_code="GITHUB_API_ERROR", exception=e)
            raise GitHubException(
                f"GitHub API error: {str(e)}",
                details={"http_error": str(e)}
            )

    async def get_github_branches(self, repo: str, access_token: str) -> list:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_base}/repos/{repo}/branches",
                    headers=self._auth_headers(access_token),
                    timeout=10.0,
                )
                response.raise_for_status()
                branches = response.json()
                result = [branch["name"] for branch in branches]
                log_error("INFO", f"Successfully fetched {len(result)} branches for repo {repo}")
                return result
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                log_error("WARNING", "Invalid GitHub token when fetching branches", error_code="AUTH_INVALID_TOKEN")
                raise AuthenticationException(
                    "Invalid or expired GitHub token",
                    details={"status_code": e.response.status_code}
                )
            elif e.response.status_code == 404:
                log_error("WARNING", f"Repository not found: {repo}", error_code="GITHUB_REPO_NOT_FOUND")
                raise GitHubException(
                    f"Repository not found: {repo}",
                    details={"status_code": 404, "repo": repo}
                )
            log_error(
                "ERROR", f"Failed to fetch branches for repo {repo}",
                error_code="GITHUB_BRANCHES_ERROR", exception=e,
            )
            raise GitHubException(
                f"Failed to fetch branches: {str(e)}",
                details={"status_code": e.response.status_code, "repo": repo}
            )
        except httpx.HTTPError as e:
            log_error("ERROR", "GitHub API error when fetching branches", error_code="GITHUB_API_ERROR", exception=e)
            raise GitHubException(
                f"GitHub API error: {str(e)}",
                details={"http_error": str(e), "repo": repo}
            )

    async def walk_github_directory(self, repo: str, branch: str, access_token: str, path: str, paths):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_base}/repos/{repo}/contents/{path}?ref={branch}",
                    headers=self._auth_headers(access_token),
                    timeout=10.0,
                )
                response.raise_for_status()
                items = response.json()
                if isinstance(items, dict):
                    return
                for item in items:
                    if item["type"] == "dir":
                        full_path = item["path"]
                        paths.append(full_path)
                        await self.walk_github_directory(repo, branch, access_token, full_path, paths)
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                log_error("WARNING", "Invalid GitHub token when walking directory", error_code="AUTH_INVALID_TOKEN")
                raise AuthenticationException(
                    "Invalid or expired GitHub token",
                    details={"status_code": e.response.status_code, "path": path}
                )
            elif e.response.status_code == 404:
                log_error("WARNING", f"Path not found in repository: {path}", error_code="GITHUB_PATH_NOT_FOUND")
                raise GitHubException(
                    f"Path not found in repository: {path}",
                    details={"status_code": 404, "repo": repo, "path": path}
                )
            log_error(
                "ERROR", f"Failed to walk directory {path} in repo {repo}",
                error_code="GITHUB_WALK_DIR_ERROR", exception=e,
            )
            raise GitHubException(
                f"Failed to fetch directory contents: {str(e)}",
                details={"status_code": e.response.status_code, "path": path}
            )
        except httpx.HTTPError as e:
            log_error("ERROR", "GitHub API error when walking directory", error_code="GITHUB_API_ERROR", exception=e)
            raise GitHubException(
                f"GitHub API error: {str(e)}",
                details={"http_error": str(e), "path": path}
            )

    async def get_branch_sha(self, repo: str, branch: str, access_token: str) -> str:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_base}/repos/{repo}/git/ref/heads/{branch}",
                    headers=self._auth_headers(access_token),
                    timeout=10.0,
                )
                response.raise_for_status()
                return response.json()["object"]["sha"]
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise ValidationException(
                    f"Target branch not found: {branch}",
                    details={"repo": repo, "branch": branch},
                )
            if e.response.status_code == 401:
                raise AuthenticationException("Invalid or expired GitHub token")
            raise GitHubException(
                f"Failed to resolve target branch: {branch}",
                details={"repo": repo, "status_code": e.response.status_code},
            )

    async def create_branch_from_base(self, repo: str, source_branch: str, base_sha: str, access_token: str) -> None:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_base}/repos/{repo}/git/refs",
                    headers=self._auth_headers(access_token),
                    json={
                        "ref": f"refs/heads/{source_branch}",
                        "sha": base_sha,
                    },
                    timeout=10.0,
                )
                response.raise_for_status()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 422:
                raise GitHubException(
                    "Branch already exists or could not be created",
                    details={"repo": repo, "source_branch": source_branch},
                )
            if e.response.status_code == 401:
                raise AuthenticationException("Invalid or expired GitHub token")
            raise GitHubException(
                "Failed to create branch on GitHub",
                details={"repo": repo, "source_branch": source_branch, "status_code": e.response.status_code},
            )

    async def get_file_sha_on_branch(self, repo: str, branch: str, file_path: str, access_token: str) -> str | None:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_base}/repos/{repo}/contents/{file_path}",
                    headers=self._auth_headers(access_token),
                    params={"ref": branch},
                    timeout=10.0,
                )
                response.raise_for_status()
                return response.json().get("sha")
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return None
            if e.response.status_code == 401:
                raise AuthenticationException("Invalid or expired GitHub token")
            raise GitHubException(
                "Failed to inspect existing file on branch",
                details={"repo": repo, "branch": branch, "path": file_path, "status_code": e.response.status_code},
            )

    async def upsert_file_on_branch(
        self,
        repo: str,
        branch: str,
        file_path: str,
        content: bytes,
        commit_message: str,
        access_token: str,
        overwrite_confirmed: bool,
    ) -> str:
        existing_sha = await self.get_file_sha_on_branch(repo, branch, file_path, access_token)
        if existing_sha and not overwrite_confirmed:
            raise ValidationException(
                "Target file already exists. Confirm overwrite to continue.",
                details={"path": file_path},
            )

        payload = {
            "message": commit_message,
            "content": base64.b64encode(content).decode("ascii"),
            "branch": branch,
        }
        if existing_sha:
            payload["sha"] = existing_sha

        try:
            async with httpx.AsyncClient() as client:
                response = await client.put(
                    f"{self.api_base}/repos/{repo}/contents/{file_path}",
                    headers=self._auth_headers(access_token),
                    json=payload,
                    timeout=15.0,
                )
                response.raise_for_status()
                return response.json().get("commit", {}).get("sha", "")
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                raise AuthenticationException("Invalid or expired GitHub token")
            raise GitHubException(
                "Failed to commit file to GitHub",
                details={"repo": repo, "branch": branch, "path": file_path, "status_code": e.response.status_code},
            )

    async def create_pull_request(
        self,
        repo: str,
        source_branch: str,
        target_branch: str,
        access_token: str,
        model_name: str,
        pr_title: str | None = None,
        pr_body: str | None = None,
    ) -> dict:
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        title = pr_title or self.github_pr_title_template.format(
            model_name=model_name,
            timestamp=timestamp,
            target_branch=target_branch,
        )
        body = pr_body or self.github_pr_body_template.format(
            model_name=model_name,
            timestamp=timestamp,
            target_branch=target_branch,
        )

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_base}/repos/{repo}/pulls",
                    headers=self._auth_headers(access_token),
                    json={
                        "title": title,
                        "head": source_branch,
                        "base": target_branch,
                        "body": body,
                    },
                    timeout=15.0,
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                raise AuthenticationException("Invalid or expired GitHub token")
            raise GitHubException(
                "Failed to create pull request on GitHub",
                details={
                    "repo": repo, "head": source_branch,
                    "base": target_branch, "status_code": e.response.status_code,
                },
            )

    async def publish_execution_artifacts_as_pr(
        self,
        repo: str,
        target_branch: str,
        source_branch: str,
        repo_base_path: str,
        artifacts: list[tuple[str, bytes]],
        overwrite_confirmed: bool,
        access_token: str,
        model_name: str,
    ) -> dict:
        base_sha = await self.get_branch_sha(repo, target_branch, access_token)
        await self.create_branch_from_base(repo, source_branch, base_sha, access_token)

        normalized_base = self._normalize_repo_path(repo_base_path)
        commit_sha = ""
        uploaded_paths = []

        for relative_path, content in artifacts:
            normalized_relative = self._normalize_repo_path(relative_path)
            remote_path = (
                posixpath.join(normalized_base, normalized_relative)
                if normalized_base else normalized_relative
            )
            remote_path = self._normalize_repo_path(remote_path)
            if not remote_path:
                continue

            file_commit_sha = await self.upsert_file_on_branch(
                repo=repo,
                branch=source_branch,
                file_path=remote_path,
                content=content,
                commit_message=f"Update threat model artifact: {normalized_relative}",
                access_token=access_token,
                overwrite_confirmed=overwrite_confirmed,
            )
            if file_commit_sha:
                commit_sha = file_commit_sha
            uploaded_paths.append(remote_path)

        if not uploaded_paths:
            raise ValidationException("No artifacts found to publish to GitHub")

        pr_data = await self.create_pull_request(
            repo=repo,
            source_branch=source_branch,
            target_branch=target_branch,
            access_token=access_token,
            model_name=model_name,
        )

        return {
            "source_branch": source_branch,
            "target_branch": target_branch,
            "commit_sha": commit_sha,
            "pull_request_url": pr_data.get("html_url"),
            "pull_request_number": pr_data.get("number"),
            "uploaded_paths": uploaded_paths,
        }
