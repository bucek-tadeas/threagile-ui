/*

Templates to create an empty assets

*/

import type { TechnicalAsset, CommunicationLink, TrustBoundary, CommonInformation, CommonDiagram } from "./threagileComponents";
import type { TechnicalAssetTypeType } from "./threagileEnums";

export function createTechnicalAssetTemplate(type: TechnicalAssetTypeType): TechnicalAsset {
  return {
    _internalId: crypto.randomUUID(),
    name: crypto.randomUUID().slice(0, 7),
    id: "",
    description: "",
    type: type,
    usage: null,
    used_as_client_by_human: false,
    out_of_scope: false,
    justification_out_of_scope: "",
    size: null,
    technologies: [],
    tags: [],
    internet: false,
    machine: null,
    encryption: null,
    owner: "",
    confidentiality: null,
    integrity: null,
    availability: null,
    justification_cia_rating: "",
    multi_tenant: false,
    redundant: false,
    custom_developed_parts: false,
    data_assets_processed: [],
    data_assets_stored: [],
    data_formats_accepted: null,
    communication_links: [],
  };
}

export function createCommunicationLinkTemplate(): CommunicationLink {
  return {
    _internalId: crypto.randomUUID(),
    name: crypto.randomUUID().slice(0, 7),
    target: "",
    description: "",
    protocol: null,
    authentication: null,
    authorization: null,
    tags: [],
    vpn: false,
    ip_filtered: false,
    readonly: false,
    usage: null,
    data_assets_sent: [],
    data_assets_received: [],
    diagram_tweak_weight: 0,
    diagram_tweak_constraint: false,
    bidirectional: false,
  };
}

export function createCommonInformationTemplate(): CommonInformation {
  return {
    threagile_version: "",
    title: "",
    date: "",
    author: {
      name: "",
      contact: "",
      homepage: "",
    },
    contributors: [],
    management_summary_comment: "",
    business_criticality: null,
    application_description: {
      description: "",
      images: [],
    },
    business_overview: {
      description: "",
      images: [],
    },
    technical_overview: {
      description: "",
      images: [],
    },
    questions: [],
    abuse_cases: [],
    security_requirements: [],
  };
}

export function createTrustBoundaryTemplate(): TrustBoundary {
  return {
    _internalId: crypto.randomUUID(),
    name: crypto.randomUUID().slice(0, 7),
    id: "",
    description: "",
    type: null,
    tags: [],
  };
}

export function createCommonDiagramTemplate(): CommonDiagram {
  return {
    diagram_tweak_suppress_edge_labels: null,
    diagram_tweak_layout_left_to_right: null,
    diagram_tweak_edge_layout: null,
    diagram_tweak_nodesep: null,
    diagram_tweak_ranksep: null,
    diagram_tweak_invisible_connections_between_assets: [],
    diagram_tweak_same_rank_assets: [],
  };
}
