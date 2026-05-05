/* eslint-disable @typescript-eslint/no-explicit-any */
/*

Validation of json file before loading in the UI

*/

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

function validateObject(
    obj: Record<string, any>,
    requirements: Record<string, boolean>,
    path: string
): string[] {
    const errors: string[] = [];

    for (const [field, required] of Object.entries(requirements)) {
        if (required && !(field in obj)) {
            errors.push(`${path}.${field} is required but missing`);
        }
    }

    return errors;
}

export const transformString = (s: string) =>
    s.replace(/^(.+?)_([a-zA-Z])(.+?)(ies|s)$/, (_, p1, c, p2, suffix) =>
        `${p1}${c.toUpperCase()}${p2}${suffix === "ies" ? "y" : ""}`);

export function validateDiagramFile(file: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (typeof file !== "object" || file === null) {
        return { valid: false, errors: ["File is not a valid object"] };
    }

    if (!file.common_information) {
        errors.push("common_information section missing");
    } else {
        errors.push(
            ...validateObject(file.common_information, CommonInformationRequirements, "common_information")
        );
    }

    if (!file.common_diagram) {
        errors.push("common_diagram section missing");
    } else {
        errors.push(
            ...validateObject(file.common_diagram, CommonDiagramRequirements, "common_diagram")
        );
    }

    const validateArray = (
        arr: any[],
        requirements: Record<string, boolean>,
        path: string
    ) => {
        if (!Array.isArray(arr)) {
            errors.push(`${path} should be an array`);
            return;
        }
        if (arr.length === 0) {
            return;
        }
        arr.forEach((item, i) => {
            if (["technical_assets", "communication_links", "trust_boundaries"].includes(path)) {
                const transformedString = transformString(path);
                errors.push(...validateObject(item[transformedString], requirements, `${path}[${i}]`));
            } else
                errors.push(...validateObject(item, requirements, `${path}[${i}]`));
        });
    };

    if (file.risk_tracking) {
        validateArray(file.risk_tracking, RiskTrackingRequirements, "risk_tracking");
    }

    if (file.individual_risk_categories) {
        validateArray(file.individual_risk_categories, IndividualRiskCategoriesRequirements, "individual_risk_categories");
    }

    if (file.technical_assets)
        validateArray(file.technical_assets, TechnicalAssetRequirements, "technical_assets");

    if (file.communication_links)
        validateArray(file.communication_links, CommunicationLinkRequirements, "communication_links");

    if (file.trust_boundaries)
        validateArray(file.trust_boundaries, TrustBoundaryRequirements, "trust_boundaries");

    if (file.data_assets)
        validateArray(file.data_assets, DataAssetRequirements, "data_assets");

    if (file.shared_runtimes)
        validateArray(file.shared_runtimes, SharedRuntimesRequirements, "shared_runtimes");

    if (file.risks_identified)
        validateArray(file.risks_identified, RisksIdentifiedRequirements, "risks_identified");

    return { valid: errors.length === 0, errors };
}
