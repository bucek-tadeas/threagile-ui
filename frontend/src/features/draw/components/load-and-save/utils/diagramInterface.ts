/*

Interfaces used for json file Store

*/

import type { TechnicalAsset, CommonInformation, TrustBoundary, CommunicationLink, DataAsset, CommonDiagram, RiskTracking, IndividualRiskCategories, SharedRuntimes, RisksIdentified } from "@components/types/threagileComponents";

export interface DiagramFile {
    technical_assets: DiagramTechnicalAsset[];
    communication_links: DiagramCommunicationLink[];
    trust_boundaries: DiagramTrustBoundary[];
    common_information: CommonInformation;
    common_diagram: CommonDiagram;
    risk_tracking: RiskTracking[];
    individual_risk_categories: IndividualRiskCategories[];
    shared_runtimes: SharedRuntimes[];
    data_assets: DataAsset[];
    risks_identified: RisksIdentified[];

    ui?: {
        positions: Record<string, { x: number; y: number }>;
        zoom: number;
        pan: { x: number; y: number };
        collapsed?: Record<string, boolean>;
    };
}

export interface DiagramTechnicalAsset {
    technicalAsset: TechnicalAsset;
    internalId: string;
    parentId: string;
}

export interface DiagramCommunicationLink {
    communicationLink: CommunicationLink;
    sourceID: string;
    targetID: string;
}

export interface DiagramTrustBoundary {
    trustBoundary: TrustBoundary;
    internalId: string;
    parentId: string;
}