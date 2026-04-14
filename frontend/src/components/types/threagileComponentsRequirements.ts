/*

Basic interfaces according to Threagile requirements

Used both in model validation and gui to check for required/non-required values

*/

export interface FieldRequirements {
    [key: string]: boolean;
}

export const DataAssetRequirements: FieldRequirements = {
    _internalId: true,
    name: true,
    id: true,
    description: true,
    usage: true,
    tags: false,
    origin: false,
    owner: false,
    quantity: true,
    confidentiality: true,
    integrity: true,
    availability: true,
    justification_cia_rating: false,
};

export const CommunicationLinkRequirements: FieldRequirements = {
    _internalId: true,
    name: true,
    target: true,
    description: true,
    protocol: true,
    authentication: true,
    authorization: true,
    tags: false,
    vpn: true,
    ip_filtered: true,
    readonly: true,
    usage: true,
    data_assets_sent: false,
    data_assets_received: false,
    diagram_tweak_weight: false,
    diagram_tweak_constraint: false,
    bidirectional: true,
};

export const TechnicalAssetRequirements: FieldRequirements = {
    _internalId: true,
    name: true,
    id: true,
    description: true,
    type: true,
    usage: true,
    used_as_client_by_human: true,
    out_of_scope: true,
    justification_out_of_scope: false,
    size: true,
    technologies: true,
    tags: false,
    internet: true,
    machine: true,
    encryption: true,
    owner: true,
    confidentiality: true,
    integrity: true,
    availability: true,
    justification_cia_rating: false,
    multi_tenant: true,
    redundant: true,
    custom_developed_parts: true,
    data_assets_processed: false,
    data_assets_stored: false,
    data_formats_accepted: true,
    diagram_tweak_order: false,
    communication_links: true,
};

export const AuthorInformationRequirements: FieldRequirements = {
    name: true,
    contact: true,
    homepage: true,
};

export const CommonInformationRequirements: FieldRequirements = {
    threagile_version: true,
    title: true,
    date: false,
    author: true,
    contributors: false,
    management_summary_comment: false,
    business_criticality: true,
    application_description: false,
    business_overview: false,
    technical_overview: false,
    questions: false,
    abuse_cases: false,
    security_requirements: false,
};

export const TrustBoundaryRequirements: FieldRequirements = {
    _internalId: true,
    name: true,
    id: true,
    description: true,
    type: true,
    tags: false,
};

export const SharedRuntimesRequirements: FieldRequirements = {
    _internalId: true,
    name: true,
    id: true,
    description: true,
    tags: false,
    technical_assets_running: true,
};

export const RisksIdentifiedRequirements: FieldRequirements = {
    _internalId: true,
    name: true,
    severity: true,
    exploitation_likelihood: true,
    exploitation_impact: true,
    data_breach_probability: true,
    data_breach_technical_assets: true,
    most_relevant_data_asset: true,
    most_relevant_technical_asset: true,
    most_relevant_communication_link: true,
    most_relevant_trust_boundary: true,
    most_relevant_shared_runtime: true,
};

export const IndividualRiskCategoriesRequirements: FieldRequirements = {
    _internalId: true,
    name: true,
    id: true,
    description: true,
    impact: true,
    asvs: true,
    cheat_sheet: true,
    action: true,
    mitigation: true,
    check: true,
    function: true,
    stride: true,
    detection_logic: true,
    risk_assessment: true,
    false_positives: true,
    model_failure_possible_reason: true,
    cwe: true,
    risks_identified: true,
};

export const RiskTrackingRequirements: FieldRequirements = {
    _internalId: true,
    name: true,
    status: true,
    justification: true,
    ticket: true,
    date: true,
    checked_by: true,
};

export const CommonDiagramRequirements: FieldRequirements = {
    diagram_tweak_suppress_edge_labels: false,
    diagram_tweak_layout_left_to_right: false,
    diagram_tweak_edge_layout: false,
    diagram_tweak_nodesep: false,
    diagram_tweak_ranksep: false,
    diagram_tweak_invisible_connections_between_assets: false,
    diagram_tweak_same_rank_assets: false,
};