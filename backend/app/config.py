"""
Configuration validation and loading for environment variables.

Validates required environment variables based on USING_LOCAL_STORAGE and USING_GITHUB flags.
"""

import os
from dotenv import load_dotenv
from app.errors import ConfigurationException, log_error

load_dotenv()


class Config:    
    def __init__(self):
        self.using_local_storage = os.getenv("USING_LOCAL_STORAGE", "true").lower() == "true"
        self.using_github = os.getenv("USING_GITHUB", "true").lower() == "true"
        
        self.session_ttl_seconds = int(os.getenv("SESSION_TTL_SECONDS", "43200"))
        self.cookie_secure = os.getenv("COOKIE_SECURE", "false").lower() == "true"
        self.cookie_samesite = os.getenv("COOKIE_SAMESITE", "lax").lower()
        if self.cookie_samesite not in ("lax", "strict", "none"):
            self.cookie_samesite = "lax"
        
        self.threagile_directory = os.getenv("THREAGILE_DIRECTORY")
        
        self.store_local_enabled = os.getenv("STORE_LOCAL_ENABLED", "true").lower() == "true"
        self.store_github_enabled = os.getenv("STORE_GITHUB_ENABLED", "true").lower() == "true"

        self.github_pr_enabled = os.getenv("GITHUB_PR_ENABLED", "true").lower() == "true"
        self.github_pr_branch_prefix = os.getenv("GITHUB_PR_BRANCH_PREFIX", "threat-model-pr")
        self.github_pr_title_template = os.getenv(
            "GITHUB_PR_TITLE_TEMPLATE",
            "Threat model update: {model_name} ({timestamp})",
        )
        self.github_pr_body_template = os.getenv(
            "GITHUB_PR_BODY_TEMPLATE",
            "Automated threat model execution artifacts for {model_name}.\n\nGenerated at {timestamp} UTC.",
        )
        self.github_result_default_file = os.getenv("GITHUB_RESULT_DEFAULT_FILE", ".threatmodel/threatmodel.yaml")
        
        if self.using_github:
            self.github_client_id = os.getenv("GITHUB_CLIENT_ID")
            self.github_client_secret = os.getenv("GITHUB_CLIENT_SECRET")
            self.github_redirect_uri = os.getenv("GITHUB_REDIRECT_URI")
            self.github_org_uri = os.getenv("GITHUB_ORG_URI")
        else:
            self.github_client_id = None
            self.github_client_secret = None
            self.github_redirect_uri = None
            self.github_org_uri = None
        
        if self.using_local_storage:
            self.allowed_paths = os.getenv("ALLOWED_PATHS")
        else:
            self.allowed_paths = None
        
        self._validate()
    
    def _validate(self):
        missing_vars = []
        
        if not self.threagile_directory:
            missing_vars.append("THREAGILE_DIRECTORY")
        
        if self.using_github:
            github_vars = {
                "GITHUB_CLIENT_ID": self.github_client_id,
                "GITHUB_CLIENT_SECRET": self.github_client_secret,
                "GITHUB_REDIRECT_URI": self.github_redirect_uri,
                "GITHUB_ORG_URI": self.github_org_uri,
            }
            for var_name, var_value in github_vars.items():
                if not var_value:
                    missing_vars.append(var_name)
        
        if self.using_local_storage:
            if not self.allowed_paths:
                missing_vars.append("ALLOWED_PATHS")
        
        if missing_vars:
            log_error("ERROR", "Missing required environment variables", missing_vars=missing_vars)
            raise ConfigurationException(
                f"Missing required configuration: {', '.join(missing_vars)}",
                details={"missing_variables": missing_vars}
            )
    
    def get_available_methods(self) -> list[str]:
        methods = ["local"]
        
        if self.using_local_storage and self.store_local_enabled:
            methods.append("server")
        
        if self.using_github and self.store_github_enabled:
            methods.append("github")
        
        return methods


_config = None


def get_config() -> Config:
    global _config
    if _config is None:
        _config = Config()
    return _config
