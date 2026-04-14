/*

API client for communication with backend

*/

import type { IApiClient } from "./api";

export class APIClient implements IApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = "http://localhost:8000") {
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, fetchMethod = "GET", options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: fetchMethod,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      body: options.body ?? null,
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        throw JSON.parse(errorText);
      } catch {
        throw new Error(`API error (${response.status}): ${errorText}`);
      }
    }

    return response.json() as Promise<T>;
  }

  async getGithubAuthUrl(): Promise<{ url: string }> {
    return this.request("/auth/github-url");
  }

  async getCurrentUser(): Promise<{ login: string }> {
    return this.request("/me");
  }

  async getExecutionMethods(): Promise<{ methods: string[] }> {
    return this.request("/execution-methods");
  }

  async getLocalPaths(): Promise<{ paths: string[] }> {
    return this.request("/local-paths");
  }

  async getGithubRepos(): Promise<{ repos: string[] }> {
    return this.request("/github-repos");
  }

  async getGithubBranches(repo: string): Promise<{ branches: string[] }> {
    if (!repo) throw new Error("repo is required");
    return this.request<{ branches: string[] }>(`/github-branches?repo=${encodeURIComponent(repo)}`);
  }

  async getGithubFiles(repo: string, branch: string): Promise<{ files: string[] }> {
    if (!repo) throw new Error("repo is required");
    if (!branch) throw new Error("branch is required");
    const response = await this.request<{ files?: string[]; paths?: string[] }>(`/github-files?repo=${encodeURIComponent(repo)}&branch=${encodeURIComponent(branch)}`);
    return { files: response.files ?? response.paths ?? [] };
  }

  async executeThreatModel(saveConfig: any): Promise<any> {
    if (!saveConfig) throw new Error("saveConfig is required");
    return this.request<any>("/execute-threat-model", "POST", { body: JSON.stringify(saveConfig) });
  }

}