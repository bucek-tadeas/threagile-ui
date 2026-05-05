/**
 * Unit tests for the native Threagile YAML model converter.
 *
 * Tests isNativeThreagileModel detection and convertNativeThreagileToDigramFile
 * conversion from the map-based Threagile CLI format to the internal DiagramFile format.
 */

import { describe, it, expect } from 'vitest';
import {
    isNativeThreagileModel,
    convertNativeThreagileToDigramFile,
} from '../../src/features/draw/components/load-and-save/utils/threagileModelConverter';

describe('isNativeThreagileModel', () => {
    it('returns false for null/undefined', () => {
        expect(isNativeThreagileModel(null)).toBe(false);
        expect(isNativeThreagileModel(undefined)).toBe(false);
    });

    it('returns false for non-objects', () => {
        expect(isNativeThreagileModel("string")).toBe(false);
        expect(isNativeThreagileModel(42)).toBe(false);
        expect(isNativeThreagileModel([])).toBe(false);
    });

    it('returns false for DiagramFile format (arrays)', () => {
        expect(isNativeThreagileModel({
            technical_assets: [],
            common_information: { title: "Test" },
        })).toBe(false);
    });

    it('returns true when technical_assets is a map', () => {
        expect(isNativeThreagileModel({
            technical_assets: {
                "Web Server": { id: "web-server", type: "process" },
            },
        })).toBe(true);
    });

    it('returns true when title/author present without common_information', () => {
        expect(isNativeThreagileModel({
            title: "My Model",
            author: { name: "Test" },
        })).toBe(true);
    });

    it('returns false when title/author present WITH common_information', () => {
        expect(isNativeThreagileModel({
            title: "My Model",
            author: { name: "Test" },
            common_information: {},
        })).toBe(false);
    });
});

describe('convertNativeThreagileToDigramFile', () => {
    const minimalModel = {
        threagile_version: "1.0.0",
        title: "Test Model",
        date: "2024-01-01",
        author: { name: "Tester", contact: "test@test.com", homepage: "" },
    };

    it('converts minimal model without crashing', () => {
        const result = convertNativeThreagileToDigramFile(minimalModel);

        expect(result).toBeDefined();
        expect(result.common_information.title).toBe("Test Model");
        expect(result.common_information.author.name).toBe("Tester");
        expect(result.technical_assets).toEqual([]);
        expect(result.communication_links).toEqual([]);
        expect(result.trust_boundaries).toEqual([]);
        expect(result.data_assets).toEqual([]);
    });

    it('converts common information fields correctly', () => {
        const model = {
            ...minimalModel,
            management_summary_comment: "Summary",
            business_criticality: "critical",
            application_description: { description: "An app", images: ["img.png"] },
            business_overview: { description: "Business", images: [] },
            technical_overview: { description: "Technical" },
            questions: { "Q1": "A1", "Q2": "A2" },
            abuse_cases: { "Abuse 1": "Description 1" },
            security_requirements: { "Req 1": "Desc 1" },
        };

        const result = convertNativeThreagileToDigramFile(model);
        const ci = result.common_information;

        expect(ci.management_summary_comment).toBe("Summary");
        expect(ci.business_criticality).toBe("critical");
        expect(ci.application_description.description).toBe("An app");
        expect(ci.application_description.images).toEqual(["img.png"]);
        expect(ci.technical_overview.images).toEqual([]);
        expect(ci.questions).toEqual([
            { question: "Q1", answer: "A1" },
            { question: "Q2", answer: "A2" },
        ]);
        expect(ci.abuse_cases).toEqual([{ abuse_case: "Abuse 1", description: "Description 1" }]);
        expect(ci.security_requirements).toEqual([{ security_requirement: "Req 1", description: "Desc 1" }]);
    });

    it('converts data assets from map to array', () => {
        const model = {
            ...minimalModel,
            data_assets: {
                "Customer Data": {
                    id: "customer-data",
                    description: "PII data",
                    usage: "business",
                    quantity: "many",
                    confidentiality: "confidential",
                    integrity: "critical",
                    availability: "important",
                },
                "Config Files": {
                    id: "config-files",
                    description: "App config",
                },
            },
        };

        const result = convertNativeThreagileToDigramFile(model);

        expect(result.data_assets).toHaveLength(2);
        expect(result.data_assets[0].name).toBe("Customer Data");
        expect(result.data_assets[0].id).toBe("customer-data");
        expect(result.data_assets[0].description).toBe("PII data");
        expect(result.data_assets[0]._internalId).toBeDefined();
        expect(result.data_assets[1].name).toBe("Config Files");
    });

    it('converts technical assets from map to array with internal IDs', () => {
        const model = {
            ...minimalModel,
            technical_assets: {
                "Web Server": {
                    id: "web-server",
                    description: "Frontend server",
                    type: "process",
                    usage: "business",
                    technology: "web-server",
                    internet: true,
                    machine: "container",
                    tags: ["web"],
                },
            },
        };

        const result = convertNativeThreagileToDigramFile(model);

        expect(result.technical_assets).toHaveLength(1);
        const asset = result.technical_assets[0];
        expect(asset.technicalAsset.name).toBe("Web Server");
        expect(asset.technicalAsset.id).toBe("web-server");
        expect(asset.technicalAsset.internet).toBe(true);
        expect(asset.technicalAsset.technologies).toEqual(["web-server"]);
        expect(asset.internalId).toBeDefined();
        expect(asset.parentId).toBe("");
    });

    it('converts communication links from nested maps', () => {
        const model = {
            ...minimalModel,
            technical_assets: {
                "Web Server": {
                    id: "web-server",
                    communication_links: {
                        "API Call": {
                            target: "api-server",
                            protocol: "https",
                            authentication: "token",
                            description: "REST calls",
                        },
                    },
                },
                "API Server": {
                    id: "api-server",
                },
            },
        };

        const result = convertNativeThreagileToDigramFile(model);

        expect(result.communication_links).toHaveLength(1);
        const link = result.communication_links[0];
        expect(link.communicationLink.name).toBe("API Call");
        expect(link.communicationLink.protocol).toBe("https");
        expect(link.communicationLink.description).toBe("REST calls");
        expect(link.sourceID).toBeDefined();
        expect(link.targetID).toBeDefined();
        expect(link.sourceID).not.toBe(link.targetID);
    });

    it('detects bidirectional links', () => {
        const model = {
            ...minimalModel,
            technical_assets: {
                "Server A": {
                    id: "server-a",
                    communication_links: {
                        "Sync": { target: "server-b", protocol: "tcp" },
                    },
                },
                "Server B": {
                    id: "server-b",
                    communication_links: {
                        "Sync": { target: "server-a", protocol: "tcp" },
                    },
                },
            },
        };

        const result = convertNativeThreagileToDigramFile(model);

        expect(result.communication_links).toHaveLength(1);
        expect(result.communication_links[0].communicationLink.bidirectional).toBe(true);
    });

    it('converts trust boundaries and assigns assets', () => {
        const model = {
            ...minimalModel,
            technical_assets: {
                "Web App": { id: "web-app" },
                "Database": { id: "database" },
            },
            trust_boundaries: {
                "DMZ": {
                    id: "dmz",
                    description: "Demilitarized zone",
                    type: "network-cloud-provider",
                    technical_assets_inside: ["web-app"],
                },
                "Internal": {
                    id: "internal",
                    description: "Internal network",
                    type: "network-on-prem",
                    technical_assets_inside: ["database"],
                },
            },
        };

        const result = convertNativeThreagileToDigramFile(model);

        expect(result.trust_boundaries).toHaveLength(2);
        const dmz = result.trust_boundaries.find(tb => tb.trustBoundary.name === "DMZ")!;
        expect(dmz.trustBoundary.id).toBe("dmz");
        expect(dmz.trustBoundary.type).toBe("network-cloud-provider");

        // Web App should have DMZ as parent
        const webApp = result.technical_assets.find(ta => ta.technicalAsset.id === "web-app")!;
        expect(webApp.parentId).toBe(dmz.internalId);

        // Database should have Internal as parent
        const internal = result.trust_boundaries.find(tb => tb.trustBoundary.name === "Internal")!;
        const db = result.technical_assets.find(ta => ta.technicalAsset.id === "database")!;
        expect(db.parentId).toBe(internal.internalId);
    });

    it('handles nested trust boundaries', () => {
        const model = {
            ...minimalModel,
            technical_assets: {
                "App": { id: "app" },
            },
            trust_boundaries: {
                "Outer": {
                    id: "outer",
                    type: "network-on-prem",
                    trust_boundaries_nested: ["inner"],
                },
                "Inner": {
                    id: "inner",
                    type: "execution-environment",
                    technical_assets_inside: ["app"],
                },
            },
        };

        const result = convertNativeThreagileToDigramFile(model);

        const outer = result.trust_boundaries.find(tb => tb.trustBoundary.id === "outer")!;
        const inner = result.trust_boundaries.find(tb => tb.trustBoundary.id === "inner")!;
        expect(inner.parentId).toBe(outer.internalId);
        expect(outer.parentId).toBe("");
    });

    it('converts shared runtimes with technical asset references', () => {
        const model = {
            ...minimalModel,
            technical_assets: {
                "Service A": { id: "service-a", name: "Service A" },
                "Service B": { id: "service-b", name: "Service B" },
            },
            shared_runtimes: {
                "K8s Cluster": {
                    id: "k8s-cluster",
                    description: "Kubernetes",
                    technical_assets_running: ["service-a", "service-b"],
                },
            },
        };

        const result = convertNativeThreagileToDigramFile(model);

        expect(result.shared_runtimes).toHaveLength(1);
        expect(result.shared_runtimes[0].name).toBe("K8s Cluster");
        expect(result.shared_runtimes[0].technical_assets_running).toHaveLength(2);
    });

    it('converts risk tracking from map', () => {
        const model = {
            ...minimalModel,
            risk_tracking: {
                "sql-injection": {
                    status: "mitigated",
                    justification: "Input validated",
                    ticket: "SEC-123",
                    date: "2024-06-01",
                    checked_by: "security-team",
                },
            },
        };

        const result = convertNativeThreagileToDigramFile(model);

        expect(result.risk_tracking).toHaveLength(1);
        expect(result.risk_tracking[0].name).toBe("sql-injection");
        expect(result.risk_tracking[0].status).toBe("mitigated");
        expect(result.risk_tracking[0].ticket).toBe("SEC-123");
    });

    it('converts common diagram fields', () => {
        const model = {
            ...minimalModel,
            diagram_tweak_nodesep: 80,
            diagram_tweak_ranksep: 100,
            diagram_tweak_layout_left_to_right: true,
        };

        const result = convertNativeThreagileToDigramFile(model);

        expect(result.common_diagram.diagram_tweak_nodesep).toBe(80);
        expect(result.common_diagram.diagram_tweak_ranksep).toBe(100);
        expect(result.common_diagram.diagram_tweak_layout_left_to_right).toBe(true);
    });

    it('resolves data asset references in technical assets', () => {
        const model = {
            ...minimalModel,
            data_assets: {
                "User Data": { id: "user-data", description: "PII" },
            },
            technical_assets: {
                "App": {
                    id: "app",
                    data_assets_processed: ["user-data"],
                    data_assets_stored: ["user-data"],
                },
            },
        };

        const result = convertNativeThreagileToDigramFile(model);

        const app = result.technical_assets[0].technicalAsset;
        expect(app.data_assets_processed).toHaveLength(1);
        expect(app.data_assets_processed![0].id).toBe("user-data");
        expect(app.data_assets_stored).toHaveLength(1);
    });

    it('returns empty arrays for missing data asset references', () => {
        const model = {
            ...minimalModel,
            technical_assets: {
                "App": {
                    id: "app",
                    data_assets_processed: ["nonexistent"],
                },
            },
        };

        const result = convertNativeThreagileToDigramFile(model);

        const app = result.technical_assets[0].technicalAsset;
        expect(app.data_assets_processed).toEqual([]);
    });

    it('handles null/missing sections gracefully', () => {
        const result = convertNativeThreagileToDigramFile({});

        expect(result.technical_assets).toEqual([]);
        expect(result.communication_links).toEqual([]);
        expect(result.trust_boundaries).toEqual([]);
        expect(result.data_assets).toEqual([]);
        expect(result.shared_runtimes).toEqual([]);
        expect(result.risk_tracking).toEqual([]);
        expect(result.individual_risk_categories).toEqual([]);
        expect(result.risks_identified).toEqual([]);
        expect(result.common_information.title).toBe("");
    });

    it('generates unique internal IDs across calls', () => {
        const model = {
            ...minimalModel,
            technical_assets: {
                "A": { id: "a" },
                "B": { id: "b" },
            },
        };

        const result = convertNativeThreagileToDigramFile(model);
        const ids = result.technical_assets.map(ta => ta.internalId);
        expect(new Set(ids).size).toBe(ids.length);
    });
});
