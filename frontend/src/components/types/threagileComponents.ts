/*

Basic interfaces according to Threagile

*/

import * as ThreagileEnums from "./threagileEnums";

export interface DataAsset {
    _internalId: string;
    name: string;
    id: string;
    description: string;
    usage: ThreagileEnums.DataAssetUsageType | null;
    tags?: string[];
    origin?: string;
    owner?: string;
    quantity: ThreagileEnums.DataAssetQuantityType | null;
    confidentiality: ThreagileEnums.DataAssetConfidentialityType | null;
    integrity: ThreagileEnums.DataAssetIntegrityType | null;
    availability: ThreagileEnums.DataAssetAvailabilityType | null;
    justification_cia_rating?: string;
}

export interface CommunicationLink {
    _internalId: string;
    name: string;
    target: string;
    description: string;
    protocol: ThreagileEnums.CommunicationLinkProtocolType | null;
    authentication: ThreagileEnums.CommunicationLinkAuthenticationType | null;
    authorization: ThreagileEnums.CommunicationLinkAuthorizationType | null;
    tags?: string[];
    vpn: boolean;
    ip_filtered: boolean;
    readonly: boolean;
    usage?: ThreagileEnums.CommunicationLinkUsageType | null;
    data_assets_sent?: DataAsset[] | null;
    data_assets_received?: DataAsset[] | null;
    diagram_tweak_weight?: number | null;
    diagram_tweak_constraint?: boolean | null;
    bidirectional: boolean;
}

export interface TechnicalAsset {
    _internalId: string;
    name: string;
    id: string;
    description: string;
    type: ThreagileEnums.TechnicalAssetTypeType | null;
    usage: ThreagileEnums.TechnicalAssetUsageType | null;
    used_as_client_by_human: boolean;
    out_of_scope: boolean;
    justification_out_of_scope?: string;
    size: ThreagileEnums.TechnicalAssetSizeType | null;
    technologies: ThreagileEnums.TechnicalAssetTechnologyType[];
    tags?: string[];
    internet: boolean;
    machine: ThreagileEnums.TechnicalAssetMachineType | null;
    encryption: ThreagileEnums.TechnicalAssetEncryptionType | null;
    owner: string;
    confidentiality: ThreagileEnums.TechnicalAssetConfidentialityType | null;
    integrity: ThreagileEnums.TechnicalAssetIntegrityType | null;
    availability: ThreagileEnums.TechnicalAssetAvailabilityType | null;
    justification_cia_rating?: string;
    multi_tenant: boolean;
    redundant: boolean;
    custom_developed_parts: boolean;
    data_assets_processed: DataAsset[] | null;
    data_assets_stored: DataAsset[] | null;
    data_formats_accepted: ThreagileEnums.TechnicalAssetDataFormatType[] | null;
    diagram_tweak_order?: number | null;
    communication_links: CommunicationLink[];
}

export interface AuthorInformation {
    name: string;
    contact: string;
    homepage: string;
}

export interface ContributorInformation {
    name: string;
    contact: string;
    homepage: string;
}

interface ApplicationDescription {
    description: string;
    images: string[];
}

interface BusinessOverview {
    description: string;
    images: string[];
}

interface TechnicalOverview {
    description: string;
    images: string[];
}

export type TwoFieldObject = Record<string, string>;

export interface Question extends TwoFieldObject {
    question: string;
    answer: string;
}

export interface AbuseCase extends TwoFieldObject {
    abuse_case: string;
    description: string;
}

export interface SecurityRequirement extends TwoFieldObject {
    security_requirement: string;
    description: string;
}

export interface CommonInformation {
    threagile_version: string;
    title: string;
    date: string;
    author: AuthorInformation;
    contributors: ContributorInformation[];
    management_summary_comment: string;
    business_criticality: ThreagileEnums.BusinessCriticalityType | null;
    application_description: ApplicationDescription;
    business_overview: BusinessOverview;
    technical_overview: TechnicalOverview;
    questions: Question[];
    abuse_cases: AbuseCase[];
    security_requirements: SecurityRequirement[];
}

export interface TrustBoundary {
    _internalId: string;
    name: string;
    id: string;
    description: string;
    type: ThreagileEnums.TrustBoundaryTypeType | null;
    tags?: string[];
}

export interface SharedRuntimes {
    _internalId: string;
    name: string;
    id: string;
    description: string;
    tags?: string[];
    technical_assets_running: TechnicalAsset[];
}

export interface RisksIdentified {
    _internalId: string;
    name: string;
    severity: ThreagileEnums.RisksIdentifiedSeverityType | null;
    exploitation_likelihood: ThreagileEnums.RisksIdentifiedExploitationLikelihoodType | null;
    exploitation_impact: ThreagileEnums.RisksIdentifiedExploitationImpactType | null;
    data_breach_probability: ThreagileEnums.RisksIdentifiedDataBreachProbabilityType | null;
    data_breach_technical_assets: TechnicalAsset[];
    most_relevant_data_asset: DataAsset | null;
    most_relevant_technical_asset: TechnicalAsset | null;
    most_relevant_communication_link: CommunicationLink | null;
    most_relevant_trust_boundary: TrustBoundary | null;
    most_relevant_shared_runtime: SharedRuntimes | null;
}

export interface IndividualRiskCategories {
    _internalId: string;
    name: string;
    id: string;
    description: string;
    impact: string;
    asvs: string;
    cheat_sheet: string;
    action: string;
    mitigation: string;
    check: string;
    function: ThreagileEnums.IndividualRiskCategoriesFunctionType | null;
    stride: ThreagileEnums.IndividualRiskCategoriesStrideType | null;
    detection_logic: string;
    risk_assessment: string;
    false_positives: string;
    model_failure_possible_reason: boolean | null;
    cwe: number | null;
    risks_identified: RisksIdentified[];
}

export interface RiskTracking {
    _internalId: string;
    name: string;
    status: ThreagileEnums.RiskTrackingStatusType | null;
    justification: string;
    ticket: string;
    date: string;
    checked_by: string;
}

export interface CommonDiagram {
    diagram_tweak_suppress_edge_labels: boolean | null;
    diagram_tweak_layout_left_to_right: boolean | null;
    diagram_tweak_edge_layout: ThreagileEnums.CommonDiagramDiagramTweakEgdeLayoutType | null;
    diagram_tweak_nodesep: number | null;
    diagram_tweak_ranksep: number | null;
    diagram_tweak_invisible_connections_between_assets: string[];
    diagram_tweak_same_rank_assets: string[];
}