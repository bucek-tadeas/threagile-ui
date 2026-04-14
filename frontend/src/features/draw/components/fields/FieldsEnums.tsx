/*

Enums of fields for each component of left and right sidebar grouped by input field type (all string fields in common information are one enum, all overview fields in common information are one enum etc.)

*/

import type { CommonDiagram, CommunicationLink, DataAsset, IndividualRiskCategories, RisksIdentified, RiskTracking, SharedRuntimes } from "@components/types/threagileComponents";
import { CommunicationLinkProtocol, CommunicationLinkAuthentication, CommunicationLinkAuthorization, CommunicationLinkUsage, RisksIdentifiedSeverity, RisksIdentifiedExploitationLikelihood, RisksIdentifiedExploitationImpact, RisksIdentifiedDataBreachProbability, IndividualRiskCategoriesFunction, IndividualRiskCategoriesStride, DataAssetUsage, DataAssetQuantity, DataAssetConfidentiality, DataAssetIntegrity, DataAssetAvailability } from "@components/types/threagileEnums";
import type { TrustBoundary } from "@components/types/threagileComponents";
import { TrustBoundaryType } from "@components/types/threagileEnums";
import type { CommonInformation } from "@components/types/threagileComponents";
import { BusinessCriticality } from "@components/types/threagileEnums";
import type { TechnicalAsset } from "@components/types/threagileComponents";
import { TechnicalAssetType, TechnicalAssetUsage, TechnicalAssetSize, TechnicalAssetMachine, TechnicalAssetEncryption, TechnicalAssetConfidentiality, TechnicalAssetIntegrity, TechnicalAssetAvailability } from "@components/types/threagileEnums";


export const commonInformationStringFields: {
    key: keyof Pick<CommonInformation, "threagile_version" | "title" | "date" | "management_summary_comment">,
    label: string,
    multiline: boolean,
    rows: number
}[] = [
    { key: "threagile_version", label: "Threagile Version", multiline: false, rows: 1 },
    { key: "title", label: "Title", multiline: false, rows: 1 },
    { key: "date", label: "Date", multiline: false, rows: 1 },
    { key: "management_summary_comment", label: "Management Summary Comment", multiline: true, rows: 3 },
] as const;

export const commonInformationEnumFields: {
    key: keyof Pick<CommonInformation, "business_criticality">,
    label: string,
    options: string[]
}[] = [
    { key: "business_criticality", label: "Business Criticality", options: BusinessCriticality },
] as const;

export const commonInformationStringArrayFields: {
    key: keyof Pick<CommonInformation, "questions" | "abuse_cases" | "security_requirements">,
    label: string
}[] = [
    { key: "questions", label: "Questions" },
    { key: "abuse_cases", label: "Abuse Cases" },
    { key: "security_requirements", label: "Security Requirements" },
] as const;

export const commonInformationOverviewFields: {
    key: keyof Pick<CommonInformation, "application_description" | "business_overview" | "technical_overview">,
    label: string,
}[] = [
    { key: "application_description", label: "Application Description" },
    { key: "business_overview", label: "Business Overview" },
    { key: "technical_overview", label: "Technical Overview" },
] as const;

export const communicationLinkStringFields: {
    key: keyof Pick<CommunicationLink, "name" | "description">,
    label: string,
    multiline: boolean,
    rows: number
}[] = [
    { key: "name", label: "Name", multiline: false, rows: 1 },
    { key: "description", label: "Description", multiline: true, rows: 3 },
] as const;

export const communicationLinkEnumFields: {
    key: keyof Pick<CommunicationLink, "protocol" | "authentication" | "authorization" | "usage">,
    label: string,
    value: string | null,
    options: string[],
}[] = [
    { key: "protocol", label: "Protocol", value: null, options: CommunicationLinkProtocol },
    { key: "authentication", label: "Authentication", value: null, options: CommunicationLinkAuthentication },
    { key: "authorization", label: "Authorization", value: null, options: CommunicationLinkAuthorization },
    { key: "usage", label: "Usage", value: null, options: CommunicationLinkUsage },
] as const;

export const communicationLinkBooleanFields: {
    key: keyof Pick<CommunicationLink, "vpn" | "ip_filtered" | "readonly" | "bidirectional" | "diagram_tweak_constraint">,
    label: string,
}[] = [
    { key: "vpn", label: "VPN" },
    { key: "ip_filtered", label: "IP filtered" },
    { key: "readonly", label: "Readonly" },
    { key: "bidirectional", label: "Bidirectional" },
    { key: "diagram_tweak_constraint", label: "Diagram tweak constraint" }
] as const;

export const technicalAssetStringFields: {
    key: keyof Pick<TechnicalAsset, "name" | "id" | "description" | "justification_out_of_scope" | "owner" | "justification_cia_rating">,
    label: string,
    multiline: boolean,
    rows: number
}[] = [
    { key: "name", label: "Name", multiline: false, rows: 1 },
    { key: "id", label: "Id", multiline: false, rows: 1 },
    { key: "description", label: "Description", multiline: true, rows: 3 },
    { key: "justification_out_of_scope", label: "Justification out of scope", multiline: true, rows: 3 },
    { key: "owner", label: "Owner", multiline: false, rows: 1 },
    { key: "justification_cia_rating", label: "Justification CIA rating", multiline: true, rows: 3 },
] as const;

export const technicalAssetEnumFields: {
    key: keyof Pick<TechnicalAsset, "type" | "usage" | "size" | "machine" | "encryption" | "confidentiality" | "integrity" | "availability">,
    label: string,
    value: string | null,
    options: string[],
}[] = [
    { key: "type", label: "Type", value: null, options: TechnicalAssetType },
    { key: "usage", label: "Usage", value: null, options: TechnicalAssetUsage },
    { key: "size", label: "Size", value: null, options: TechnicalAssetSize },
    { key: "machine", label: "Machine", value: null, options: TechnicalAssetMachine },
    { key: "encryption", label: "Encryption", value: null, options: TechnicalAssetEncryption },
    { key: "confidentiality", label: "Confidentiality", value: null, options: TechnicalAssetConfidentiality },
    { key: "integrity", label: "Integrity", value: null, options: TechnicalAssetIntegrity },
    { key: "availability", label: "Availability", value: null, options: TechnicalAssetAvailability },
] as const;

export const technicalAssetBooleanFields: {
    key: keyof Pick<TechnicalAsset, "out_of_scope" | "internet" | "multi_tenant" | "redundant" | "custom_developed_parts" | "used_as_client_by_human">,
    label: string,
}[] = [
    { key: "out_of_scope", label: "Out of scope" },
    { key: "internet", label: "Internet" },
    { key: "multi_tenant", label: "Multi tenant" },
    { key: "redundant", label: "Redundant" },
    { key: "custom_developed_parts", label: "Custom developed parts" },
    { key: "used_as_client_by_human", label: "Used as client by human" },
] as const;

export const trustBoundaryStringFields: {
    key: keyof Pick<TrustBoundary, "name" | "id" | "description">,
    label: string,
    multiline: boolean,
    rows: number
}[] = [
    { key: "name", label: "Name", multiline: false, rows: 1 },
    { key: "id", label: "Id", multiline: false, rows: 1 },
    { key: "description", label: "Description", multiline: true, rows: 3 },
] as const;

export const trustBoundaryEnumFields: {
    key: keyof Pick<TrustBoundary, "type">,
    label: string,
    value: string | null,
    options: string[],
}[] = [
    { key: "type", label: "Type", value: null, options: TrustBoundaryType },
] as const;

export const sharedRuntimesStringFields: {
    key: keyof Pick<SharedRuntimes, "name" | "id" | "description">;
    label: string;
}[] = [
    { key: "name", label: "Name" },
    { key: "id", label: "Id" },
    { key: "description", label: "Description" },
] as const;

export const risksIdentifiedEnumFields: {
    key: keyof Pick<RisksIdentified, "severity" | "exploitation_likelihood" | "exploitation_impact" | "data_breach_probability">;
    label: string;
    options: string[];
}[] = [
    { key: "severity", label: "Severity", options: RisksIdentifiedSeverity },
    { key: "exploitation_likelihood", label: "Exploitation likelihood", options: RisksIdentifiedExploitationLikelihood },
    { key: "exploitation_impact", label: "Exploitation impact", options: RisksIdentifiedExploitationImpact },
    { key: "data_breach_probability", label: "Data breach probability", options: RisksIdentifiedDataBreachProbability },
] as const;

export const risksIdentifiedEnumObjectFields: {
    key: keyof Pick<RisksIdentified, "most_relevant_data_asset" | "most_relevant_technical_asset" | "most_relevant_communication_link" | "most_relevant_trust_boundary" | "most_relevant_shared_runtime">;
    label: string;
}[] = [
    { key: "most_relevant_data_asset", label: "Most Relevant Data Asset" },
    { key: "most_relevant_technical_asset", label: "Most Relevant Technical Asset" },
    { key: "most_relevant_communication_link", label: "Most Relevant Communication Link" },
    { key: "most_relevant_trust_boundary", label: "Most Relevant Trust Boundary" },
    { key: "most_relevant_shared_runtime", label: "Most Relevant Shared Runtimes" },
] as const;

export const individualRiskCategoriesStringFields: {
    key: keyof Pick<IndividualRiskCategories, "name" | "id" | "description" | "impact" | "asvs" | "cheat_sheet" | "action" | "mitigation" | "check" | "detection_logic" | "risk_assessment" | "false_positives">;
    label: string;
}[] = [
    { key: "name", label: "Name" },
    { key: "id", label: "Id" },
    { key: "description", label: "Description" },
    { key: "impact", label: "Impact" },
    { key: "asvs", label: "Asvs" },
    { key: "cheat_sheet", label: "Cheat sheet" },
    { key: "action", label: "Action" },
    { key: "mitigation", label: "Mitigation" },
    { key: "check", label: "Check" },
    { key: "detection_logic", label: "Detection logic" },
    { key: "risk_assessment", label: "Risk assessment" },
    { key: "false_positives", label: "False positives" },
] as const;

export const individualRiskCategoriesEnumFields: {
    key: keyof Pick<IndividualRiskCategories, "function" | "stride">;
    label: string;
    options: string[];
}[] = [
    { key: "function", label: "Function", options: IndividualRiskCategoriesFunction },
    { key: "stride", label: "Stride", options: IndividualRiskCategoriesStride },
] as const;

export const riskTrackingStringFields: {
    key: keyof Pick<RiskTracking, "name" | "justification" | "ticket" | "date" | "checked_by">;
    label: string;
}[] = [
    { key: "name", label: "Name" },
    { key: "justification", label: "Justification" },
    { key: "ticket", label: "Ticket" },
    { key: "date", label: "Date" },
    { key: "checked_by", label: "Checked by" },
] as const;

export const commonDiagramBooleanFields: {
    key: keyof Pick<CommonDiagram, "diagram_tweak_suppress_edge_labels" | "diagram_tweak_layout_left_to_right">,
    label: string,
}[] = [
    { key: "diagram_tweak_suppress_edge_labels", label: "Diagram tweak suppress edge labels" },
    { key: "diagram_tweak_layout_left_to_right", label: "Diagram tweak layout left to right" },
] as const;

export const commonDiagramNumberFields: {
    key: keyof Pick<CommonDiagram, "diagram_tweak_nodesep" | "diagram_tweak_ranksep">,
    label: string,
}[] = [
    { key: "diagram_tweak_nodesep", label: "Diagram tweak nodesep" },
    { key: "diagram_tweak_ranksep", label: "Diagram tweak ranksep" },
] as const;

export const commonDiagramStringArrayFields: {
    key: keyof Pick<CommonDiagram, "diagram_tweak_invisible_connections_between_assets" | "diagram_tweak_same_rank_assets">,
    label: string
}[] = [
    { key: "diagram_tweak_invisible_connections_between_assets", label: "Diagram tweak invisible connections between assets" },
    { key: "diagram_tweak_same_rank_assets", label: "Abuse diagram tweak same rank assets" },
] as const;

export const dataAssetsStringArrayFields: {
    key: keyof Pick<DataAsset, "name" | "id" | "description" | "origin" | "owner" | "justification_cia_rating">
    label: string
}[] = [
    { key: "name", label: "Name" },
    { key: "id", label: "Id" },
    { key: "description", label: "Description" },
    { key: "origin", label: "Origin" },
    { key: "owner", label: "Owner" },
    { key: "justification_cia_rating", label: "Justification cia rating" },
] as const;

export const dataAssetsEnumFields: {
    key: keyof Pick<DataAsset, "usage" | "quantity" | "confidentiality" | "integrity" | "availability">;
    label: string;
    options: string[];
}[] = [
    { key: "usage", label: "Usage", options: DataAssetUsage },
    { key: "quantity", label: "Quantity", options: DataAssetQuantity },
    { key: "confidentiality", label: "Confidentiality", options: DataAssetConfidentiality },
    { key: "integrity", label: "Integrity", options: DataAssetIntegrity },
    { key: "availability", label: "Availability", options: DataAssetAvailability },
] as const;