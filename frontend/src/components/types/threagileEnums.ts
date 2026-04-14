/*

Enums based on Threagile's schema.json

*/

function createEnum<T extends string>(...values: T[]) {
    return values;
}

// -------------------- DataAsset --------------------

export const DataAssetUsage = createEnum("business", "devops");
export type DataAssetUsageType = typeof DataAssetUsage[number];

export const DataAssetQuantity = createEnum("very-few", "few", "many", "very-many");
export type DataAssetQuantityType = typeof DataAssetQuantity[number];

export const DataAssetConfidentiality = createEnum(
    "public",
    "internal",
    "restricted",
    "confidential",
    "strictly-confidential"
);
export type DataAssetConfidentialityType = typeof DataAssetConfidentiality[number];

export const DataAssetIntegrity = createEnum(
    "archive",
    "operational",
    "important",
    "critical",
    "mission-critical"
);
export type DataAssetIntegrityType = typeof DataAssetIntegrity[number];

export const DataAssetAvailability = createEnum(
    "archive",
    "operational",
    "important",
    "critical",
    "mission-critical"
);
export type DataAssetAvailabilityType = typeof DataAssetAvailability[number];

// -------------------- TechnicalAsset --------------------

export const TechnicalAssetType = createEnum("external-entity", "process", "datastore");
export type TechnicalAssetTypeType = typeof TechnicalAssetType[number];

export const TechnicalAssetUsage = createEnum("business", "devops");
export type TechnicalAssetUsageType = typeof TechnicalAssetUsage[number];

export const TechnicalAssetSize = createEnum("system", "service", "application", "component");
export type TechnicalAssetSizeType = typeof TechnicalAssetSize[number];

export const TechnicalAssetTechnologies = createEnum(
    "unknown-technology",
    "client-system",
    "browser",
    "desktop",
    "mobile-app",
    "devops-client",
    "web-server",
    "web-application",
    "application-server",
    "database",
    "file-server",
    "local-file-system",
    "erp",
    "cms",
    "web-service-rest",
    "web-service-soap",
    "ejb",
    "search-index",
    "search-engine",
    "service-registry",
    "reverse-proxy",
    "load-balancer",
    "build-pipeline",
    "sourcecode-repository",
    "artifact-registry",
    "code-inspection-platform",
    "monitoring",
    "ldap-server",
    "container-platform",
    "batch-processing",
    "event-listener",
    "identity-provider",
    "identity-store-ldap",
    "identity-store-database",
    "tool",
    "cli",
    "task",
    "function",
    "gateway",
    "iot-device",
    "message-queue",
    "stream-processing",
    "service-mesh",
    "data-lake",
    "report-engine",
    "ai",
    "mail-server",
    "vault",
    "hsm",
    "waf",
    "ids",
    "ips",
    "scheduler",
    "mainframe",
    "block-storage",
    "library"
);
export type TechnicalAssetTechnologyType = typeof TechnicalAssetTechnologies[number];

export const TechnicalAssetMachine = createEnum("physical", "virtual", "container", "serverless");
export type TechnicalAssetMachineType = typeof TechnicalAssetMachine[number];

export const TechnicalAssetEncryption = createEnum(
    "none",
    "transparent",
    "data-with-symmetric-shared-key",
    "data-with-asymmetric-shared-key",
    "data-with-end-user-individual-key"
);
export type TechnicalAssetEncryptionType = typeof TechnicalAssetEncryption[number];

export const TechnicalAssetConfidentiality = createEnum(
    "public",
    "internal",
    "restricted",
    "confidential",
    "strictly-confidential"
);
export type TechnicalAssetConfidentialityType = typeof TechnicalAssetConfidentiality[number];

export const TechnicalAssetIntegrity = createEnum(
    "archive",
    "operational",
    "important",
    "critical",
    "mission-critical"
);
export type TechnicalAssetIntegrityType = typeof TechnicalAssetIntegrity[number];

export const TechnicalAssetAvailability = createEnum(
    "archive",
    "operational",
    "important",
    "critical",
    "mission-critical"
);
export type TechnicalAssetAvailabilityType = typeof TechnicalAssetAvailability[number];

export const TechnicalAssetDataFormat = createEnum(
    "json",
    "xml",
    "serialization",
    "file",
    "csv",
    "yaml"
);
export type TechnicalAssetDataFormatType = typeof TechnicalAssetDataFormat[number];

// -------------------- CommunicationLink --------------------

export const CommunicationLinkProtocol = createEnum(
    "unknown-protocol",
    "http",
    "https",
    "ws",
    "wss",
    "reverse-proxy-web-protocol",
    "reverse-proxy-web-protocol-encrypted",
    "mqtt",
    "jdbc",
    "jdbc-encrypted",
    "odbc",
    "odbc-encrypted",
    "sql-access-protocol",
    "sql-access-protocol-encrypted",
    "nosql-access-protocol",
    "nosql-access-protocol-encrypted",
    "binary",
    "binary-encrypted",
    "text",
    "text-encrypted",
    "ssh",
    "ssh-tunnel",
    "smtp",
    "smtp-encrypted",
    "pop3",
    "pop3-encrypted",
    "imap",
    "imap-encrypted",
    "ftp",
    "ftps",
    "sftp",
    "scp",
    "ldap",
    "ldaps",
    "jms",
    "nfs",
    "smb",
    "smb-encrypted",
    "local-file-access",
    "nrpe",
    "xmpp",
    "iiop",
    "iiop-encrypted",
    "jrmp",
    "jrmp-encrypted",
    "in-process-library-call",
    "inter-process-communication",
    "container-spawning"
);
export type CommunicationLinkProtocolType = typeof CommunicationLinkProtocol[number];

export const CommunicationLinkAuthentication = createEnum(
    "none",
    "credentials",
    "session-id",
    "token",
    "client-certificate",
    "two-factor",
    "externalized"
);
export type CommunicationLinkAuthenticationType = typeof CommunicationLinkAuthentication[number];

export const CommunicationLinkAuthorization = createEnum(
    "none",
    "technical-user",
    "end-user-identity-propagation"
);
export type CommunicationLinkAuthorizationType = typeof CommunicationLinkAuthorization[number];

export const CommunicationLinkUsage = createEnum("business", "devops");
export type CommunicationLinkUsageType = typeof CommunicationLinkUsage[number];

// -------------------- BusinessCriticality --------------------

export const BusinessCriticality = createEnum("archive", "operational", "important", "critical", "mission-critical");
export type BusinessCriticalityType = typeof BusinessCriticality[number];

// -------------------- TrustBoundary --------------------

export const TrustBoundaryType = createEnum(
    "network-on-prem",
    "network-dedicated-hoster",
    "network-virtual-lan",
    "network-cloud-provider",
    "network-cloud-security-group",
    "network-policy-namespace-isolation",
    "execution-environment");
export type TrustBoundaryTypeType = typeof TrustBoundaryType[number];

// -------------------- RisksIdentified --------------------

export const RisksIdentifiedSeverity = createEnum(
    "low",
    "medium",
    "elevated",
    "high",
    "critical"
)
export type RisksIdentifiedSeverityType = typeof RisksIdentifiedSeverity[number];

export const RisksIdentifiedExploitationLikelihood = createEnum(
    "unlikely",
    "likely",
    "very-likely",
    "frequent"
)
export type RisksIdentifiedExploitationLikelihoodType = typeof RisksIdentifiedExploitationLikelihood[number];

export const RisksIdentifiedExploitationImpact = createEnum(
    "low",
    "medium",
    "high",
    "very-high"
)
export type RisksIdentifiedExploitationImpactType = typeof RisksIdentifiedExploitationImpact[number];

export const RisksIdentifiedDataBreachProbability = createEnum(
    "improbable",
    "possible",
    "probable"
)
export type RisksIdentifiedDataBreachProbabilityType = typeof RisksIdentifiedDataBreachProbability[number];

// -------------------- IndividualRiskCategories --------------------

export const IndividualRiskCategoriesFunction = createEnum(
    "business-side",
    "architecture",
    "development",
    "operations"
)
export type IndividualRiskCategoriesFunctionType = typeof IndividualRiskCategoriesFunction[number];

export const IndividualRiskCategoriesStride = createEnum(
    "spoofing",
    "tampering",
    "repudiation",
    "information-disclosure",
    "denial-of-service",
    "elevation-of-privilege"
)
export type IndividualRiskCategoriesStrideType = typeof IndividualRiskCategoriesStride[number];

// -------------------- RiskTracking --------------------

export const RiskTrackingStatus = createEnum(
    "unchecked",
    "in-discussion",
    "accepted",
    "in-progress",
    "mitigated",
    "false-positive"
)
export type RiskTrackingStatusType = typeof RiskTrackingStatus[number];

// -------------------- CommonDiagram --------------------

export const CommonDiagramDiagramTweakEgdeLayout = createEnum(
    "",
    "ortho",
    "spline",
    "polyline",
    "false",
    "curved"
)
export type CommonDiagramDiagramTweakEgdeLayoutType = typeof CommonDiagramDiagramTweakEgdeLayout[number];