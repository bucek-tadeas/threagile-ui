/* eslint-disable @typescript-eslint/no-explicit-any */
/* 

Transform all data in the threagile-ui to yaml model, which is then posted to backend to execute via threagile

*/

import yaml from "js-yaml";
import type {
    CommonDiagram, CommonInformation, DataAsset, IndividualRiskCategories,
    RisksIdentified, RiskTracking, SharedRuntimes,
    TrustBoundary
} from "@components/types/threagileComponents";
import { Graph } from "@maxgraph/core";
import type { DiagramCommunicationLink, DiagramTechnicalAsset, DiagramTrustBoundary } from "../load-and-save/utils/diagramInterface";

interface ExpandedTrustBoundary {
    trustBoundary: TrustBoundary & {
        technical_assets_inside: string[] | null;
        trust_boundaries_nested: string[] | null;
    };
    internalId: string;
    parentId: string | null;
}

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

function collectCells(graph: Graph, parent: any, technical_assets: DiagramTechnicalAsset[], trust_boundaries: DiagramTrustBoundary[], communication_links: DiagramCommunicationLink[]) {
    const cells = graph.getChildCells(parent, true, true);

    cells.forEach((cell: any) => {
        if (cell.isVertex() && cell.technicalAsset) {
            technical_assets.push({
                technicalAsset: { ...cell.technicalAsset },
                internalId: cell.id,
                parentId: cell.parent?.id ?? null,
            });
        } else if (cell.isVertex() && cell.trustBoundary) {
            trust_boundaries.push({
                trustBoundary: { ...cell.trustBoundary },
                internalId: cell.id,
                parentId: cell.parent?.id ?? null,
            });
            collectCells(graph, cell, technical_assets, trust_boundaries, communication_links);
        } else if (cell.isEdge() && cell.communicationLink) {
            const source = cell.getTerminal(true);
            const target = cell.getTerminal(false);
            communication_links.push({
                communicationLink: { ...cell.communicationLink },
                sourceID: source ? source.id : "",
                targetID: target ? target.id : "",
            });
        }
    });
}

function expandTrustBoundary(
    technical_assets: DiagramTechnicalAsset[],
    trust_boundaries: DiagramTrustBoundary[],
    tb: DiagramTrustBoundary
): ExpandedTrustBoundary {

    const tbId = tb.internalId;

    const technical_assets_inside = technical_assets
        .filter(t => t.parentId === tbId)
        .map(t => t.technicalAsset.id);

    const trust_boundaries_nested = trust_boundaries
        .filter(t => t.parentId === tbId)
        .map(t => t.trustBoundary.id);

    return {
        ...tb,
        trustBoundary: {
            ...tb.trustBoundary,
            technical_assets_inside:
                technical_assets_inside.length > 0 ? technical_assets_inside : null,
            trust_boundaries_nested:
                trust_boundaries_nested.length > 0 ? trust_boundaries_nested : null,
        }
    };
}

function rewriteKeyValueArray<
    T extends Record<string, string>
>(
    arr: T[] | undefined,
    keyField: keyof T,
    valueField: keyof T
): Record<string, string> | null {
    if (!arr || arr.length === 0) return null;

    const result: Record<string, string> = {};

    for (const item of arr) {
        const key = item[keyField];
        const value = item[valueField];

        if (key && value) {
            result[key] = value;
        }
    }

    return Object.keys(result).length > 0 ? result : null;
}

function rewriteCommonInformation(ci: CommonInformation): any {
    const rewritten: any = { ...ci };

    rewritten.questions = rewriteKeyValueArray(
        ci.questions,
        "question",
        "answer"
    );

    rewritten.abuse_cases = rewriteKeyValueArray(
        ci.abuse_cases,
        "abuse_case",
        "description"
    );

    rewritten.security_requirements = rewriteKeyValueArray(
        ci.security_requirements,
        "security_requirement",
        "description"
    );

    return rewritten;
}

function stripInternalFields(item: any) {
    const clone = { ...item };
    delete clone._internalId;
    return clone;
}

function replaceNestedIds(obj: any): any {
    if (!obj || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) {
        return obj.map(replaceNestedIds);
    }
    const newObj: any = {};
    for (const key in obj) {
        const val = obj[key];
        if (val && typeof val === "object" && "id" in val) {
            newObj[key] = val.id;
        } else if (Array.isArray(val) && val.every(v => v && typeof v === "object" && "id" in v)) {
            newObj[key] = val.map(v => (v.id));
        } else {
            newObj[key] = replaceNestedIds(val);
        }
    }

    return newObj;
}

function replaceCommLinks(obj: any): any {
    if (!obj || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) {
        return obj.map(replaceNestedIds);
    }
    const newObj: any = {};
    for (const key in obj) {
        const val = obj[key];
        if (val && typeof val === "object" && key === "most_relevant_communication_link") {
            newObj[key] = val.name;
        } else {
            newObj[key] = replaceNestedIds(val);
        }
    }

    return newObj;
}

function emptyArraysToNull(obj: any): any {
    if (!obj || typeof obj !== "object") return obj;

    if (Array.isArray(obj)) {
        return obj.length === 0
            ? null
            : obj.map(emptyArraysToNull);
    }

    const result: any = {};
    for (const key of Object.keys(obj)) {
        result[key] = emptyArraysToNull(obj[key]);
    }

    return result;
}

function isObjectNonEmpty(obj: any): boolean {
    if (!obj || typeof obj !== "object") return false;
    return Object.values(obj).some(v => {
        if (v === null) return false;
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === "object") return isObjectNonEmpty(v);
        return true;
    });
}

function removeNameField(obj: any): any {
    if (!obj || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map(removeNameField);

    const newObj: any = {};
    for (const key in obj) {
        if (key === "name") continue;
        newObj[key] = removeNameField(obj[key]);
    }
    return newObj;
}

function collectAllTags(obj: any, tags: Set<string>) {
    if (!obj || typeof obj !== "object") return;

    if (Array.isArray(obj)) {
        for (const item of obj) collectAllTags(item, tags);
        return;
    }

    for (const key in obj) {
        if (key === "tags" && Array.isArray(obj[key])) {
            for (const tag of obj[key]) {
                if (typeof tag === "string" && tag.trim() !== "") {
                    tags.add(tag.trim());
                }
            }
        }
        collectAllTags(obj[key], tags);
    }
}

export function serializeToThreagileYAML(model: StrictModel): string {
    const technical_assets: DiagramTechnicalAsset[] = [];
    const communication_links: DiagramCommunicationLink[] = [];
    const trust_boundaries: DiagramTrustBoundary[] = [];

    const parent = model.graph.getDefaultParent();
    collectCells(model.graph, parent, technical_assets, trust_boundaries, communication_links);

    const idToAsset = new Map<string, { name: string, id: string }>();
    technical_assets.forEach(t => {
        idToAsset.set(t.internalId, {
            name: t.technicalAsset.name,
            id: t.technicalAsset.id
        });
    });

    const assetLinks: Record<string, Record<string, any>> = {};
    technical_assets.forEach(t => {
        assetLinks[t.technicalAsset.name] = {};
    });

    communication_links.forEach(link => {
        const { sourceID, targetID, communicationLink } = link;

        const source = idToAsset.get(sourceID);
        const target = idToAsset.get(targetID);

        if (!source || !target) return;

        const linkData = removeNameField(stripInternalFields(communicationLink));
        delete linkData.bidirectional;
        const linkName = communicationLink.name;

        assetLinks[source.name][linkName] = {
            ...linkData,
            target: target.id
        };

        if (communicationLink.bidirectional === true) {
            assetLinks[target.name][linkName] = {
                ...linkData,
                target: source.id
            };
        }
    });

    const expandedTrustBoundaries: ExpandedTrustBoundary[] =
        trust_boundaries.map(tb =>
            expandTrustBoundary(technical_assets, trust_boundaries, tb)
        );

    const rewrittenCommonInfo = rewriteCommonInformation(
        stripInternalFields(model.commonInformation)
    );

    const topLevel: any = {
        ...replaceNestedIds(rewrittenCommonInfo)
    };

    topLevel.tags_available = [];

    topLevel.data_assets = Object.fromEntries(
        model.dataAssets.map(a => [a.name, removeNameField(stripInternalFields(a))])
    );


    topLevel.technical_assets = Object.fromEntries(
        technical_assets.map(t => {
            const assetData = removeNameField(stripInternalFields(t.technicalAsset));
            const technology = assetData.technologies && assetData.technologies.length > 0
                ? assetData.technologies[0]
                : "unknown-technology";

            return [
                t.technicalAsset.name,
                replaceNestedIds({
                    ...assetData,
                    technology,
                    communication_links: replaceNestedIds(assetLinks[t.technicalAsset.name])
                })
            ];
        })
    );

    topLevel.trust_boundaries = Object.fromEntries(
        expandedTrustBoundaries.map(tb => [
            tb.trustBoundary.name,
            replaceNestedIds(removeNameField(stripInternalFields(tb.trustBoundary)))
        ])
    );

    topLevel.shared_runtimes = Object.fromEntries(
        model.sharedRuntimes.map(r => [r.name, replaceNestedIds(removeNameField(stripInternalFields(r)))])
    );

    topLevel.individual_risk_categories = Object.fromEntries(
        model.individualRiskCategories.map(irc =>
            [
                irc.name,
                {
                    ...replaceNestedIds(removeNameField(stripInternalFields(irc))),
                    risks_identified: Object.fromEntries(model.risksIdentified.map(ri => [ri.name, replaceCommLinks(replaceNestedIds(removeNameField(stripInternalFields(ri))))]))
                }
            ]
        )
    )

    topLevel.risk_tracking = Object.fromEntries(
        model.riskTracking.map(r => [r.name, replaceNestedIds(removeNameField(stripInternalFields(r)))])
    );

    const commonDiagramFields = replaceNestedIds(stripInternalFields(model.common_diagram));
    if (isObjectNonEmpty(commonDiagramFields)) {
        for (const key of Object.keys(commonDiagramFields)) {
            topLevel[key] = commonDiagramFields[key];
        }
    }

    const tagSet = new Set<string>();
    collectAllTags(topLevel, tagSet);
    topLevel.tags_available = Array.from(tagSet);

    const finalOutput = emptyArraysToNull(topLevel);
    return yaml.dump(finalOutput, {
        noRefs: true,
        sortKeys: false,
    });
}
