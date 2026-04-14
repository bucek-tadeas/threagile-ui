/**
 * Unit tests for validation logic.
 * 
 * Tests the strict validation that runs before execution.
 */

import { describe, it, expect } from 'vitest';
import { validateStrictDiagramModel } from '../../src/features/draw/components/execute/strictValidation';
import type { StrictModel } from '../../src/features/draw/components/execute/strictValidation';

describe('validateStrictDiagramModel', () => {
    const createValidModel = (): StrictModel => ({
        graph: {
            getModel: () => ({
                cells: new Map(),
            }),
            getDefaultParent: () => ({}),
            getChildCells: () => [],
        } as any,
        commonInformation: {
            threagile_version: '1.0.0',
            title: 'Test Model',
            author: { name: 'Test Author', homepage: '' },
            date: '2024-01-01',
            business_criticality: 'important',
            business_overview: {
                description: 'Test',
                images: [],
            },
            technical_overview: {
                description: 'Test',
                images: [],
            },
            questions: [],
            abuse_cases: [],
            security_requirements: [],
        },
        common_diagram: {},
        riskTracking: [],
        individualRiskCategories: [],
        sharedRuntimes: [],
        dataAssets: [],
        risksIdentified: [],
    });

    it('validates a complete valid model', () => {
        const model = createValidModel();
        const result = validateStrictDiagramModel(model);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('catches missing title', () => {
        const model = createValidModel();
        model.commonInformation.title = '';

        const result = validateStrictDiagramModel(model);

        expect(result.valid).toBe(false);
        expect(result.errors.some((e: string) => e.includes('title'))).toBe(true);
    });

    it('catches missing author', () => {
        const model = createValidModel();
        delete (model.commonInformation as any).author;

        const result = validateStrictDiagramModel(model);

        expect(result.valid).toBe(false);
        expect(result.errors.some((e: string) => e.includes('author'))).toBe(true);
    });

    it('catches missing business_criticality', () => {
        const model = createValidModel();
        delete (model.commonInformation as any).business_criticality;

        const result = validateStrictDiagramModel(model);

        expect(result.valid).toBe(false);
        expect(result.errors.some((e: string) => e.includes('business_criticality'))).toBe(true);
    });

    it('catches missing threagile_version', () => {
        const model = createValidModel();
        delete (model.commonInformation as any).threagile_version;

        const result = validateStrictDiagramModel(model);

        expect(result.valid).toBe(false);
        expect(result.errors.some((e: string) => e.includes('threagile_version'))).toBe(true);
    });

    it('handles empty graph', () => {
        const model = createValidModel();

        const result = validateStrictDiagramModel(model);

        expect(result.valid).toBe(true);
    });
});
