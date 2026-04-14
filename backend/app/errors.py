

import logging
from enum import Enum
from typing import Optional
from fastapi.responses import JSONResponse

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


class ErrorCode(str, Enum):
    VALIDATION_ERROR = "VALIDATION_ERROR"
    FILE_NOT_FOUND = "FILE_NOT_FOUND"
    FILE_WRITE_ERROR = "FILE_WRITE_ERROR"
    GITHUB_API_ERROR = "GITHUB_API_ERROR"
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR"
    MISSING_CONFIG = "MISSING_CONFIG"
    ENVIRONMENT_ERROR = "ENVIRONMENT_ERROR"
    DOCKER_ERROR = "DOCKER_ERROR"
    GENERAL_ERROR = "GENERAL_ERROR"


class APIException(Exception):

    def __init__(
        self,
        message: str,
        error_code: ErrorCode = ErrorCode.GENERAL_ERROR,
        status_code: int = 500,
        details: Optional[dict] = None,
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)

    def to_response(self) -> JSONResponse:
        return JSONResponse(
            status_code=self.status_code,
            content={
                "success": False,
                "error": self.message,
                "error_code": self.error_code,
                "details": self.details,
            },
        )


class ValidationException(APIException):
    def __init__(self, message: str, details: Optional[dict] = None):
        super().__init__(
            message=message,
            error_code=ErrorCode.VALIDATION_ERROR,
            status_code=400,
            details=details,
        )


class FileException(APIException):
    def __init__(
        self,
        message: str,
        error_code: ErrorCode = ErrorCode.FILE_WRITE_ERROR,
        details: Optional[dict] = None,
    ):
        super().__init__(
            message=message,
            error_code=error_code,
            status_code=500,
            details=details,
        )


class GitHubException(APIException):
    def __init__(self, message: str, details: Optional[dict] = None):
        super().__init__(
            message=message,
            error_code=ErrorCode.GITHUB_API_ERROR,
            status_code=500,
            details=details,
        )


class AuthenticationException(APIException):
    def __init__(self, message: str, details: Optional[dict] = None):
        super().__init__(
            message=message,
            error_code=ErrorCode.AUTHENTICATION_ERROR,
            status_code=401,
            details=details,
        )


class ConfigurationException(APIException):
    def __init__(self, message: str, details: Optional[dict] = None):
        super().__init__(
            message=message,
            error_code=ErrorCode.MISSING_CONFIG,
            status_code=500,
            details=details,
        )


class DockerException(APIException):
    def __init__(self, message: str, details: Optional[dict] = None):
        super().__init__(
            message=message,
            error_code=ErrorCode.DOCKER_ERROR,
            status_code=500,
            details=details,
        )


def log_error(
    level: str,
    message: str,
    error_code: Optional[str] = None,
    exception: Optional[Exception] = None,
    **context
) -> None:
    log_func = getattr(logger, level.lower(), logger.error)
    
    context_str = " | ".join(f"{k}={v}" for k, v in context.items())
    error_code_str = f"[{error_code}] " if error_code else ""
    
    if exception:
        log_func(f"{error_code_str}{message} | {str(exception)} | {context_str}")
    else:
        log_func(f"{error_code_str}{message} | {context_str}")
