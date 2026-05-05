/* eslint-disable @typescript-eslint/no-explicit-any */
/*

Interface for api client implementation with the following methods:

- getGithubAuthUrl
    gets github authentiacation url to which the user is then redirected to authenticate against github

- getCurrentUser
    used to check with backend for authentication status

- getLocalPaths
    used for backend paths - based on this info the user can choose where to store the yaml model and the results

- getGithubRepos
    get list of all github repos (based on user's read scope in github) 

- getGithubBranches
    get all the branches of a specific selected repository

- getGithubFiles
    get github file paths based on the selected branch and repository

- getExecutionMethods
    gets the list of available execution/storage methods based on backend configuration

- executeThreatModel
    posts the threat model to backend and the threat model is executed and the results saved

*/

interface ExecutionResult {
    success: boolean;
    message: string;
    return_code: number;
    error_code?: string;
    details?: Record<string, any>;
    source_branch?: string;
    target_branch?: string;
    commit_sha?: string;
    pull_request_url?: string;
    pull_request_number?: number;
    uploaded_paths?: string[];
}

interface ExecuteThreatModelResponse {
    success: boolean;
    execution_results: {
        local?: ExecutionResult;
        github?: ExecutionResult;
    };
    error?: string;
}

export interface IApiClient {
    getGithubAuthUrl(): Promise<{ url: string }>;
    getCurrentUser(): Promise<{ login: string }>;
    getExecutionMethods(): Promise<{ methods: string[] }>;
    getLocalPaths(): Promise<{ paths: string[] }>;
    getGithubRepos(): Promise<{ repos: string[] }>;
    getGithubBranches(repo: string): Promise<{ branches: string[] }>;
    getGithubFiles(repo: string, branch: string): Promise<{ files: string[] }>;
    executeThreatModel(saveConfig: any): Promise<ExecuteThreatModelResponse>;
}