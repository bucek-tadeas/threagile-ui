/* eslint-disable @typescript-eslint/no-explicit-any */
/*

Strict validation used before execution to check for validity of the threat model

*/

import type { CommonInformation, CommonDiagram, RiskTracking, IndividualRiskCategories, SharedRuntimes, RisksIdentified, DataAsset, TechnicalAsset, TrustBoundary, CommunicationLink } from "@components/types/threagileComponents";
import {
    DataAssetRequirements,
    CommunicationLinkRequirements,
    TechnicalAssetRequirements,
    TrustBoundaryRequirements,
    CommonInformationRequirements,
    CommonDiagramRequirements,
    RiskTrackingRequirements,
    IndividualRiskCategoriesRequirements,
    SharedRuntimesRequirements,
    RisksIdentifiedRequirements,
} from '@components/types/threagileComponentsRequirements'
import { Graph } from "@maxgraph/core";

export interface StrictModel {
    graph: any;
    commonInformation: CommonInformation;
    common_diagram: CommonDiagram;
    riskTracking: RiskTracking[];
    individualRiskCategories: IndividualRiskCategories[];
    sharedRuntimes: SharedRuntimes[];
    dataAssets: DataAsset[];
    risksIdentified: RisksIdentified[];
}

export interface StrictValidationResult {
    valid: boolean;
    errors: string[];
}

function collectCellsStrict(graph: Graph, parent: any, technical_assets: TechnicalAsset[], trust_boundaries: TrustBoundary[], communication_links: CommunicationLink[]) {
    const cells = graph.getChildCells(parent, true, true);

    cells.forEach((cell: any) => {
        if (cell.isVertex() && cell.technicalAsset) {
            technical_assets.push(cell.technicalAsset);
        } else if (cell.isVertex() && cell.trustBoundary) {
            trust_boundaries.push(cell.trustBoundary);
            collectCellsStrict(graph, cell, technical_assets, trust_boundaries, communication_links);
        } else if (cell.isEdge() && cell.communicationLink) {
            communication_links.push(cell.communicationLink);
        }
    });
}

function validateFields(
    modelName: string,
    obj: any,
    requirements: Record<string, boolean>
): string[] {
    const errors: string[] = [];

    Object.entries(requirements).forEach(([field, req]) => {
        const value = obj[field];

        if (req && field !== "target") {
            const isEmpty =
                value === null ||
                value === undefined ||
                value === "";

            if (isEmpty) {
                errors.push(`${modelName}: Missing required field "${field}".`);
            }
        }
    });

    return errors;
}

function validateArrayItems(
    modelName: string,
    arr: any[],
    requirements: Record<string, boolean>
): string[] {
    const errors: string[] = [];

    arr.forEach((item, index) => {
        errors.push(
            ...validateFields(`${modelName}[${index}]`, item, requirements)
        );
    });

    return errors;
}

export function validateStrictDiagramModel(model: StrictModel): StrictValidationResult {
    const errors: string[] = [];
    const technical_assets: TechnicalAsset[] = [];
    const communication_links: CommunicationLink[] = [];
    const trust_boundaries: TrustBoundary[] = [];
    const parent = model.graph.getDefaultParent();
    collectCellsStrict(model.graph, parent, technical_assets, trust_boundaries, communication_links);

    errors.push(
        ...validateFields("CommonInformation", model.commonInformation, CommonInformationRequirements)
    );

    errors.push(
        ...validateFields("CommonDiagram", model.common_diagram, CommonDiagramRequirements)
    );

    errors.push(
        ...validateArrayItems("RiskTracking", model.riskTracking, RiskTrackingRequirements)
    );

    errors.push(
        ...validateArrayItems("IndividualRiskCategories", model.individualRiskCategories, IndividualRiskCategoriesRequirements)
    );

    errors.push(
        ...validateArrayItems("DataAssets", model.dataAssets, DataAssetRequirements)
    );

    errors.push(
        ...validateArrayItems("TechnicalAssets", technical_assets, TechnicalAssetRequirements)
    );

    errors.push(
        ...validateArrayItems("TrustBoundaries", trust_boundaries, TrustBoundaryRequirements)
    );

    errors.push(
        ...validateArrayItems("CommunicationLinks", communication_links, CommunicationLinkRequirements)
    );

    errors.push(
        ...validateArrayItems("SharedRuntimes", model.sharedRuntimes, SharedRuntimesRequirements)
    );

    errors.push(
        ...validateArrayItems("RisksIdentified", model.risksIdentified, RisksIdentifiedRequirements)
    );

    return {
        valid: errors.length === 0,
        errors,
    };
}
