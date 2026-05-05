/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Unit tests for API client.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { APIClient } from '../../src/api/apiClient';

describe('APIClient', () => {
    let client: APIClient;

    beforeEach(() => {
        client = new APIClient('http://localhost:8000');
        global.fetch = vi.fn();
    });

    describe('getExecutionMethods', () => {
        it('fetches execution methods from API', async () => {
            const mockResponse = { methods: ['local', 'server'] };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            const result = await client.getExecutionMethods();

            expect(result).toEqual(mockResponse);
            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:8000/execution-methods',
                expect.objectContaining({
                    method: 'GET',
                })
            );
        });

        it('throws error on failed request', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: async () => 'Server error',
            });

            await expect(client.getExecutionMethods()).rejects.toThrow();
        });
    });

    describe('getLocalPaths', () => {
        it('fetches local paths from API', async () => {
            const mockResponse = { paths: ['/path1', '/path2'] };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            const result = await client.getLocalPaths();

            expect(result).toEqual(mockResponse);
            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:8000/local-paths',
                expect.any(Object)
            );
        });
    });

    describe('executeThreatModel', () => {
        it('sends threat model to API for execution', async () => {
            const mockConfig = {
                destination: ['server'],
                yaml_model: 'test: value',
                model_name: 'test.yaml',
                final_local_path: '/tmp/test.yaml',
            };

            const mockResponse = { success: true, execution_results: {} };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            const result = await client.executeThreatModel(mockConfig);

            expect(result).toEqual(mockResponse);
            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:8000/execute-threat-model',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(mockConfig),
                })
            );
        });

        it('throws error when saveConfig is missing', async () => {
            await expect(client.executeThreatModel(null as any)).rejects.toThrow();
        });
    });

    describe('getCurrentUser', () => {
        it('fetches current user info', async () => {
            const mockResponse = { login: 'testuser' };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            const result = await client.getCurrentUser();

            expect(result).toEqual(mockResponse);
        });
    });

    describe('getGithubFiles', () => {
        it('normalizes backend paths response to files', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ paths: ['models/threatmodel.yaml'] }),
            });

            const result = await client.getGithubFiles('org/repo', 'main');

            expect(result).toEqual({ files: ['models/threatmodel.yaml'] });
            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:8000/github-files?repo=org%2Frepo&branch=main',
                expect.any(Object)
            );
        });
    });

    describe('request with credentials', () => {
        it('includes credentials in all requests', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({}),
            });

            await client.getExecutionMethods();

            expect(global.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    credentials: 'include',
                })
            );
        });
    });
});
