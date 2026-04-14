/*

Deserialization of json file in the UI - used for load

*/

import { Graph, Cell } from "@maxgraph/core";
import type {
    DiagramFile,
    DiagramTrustBoundary,
    DiagramTechnicalAsset,
    DiagramCommunicationLink,
} from "./diagramInterface";
import type { CommonDiagram, CommonInformation, DataAsset, IndividualRiskCategories, RisksIdentified, RiskTracking, SharedRuntimes } from "@components/types/threagileComponents";
import { TrustBoundaryVertex } from "@components/VertexAndEdgeInsert";
import { technicalAssetStyles } from "@components/styles/assetVertexStyles";
import type React from "react";
import { useDataAssets, useIndividualRiskCategories, useRisksIdentified, useRiskTracking, useSharedRuntimes } from "@context/ThreatModelContext";

export type DeserializeProviders = {
    riskTrackingProvider: ReturnType<typeof useRiskTracking>,
    individualRiskCategoriesProvider: ReturnType<typeof useIndividualRiskCategories>,
    sharedRuntimesProvider: ReturnType<typeof useSharedRuntimes>,
    dataAssetProvider: ReturnType<typeof useDataAssets>,
    risksIdentifiedProvider: ReturnType<typeof useRisksIdentified>,
};

export function deserializeGraph(
    graph: Graph,
    json: DiagramFile,
    setCommonInformation: React.Dispatch<React.SetStateAction<CommonInformation>>,
    setCommonDiagram: React.Dispatch<React.SetStateAction<CommonDiagram>>,
    providers: DeserializeProviders,
) {
    if (!graph) throw new Error("Graph instance not available");
    if (!json) throw new Error("No data provided");

    const { riskTrackingProvider, individualRiskCategoriesProvider, sharedRuntimesProvider, dataAssetProvider, risksIdentifiedProvider } = providers;

    const parent = graph.getDefaultParent();
    const cellMap: Record<string, Cell> = {};

    graph.model.beginUpdate();
    try {
        const dataAssets: DataAsset[] = json.data_assets || [];
        dataAssets.forEach(asset => dataAssetProvider.addElement(asset));

        const commonInformation: CommonInformation = json.common_information || {};
        setCommonInformation(commonInformation);

        const trustBoundaries = json.trust_boundaries || [];
        trustBoundaries.forEach((tb: DiagramTrustBoundary) => {
            const vertex = TrustBoundaryVertex(graph, json.ui?.positions[tb.internalId].x, json.ui?.positions[tb.internalId].y, 300, 200, tb.trustBoundary.name);

            (vertex as any).trustBoundary = tb.trustBoundary;
            cellMap[tb.internalId] = vertex;
        });

        const technicalAssets = json.technical_assets || [];
        technicalAssets.forEach((ta: DiagramTechnicalAsset) => {
            const parentCell = ta.parentId ? cellMap[ta.parentId] : parent;
            const vertex = graph.insertVertex(
                parentCell,
                null,
                ta.technicalAsset.name,
                json.ui?.positions[ta.internalId].x || 0,
                json.ui?.positions[ta.internalId].y || 0,
                140,
                80,
                ta.technicalAsset.type ? technicalAssetStyles[ta.technicalAsset.type] : undefined,
            );
            (vertex as any).technicalAsset = ta.technicalAsset
            cellMap[ta.internalId] = vertex;
        });

        const communicationLinks = json.communication_links || [];
        communicationLinks.forEach((cl: DiagramCommunicationLink) => {
            const source = cellMap[cl.sourceID];
            const target = cellMap[cl.targetID];
            if (!source || !target) return;

            const vertex = graph.insertEdge(
                parent,
                undefined,
                cl.communicationLink.name,
                source,
                target,
            );

            if (cl.communicationLink.bidirectional) {
                graph.setCellStyles("startArrow", "block", [vertex]);
                graph.setCellStyles("endArrow", "block", [vertex]);
            } else {
                graph.setCellStyles("startArrow", "none", [vertex]);
                graph.setCellStyles("endArrow", "block", [vertex]);
            }

            (vertex as any).communicationLink = cl.communicationLink;
            return vertex;
        });

        const diagramInformation: CommonDiagram = json.common_diagram || {};
        setCommonDiagram(diagramInformation);

        const riskTracking: RiskTracking[] = json.risk_tracking ?? [];
        riskTracking.forEach((risk) => {
            riskTrackingProvider.addElement(risk);
        })

        const individualRiskCategories: IndividualRiskCategories[] = json.individual_risk_categories ?? [];
        individualRiskCategories.forEach((category) => {
            individualRiskCategoriesProvider.addElement(category);
        })

        const risksIdentified: RisksIdentified[] = json.risks_identified ?? [];
        risksIdentified.forEach(riskIdentified => {
            risksIdentifiedProvider.addElement(riskIdentified);
        })

        const sharedRuntimes: SharedRuntimes[] = json.shared_runtimes ?? [];
        sharedRuntimes.forEach(sharedRuntime => {
            sharedRuntimesProvider.addElement(sharedRuntime);
        });


    } finally {
        graph.model.endUpdate();
    }
}
