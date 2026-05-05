/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * API error handling utilities
 */

export interface ApiError {
    success: false;
    error: string;
    error_code?: string;
    details?: Record<string, any>;
}

export interface ApiSuccess<T> {
    success: true;
    data?: T;
}

export class ApiErrorHandler {
    static isError(response: any): response is ApiError {
        return response && response.success === false;
    }

    static formatErrorMessage(error: ApiError): string {
        let message = error.error || "An unexpected error occurred";

        if (error.error_code) {
            message = `[${error.error_code}] ${message}`;
        }

        if (error.details) {
            const detailsString = Object.entries(error.details)
                .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
                .join("\n");
            if (detailsString) {
                message += `\n\nDetails:\n${detailsString}`;
            }
        }

        return message;
    }

    static getErrorCode(error: ApiError): string {
        return error.error_code || "UNKNOWN_ERROR";
    }

    static isAuthenticationError(error: ApiError): boolean {
        const code = this.getErrorCode(error);
        return (
            code === "AUTHENTICATION_ERROR" ||
            code === "AUTH_INVALID_TOKEN" ||
            code === "SESSION_EXPIRED"
        );
    }

    static isValidationError(error: ApiError): boolean {
        const code = this.getErrorCode(error);
        return (
            code === "VALIDATION_ERROR" ||
            code === "YAML_PARSE_ERROR" ||
            code === "SCHEMA_PARSE_ERROR"
        );
    }

    static isGitHubError(error: ApiError): boolean {
        const code = this.getErrorCode(error);
        return code.startsWith("GITHUB_");
    }
}

export const ERROR_MESSAGES: Record<string, string> = {
    VALIDATION_ERROR: "Input validation failed",
    FILE_NOT_FOUND: "File not found",
    FILE_WRITE_ERROR: "Failed to write file",
    GITHUB_API_ERROR: "GitHub API error occurred",
    AUTHENTICATION_ERROR: "Authentication failed",
    MISSING_CONFIG: "Missing configuration",
    ENVIRONMENT_ERROR: "Environment configuration error",
    DOCKER_ERROR: "Docker execution failed",
    GENERAL_ERROR: "An unexpected error occurred",
    YAML_PARSE_ERROR: "Failed to parse YAML",
    SCHEMA_PARSE_ERROR: "Failed to parse schema",
    DOCKER_EXECUTION_FAILED: "Threat model execution failed",
    DOCKER_TIMEOUT: "Execution timed out",
    DOCKER_NOT_FOUND: "Docker is not installed",
    LOCAL_STORAGE_DISABLED: "Local storage is disabled",
    GITHUB_STORAGE_DISABLED: "GitHub storage is disabled",
};
