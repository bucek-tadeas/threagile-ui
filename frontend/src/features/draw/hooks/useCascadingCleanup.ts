import { useEffect } from "react";
import type { Graph } from "@maxgraph/core";
import type { TechnicalAsset, CommunicationLink } from "@components/types/threagileComponents";
import {
    useDataAssets,
    useRisksIdentified,
    useSharedRuntimes,
} from "@context/ThreatModelContext";
import { getVertices, getEdges } from "../sidebar-right/vertices-and-edges-lists/VerticesAndEdgesLists";

interface UseCascadingCleanupParams {
    graph: Graph | null;
    technicalAssets: TechnicalAsset[];
    communicationLinks: CommunicationLink[];
    trustBoundaries: { _internalId: string }[];
    formAssetValues: TechnicalAsset | null;
    setFormAssetValues: React.Dispatch<React.SetStateAction<TechnicalAsset | null>>;
    formLinkValues: CommunicationLink | null;
    setFormLinkValues: React.Dispatch<React.SetStateAction<CommunicationLink | null>>;
    dataAssetProvider: ReturnType<typeof useDataAssets>;
    sharedRuntimesProvider: ReturnType<typeof useSharedRuntimes>;
    risksIdentifiedProvider: ReturnType<typeof useRisksIdentified>;
}

export function useCascadingCleanup({
    graph,
    technicalAssets,
    communicationLinks,
    trustBoundaries,
    formAssetValues,
    setFormAssetValues,
    formLinkValues,
    setFormLinkValues,
    dataAssetProvider,
    sharedRuntimesProvider,
    risksIdentifiedProvider,
}: UseCascadingCleanupParams) {

    // When a DataAsset is deleted, clean references from TechnicalAssets, CommunicationLinks, and RisksIdentified
    useEffect(() => {
        const dataAssetIds = new Set(dataAssetProvider.elements.map(e => e._internalId));

        if (formAssetValues) {
            const dap = formAssetValues.data_assets_processed;
            const das = formAssetValues.data_assets_stored;
            const filteredProcessed = dap?.filter(d => dataAssetIds.has(d._internalId)) ?? null;
            const filteredStored = das?.filter(d => dataAssetIds.has(d._internalId)) ?? null;
            if ((filteredProcessed?.length ?? 0) !== (dap?.length ?? 0) ||
                (filteredStored?.length ?? 0) !== (das?.length ?? 0)) {
                setFormAssetValues(prev => prev ? {
                    ...prev,
                    data_assets_processed: filteredProcessed,
                    data_assets_stored: filteredStored,
                } : null);
            }
        }

        if (formLinkValues) {
            const sent = formLinkValues.data_assets_sent;
            const received = formLinkValues.data_assets_received;
            const filteredSent = sent?.filter(d => dataAssetIds.has(d._internalId)) ?? null;
            const filteredReceived = received?.filter(d => dataAssetIds.has(d._internalId)) ?? null;
            if ((filteredSent?.length ?? 0) !== (sent?.length ?? 0) ||
                (filteredReceived?.length ?? 0) !== (received?.length ?? 0)) {
                setFormLinkValues(prev => prev ? {
                    ...prev,
                    data_assets_sent: filteredSent,
                    data_assets_received: filteredReceived,
                } : null);
            }
        }

        if (graph) {
            getVertices(graph).forEach(v => {
                const ta = (v as any).technicalAsset as TechnicalAsset | undefined;
                if (ta) {
                    if (ta.data_assets_processed) {
                        ta.data_assets_processed = ta.data_assets_processed.filter(d => dataAssetIds.has(d._internalId));
                    }
                    if (ta.data_assets_stored) {
                        ta.data_assets_stored = ta.data_assets_stored.filter(d => dataAssetIds.has(d._internalId));
                    }
                }
            });
            getEdges(graph).forEach(e => {
                const cl = (e as any).communicationLink as CommunicationLink | undefined;
                if (cl) {
                    if (cl.data_assets_sent) {
                        cl.data_assets_sent = cl.data_assets_sent.filter(d => dataAssetIds.has(d._internalId));
                    }
                    if (cl.data_assets_received) {
                        cl.data_assets_received = cl.data_assets_received.filter(d => dataAssetIds.has(d._internalId));
                    }
                }
            });
        }

        risksIdentifiedProvider.elements.forEach(risk => {
            if (risk.most_relevant_data_asset && !dataAssetIds.has(risk.most_relevant_data_asset._internalId)) {
                risksIdentifiedProvider.updateElementField(risk._internalId, 'most_relevant_data_asset', null);
            }
        });
    }, [dataAssetProvider.elements]);

    // When a TechnicalAsset is deleted, clean references from SharedRuntimes and RisksIdentified
    useEffect(() => {
        const techAssetIds = new Set(technicalAssets.map(a => a._internalId));

        sharedRuntimesProvider.elements.forEach(sr => {
            const filtered = sr.technical_assets_running.filter(ta => techAssetIds.has(ta._internalId));
            if (filtered.length !== sr.technical_assets_running.length) {
                sharedRuntimesProvider.updateElementField(sr._internalId, 'technical_assets_running', filtered);
            }
        });

        risksIdentifiedProvider.elements.forEach(risk => {
            const filteredBreachAssets = risk.data_breach_technical_assets.filter(ta => techAssetIds.has(ta._internalId));
            if (filteredBreachAssets.length !== risk.data_breach_technical_assets.length) {
                risksIdentifiedProvider.updateElementField(risk._internalId, 'data_breach_technical_assets', filteredBreachAssets);
            }
            if (risk.most_relevant_technical_asset && !techAssetIds.has(risk.most_relevant_technical_asset._internalId)) {
                risksIdentifiedProvider.updateElementField(risk._internalId, 'most_relevant_technical_asset', null);
            }
        });
    }, [technicalAssets]);

    // When a CommunicationLink is deleted, clean references from RisksIdentified
    useEffect(() => {
        const linkIds = new Set(communicationLinks.map(l => l._internalId));

        risksIdentifiedProvider.elements.forEach(risk => {
            if (risk.most_relevant_communication_link && !linkIds.has(risk.most_relevant_communication_link._internalId)) {
                risksIdentifiedProvider.updateElementField(risk._internalId, 'most_relevant_communication_link', null);
            }
        });
    }, [communicationLinks]);

    // When a TrustBoundary is deleted, clean references from RisksIdentified
    useEffect(() => {
        const boundaryIds = new Set(trustBoundaries.map(b => b._internalId));

        risksIdentifiedProvider.elements.forEach(risk => {
            if (risk.most_relevant_trust_boundary && !boundaryIds.has(risk.most_relevant_trust_boundary._internalId)) {
                risksIdentifiedProvider.updateElementField(risk._internalId, 'most_relevant_trust_boundary', null);
            }
        });
    }, [trustBoundaries]);

    // When a SharedRuntime is deleted, clean references from RisksIdentified
    useEffect(() => {
        const runtimeIds = new Set(sharedRuntimesProvider.elements.map(sr => sr._internalId));

        risksIdentifiedProvider.elements.forEach(risk => {
            if (risk.most_relevant_shared_runtime && !runtimeIds.has(risk.most_relevant_shared_runtime._internalId)) {
                risksIdentifiedProvider.updateElementField(risk._internalId, 'most_relevant_shared_runtime', null);
            }
        });
    }, [sharedRuntimesProvider.elements]);
}
