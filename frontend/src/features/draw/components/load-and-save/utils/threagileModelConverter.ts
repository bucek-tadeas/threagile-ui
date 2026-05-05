/* eslint-disable @typescript-eslint/no-explicit-any */
/*

Converts a native Threagile YAML model (map-based format used by the Threagile CLI)
into the DiagramFile format used internally by the UI.

Native format has technical_assets/trust_boundaries/data_assets etc. as maps (name → data),
with communication_links nested inside technical assets.

DiagramFile format has arrays with internalId/parentId/sourceID/targetID for graph reconstruction.

*/

import type { DiagramFile, DiagramTechnicalAsset, DiagramCommunicationLink, DiagramTrustBoundary } from "./diagramInterface";
import type {
    CommonInformation, CommonDiagram, TechnicalAsset, CommunicationLink,
    TrustBoundary, DataAsset, SharedRuntimes, RiskTracking,
    IndividualRiskCategories, RisksIdentified, Question, AbuseCase, SecurityRequirement
} from "@components/types/threagileComponents";

let idCounter = 0;
function generateId(): string {
    return `native-import-${++idCounter}`;
}

function resetIdCounter() {
    idCounter = 0;
}

export function isNativeThreagileModel(data: any): boolean {
    if (!data || typeof data !== "object") return false;

    if (data.technical_assets && !Array.isArray(data.technical_assets) && typeof data.technical_assets === "object") {
        return true;
    }

    if (data.title && data.author && !data.common_information) {
        return true;
    }

    return false;
}

function convertKeyValueMap(map: Record<string, string> | null | undefined, keyField: string, valueField: string): any[] {
    if (!map || typeof map !== "object") return [];
    return Object.entries(map).map(([key, value]) => ({
        [keyField]: key,
        [valueField]: value,
    }));
}

function buildCommonInformation(data: any): CommonInformation {
    const questions: Question[] = convertKeyValueMap(data.questions, "question", "answer") as Question[];
    const abuse_cases: AbuseCase[] = convertKeyValueMap(data.abuse_cases, "abuse_case", "description") as AbuseCase[];
    const security_requirements: SecurityRequirement[] = convertKeyValueMap(data.security_requirements, "security_requirement", "description") as SecurityRequirement[];

    return {
        threagile_version: data.threagile_version || "",
        title: data.title || "",
        date: data.date || "",
        author: data.author || { name: "", contact: "", homepage: "" },
        contributors: data.contributors || [],
        management_summary_comment: data.management_summary_comment || "",
        business_criticality: data.business_criticality || null,
        application_description: {
            description: data.application_description?.description || "",
            images: data.application_description?.images || [],
        },
        business_overview: {
            description: data.business_overview?.description || "",
            images: data.business_overview?.images || [],
        },
        technical_overview: {
            description: data.technical_overview?.description || "",
            images: data.technical_overview?.images || [],
        },
        questions,
        abuse_cases,
        security_requirements,
    };
}

function buildCommonDiagram(data: any): CommonDiagram {
    return {
        diagram_tweak_suppress_edge_labels: data.diagram_tweak_suppress_edge_labels ?? null,
        diagram_tweak_layout_left_to_right: data.diagram_tweak_layout_left_to_right ?? null,
        diagram_tweak_edge_layout: data.diagram_tweak_edge_layout ?? null,
        diagram_tweak_nodesep: data.diagram_tweak_nodesep ?? null,
        diagram_tweak_ranksep: data.diagram_tweak_ranksep ?? null,
        diagram_tweak_invisible_connections_between_assets: data.diagram_tweak_invisible_connections_between_assets || [],
        diagram_tweak_same_rank_assets: data.diagram_tweak_same_rank_assets || [],
    };
}

function convertDataAssets(dataAssetsMap: Record<string, any> | null | undefined): DataAsset[] {
    if (!dataAssetsMap || typeof dataAssetsMap !== "object") return [];
    return Object.entries(dataAssetsMap).map(([name, value]) => ({
        _internalId: generateId(),
        name,
        id: value.id || name.toLowerCase().replace(/\s+/g, "-"),
        description: value.description || "",
        usage: value.usage || null,
        tags: value.tags || [],
        origin: value.origin || "",
        owner: value.owner || "",
        quantity: value.quantity || null,
        confidentiality: value.confidentiality || null,
        integrity: value.integrity || null,
        availability: value.availability || null,
        justification_cia_rating: value.justification_cia_rating || "",
    }));
}

function resolveDataAssetRefs(ids: string[] | null | undefined, dataAssets: DataAsset[]): DataAsset[] {
    if (!ids || ids.length === 0) return [];
    const resolved = ids
        .map(id => dataAssets.find(da => da.id === id))
        .filter(Boolean) as DataAsset[];
    return resolved;
}

function convertTechnicalAssets(
    technicalAssetsMap: Record<string, any> | null | undefined,
    dataAssets: DataAsset[]
): { assets: DiagramTechnicalAsset[], idMap: Map<string, string> } {
    const assets: DiagramTechnicalAsset[] = [];
    const idMap = new Map<string, string>();

    if (!technicalAssetsMap || typeof technicalAssetsMap !== "object") {
        return { assets, idMap };
    }

    for (const [name, value] of Object.entries(technicalAssetsMap)) {
        const internalId = generateId();
        const assetId = value.id || name.toLowerCase().replace(/\s+/g, "-");

        idMap.set(assetId, internalId);

        let technologies = value.technologies || [];
        if (!technologies.length && value.technology) {
            technologies = [value.technology];
        }

        const technicalAsset: TechnicalAsset = {
            _internalId: internalId,
            name,
            id: assetId,
            description: value.description || "",
            type: value.type || null,
            usage: value.usage || null,
            used_as_client_by_human: value.used_as_client_by_human ?? false,
            out_of_scope: value.out_of_scope ?? false,
            justification_out_of_scope: value.justification_out_of_scope || "",
            size: value.size || null,
            technologies,
            tags: value.tags || [],
            internet: value.internet ?? false,
            machine: value.machine || null,
            encryption: value.encryption || null,
            owner: value.owner || "",
            confidentiality: value.confidentiality || null,
            integrity: value.integrity || null,
            availability: value.availability || null,
            justification_cia_rating: value.justification_cia_rating || "",
            multi_tenant: value.multi_tenant ?? false,
            redundant: value.redundant ?? false,
            custom_developed_parts: value.custom_developed_parts ?? false,
            data_assets_processed: resolveDataAssetRefs(value.data_assets_processed, dataAssets),
            data_assets_stored: resolveDataAssetRefs(value.data_assets_stored, dataAssets),
            data_formats_accepted: value.data_formats_accepted || null,
            diagram_tweak_order: value.diagram_tweak_order ?? null,
            communication_links: [],
        };

        assets.push({
            technicalAsset: technicalAsset,
            internalId,
            parentId: "",
        });
    }

    return { assets, idMap };
}

function convertCommunicationLinks(
    technicalAssetsMap: Record<string, any> | null | undefined,
    idMap: Map<string, string>,
    dataAssets: DataAsset[]
): DiagramCommunicationLink[] {
    const links: DiagramCommunicationLink[] = [];
    if (!technicalAssetsMap || typeof technicalAssetsMap !== "object") return links;

    const seenLinks = new Map<string, DiagramCommunicationLink>();

    for (const [_assetName, assetValue] of Object.entries(technicalAssetsMap)) {
        const sourceAssetId = assetValue.id || _assetName.toLowerCase().replace(/\s+/g, "-");
        const sourceInternalId = idMap.get(sourceAssetId);
        if (!sourceInternalId) continue;

        const commLinks = assetValue.communication_links;
        if (!commLinks || typeof commLinks !== "object") continue;

        for (const [linkName, linkValue] of Object.entries(commLinks as Record<string, any>)) {
            const targetAssetId = linkValue.target;
            const targetInternalId = idMap.get(targetAssetId);
            if (!targetInternalId) continue;

            const reverseKey = `${targetInternalId}->${sourceInternalId}:${linkName}`;
            if (seenLinks.has(reverseKey)) {
                seenLinks.get(reverseKey)!.communicationLink.bidirectional = true;
                continue;
            }

            const communicationLink: CommunicationLink = {
                _internalId: generateId(),
                name: linkName,
                target: targetAssetId,
                description: linkValue.description || "",
                protocol: linkValue.protocol || null,
                authentication: linkValue.authentication || null,
                authorization: linkValue.authorization || null,
                tags: linkValue.tags || [],
                vpn: linkValue.vpn ?? false,
                ip_filtered: linkValue.ip_filtered ?? false,
                readonly: linkValue.readonly ?? false,
                usage: linkValue.usage || null,
                data_assets_sent: resolveDataAssetRefs(linkValue.data_assets_sent, dataAssets),
                data_assets_received: resolveDataAssetRefs(linkValue.data_assets_received, dataAssets),
                diagram_tweak_weight: linkValue.diagram_tweak_weight ?? null,
                diagram_tweak_constraint: linkValue.diagram_tweak_constraint ?? null,
                bidirectional: false,
            };

            const diagramLink: DiagramCommunicationLink = {
                communicationLink,
                sourceID: sourceInternalId,
                targetID: targetInternalId,
            };

            const forwardKey = `${sourceInternalId}->${targetInternalId}:${linkName}`;
            seenLinks.set(forwardKey, diagramLink);
            links.push(diagramLink);
        }
    }

    return links;
}

function convertTrustBoundaries(
    trustBoundariesMap: Record<string, any> | null | undefined,
): DiagramTrustBoundary[] {
    if (!trustBoundariesMap || typeof trustBoundariesMap !== "object") return [];

    const boundaries: DiagramTrustBoundary[] = [];
    const tbIdMap = new Map<string, string>();

    for (const [name, value] of Object.entries(trustBoundariesMap)) {
        const internalId = generateId();
        const tbId = value.id || name.toLowerCase().replace(/\s+/g, "-");
        tbIdMap.set(tbId, internalId);

        const trustBoundary: TrustBoundary = {
            _internalId: internalId,
            name,
            id: tbId,
            description: value.description || "",
            type: value.type || null,
            tags: value.tags || [],
        };

        boundaries.push({
            trustBoundary,
            internalId,
            parentId: "",
        });
    }

    for (const [_name, value] of Object.entries(trustBoundariesMap)) {
        const tbId = value.id || _name.toLowerCase().replace(/\s+/g, "-");
        const parentInternalId = tbIdMap.get(tbId);
        if (!parentInternalId) continue;

        const nestedTbs = value.trust_boundaries_nested;
        if (Array.isArray(nestedTbs)) {
            for (const nestedTbId of nestedTbs) {
                const nestedInternalId = tbIdMap.get(nestedTbId);
                if (nestedInternalId) {
                    const boundary = boundaries.find(b => b.internalId === nestedInternalId);
                    if (boundary) {
                        boundary.parentId = parentInternalId;
                    }
                }
            }
        }
    }

    return boundaries;
}

function assignAssetsToTrustBoundaries(
    assets: DiagramTechnicalAsset[],
    trustBoundariesMap: Record<string, any> | null | undefined,
    assetIdMap: Map<string, string>,
    boundaries: DiagramTrustBoundary[]
) {
    if (!trustBoundariesMap || typeof trustBoundariesMap !== "object") return;

    // Build a map from boundary name/id to its internal ID
    const tbNameToInternalId = new Map<string, string>();
    for (const b of boundaries) {
        tbNameToInternalId.set(b.trustBoundary.id, b.internalId);
    }

    for (const [_name, value] of Object.entries(trustBoundariesMap)) {
        const tbId = value.id || _name.toLowerCase().replace(/\s+/g, "-");
        const tbInternalId = tbNameToInternalId.get(tbId);
        if (!tbInternalId) continue;

        const assetsInside = value.technical_assets_inside;
        if (Array.isArray(assetsInside)) {
            for (const assetId of assetsInside) {
                const assetInternalId = assetIdMap.get(assetId);
                if (assetInternalId) {
                    const asset = assets.find(a => a.internalId === assetInternalId);
                    if (asset) {
                        asset.parentId = tbInternalId;
                    }
                }
            }
        }
    }
}

function convertSharedRuntimes(
    map: Record<string, any> | null | undefined,
    assetIdMap: Map<string, string>,
    assets: DiagramTechnicalAsset[]
): SharedRuntimes[] {
    if (!map || typeof map !== "object") return [];
    return Object.entries(map).map(([name, value]) => {
        const technicalAssetsRunning = (value.technical_assets_running || [])
            .map((assetId: string) => {
                const internalId = assetIdMap.get(assetId);
                if (!internalId) return null;
                const asset = assets.find(a => a.internalId === internalId);
                return asset?.technicalAsset || null;
            })
            .filter(Boolean);

        return {
            _internalId: generateId(),
            name,
            id: value.id || name.toLowerCase().replace(/\s+/g, "-"),
            description: value.description || "",
            tags: value.tags || [],
            technical_assets_running: technicalAssetsRunning,
        };
    });
}

function convertRiskTracking(map: Record<string, any> | null | undefined): RiskTracking[] {
    if (!map || typeof map !== "object") return [];
    return Object.entries(map).map(([name, value]) => ({
        _internalId: generateId(),
        name,
        status: value.status || null,
        justification: value.justification || "",
        ticket: value.ticket || "",
        date: value.date || "",
        checked_by: value.checked_by || "",
    }));
}

function convertIndividualRiskCategories(
    map: Record<string, any> | null | undefined,
    dataAssets: DataAsset[],
    assets: DiagramTechnicalAsset[],
    boundaries: DiagramTrustBoundary[],
    sharedRuntimes: SharedRuntimes[],
    commLinks: DiagramCommunicationLink[]
): IndividualRiskCategories[] {
    if (!map || typeof map !== "object") return [];
    return Object.entries(map).map(([name, value]) => {
        const risksIdentified = convertRisksIdentified(
            value.risks_identified, dataAssets, assets, boundaries, sharedRuntimes, commLinks
        );

        return {
            _internalId: generateId(),
            name,
            id: value.id || name.toLowerCase().replace(/\s+/g, "-"),
            description: value.description || "",
            impact: value.impact || "",
            asvs: value.asvs || "",
            cheat_sheet: value.cheat_sheet || "",
            action: value.action || "",
            mitigation: value.mitigation || "",
            check: value.check || "",
            function: value.function || null,
            stride: value.stride || null,
            detection_logic: value.detection_logic || "",
            risk_assessment: value.risk_assessment || "",
            false_positives: value.false_positives || "",
            model_failure_possible_reason: value.model_failure_possible_reason ?? null,
            cwe: value.cwe ?? null,
            risks_identified: risksIdentified,
        };
    });
}

function convertRisksIdentified(
    map: Record<string, any> | null | undefined,
    dataAssets: DataAsset[],
    assets: DiagramTechnicalAsset[],
    boundaries: DiagramTrustBoundary[],
    sharedRuntimes: SharedRuntimes[],
    commLinks: DiagramCommunicationLink[]
): RisksIdentified[] {
    if (!map || typeof map !== "object") return [];
    return Object.entries(map).map(([name, value]) => ({
        _internalId: generateId(),
        name,
        severity: value.severity || null,
        exploitation_likelihood: value.exploitation_likelihood || null,
        exploitation_impact: value.exploitation_impact || null,
        data_breach_probability: value.data_breach_probability || null,
        data_breach_technical_assets: (value.data_breach_technical_assets || [])
            .map((id: string) => assets.find(a => a.technicalAsset.id === id)?.technicalAsset)
            .filter(Boolean),
        most_relevant_data_asset: dataAssets.find(da => da.id === value.most_relevant_data_asset) || null,
        most_relevant_technical_asset: assets.find(a => a.technicalAsset.id === value.most_relevant_technical_asset)?.technicalAsset || null,
        most_relevant_communication_link: commLinks.find(cl => cl.communicationLink.name === value.most_relevant_communication_link)?.communicationLink || null,
        most_relevant_trust_boundary: boundaries.find(b => b.trustBoundary.id === value.most_relevant_trust_boundary)?.trustBoundary || null,
        most_relevant_shared_runtime: sharedRuntimes.find(sr => sr.id === value.most_relevant_shared_runtime) || null,
    }));
}

export function convertNativeThreagileToDigramFile(data: any): DiagramFile {
    resetIdCounter();

    const commonInformation = buildCommonInformation(data);
    const commonDiagram = buildCommonDiagram(data);
    const dataAssets = convertDataAssets(data.data_assets);

    const { assets, idMap } = convertTechnicalAssets(data.technical_assets, dataAssets);
    const communicationLinks = convertCommunicationLinks(data.technical_assets, idMap, dataAssets);
    const trustBoundaries = convertTrustBoundaries(data.trust_boundaries);

    assignAssetsToTrustBoundaries(assets, data.trust_boundaries, idMap, trustBoundaries);

    const sharedRuntimes = convertSharedRuntimes(data.shared_runtimes, idMap, assets);
    const riskTracking = convertRiskTracking(data.risk_tracking);
    const individualRiskCategories = convertIndividualRiskCategories(
        data.individual_risk_categories, dataAssets, assets, trustBoundaries, sharedRuntimes, communicationLinks
    );

    const risksIdentified: RisksIdentified[] = individualRiskCategories.flatMap(
        irc => irc.risks_identified || []
    );

    return {
        technical_assets: assets,
        communication_links: communicationLinks,
        trust_boundaries: trustBoundaries,
        common_information: commonInformation,
        common_diagram: commonDiagram,
        risk_tracking: riskTracking,
        individual_risk_categories: individualRiskCategories,
        shared_runtimes: sharedRuntimes,
        data_assets: dataAssets,
        risks_identified: risksIdentified,
    };
}
