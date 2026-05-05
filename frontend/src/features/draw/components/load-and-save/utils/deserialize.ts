/* eslint-disable @typescript-eslint/no-explicit-any */
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

function computeAutoLayout(
    trustBoundaries: DiagramTrustBoundary[],
    technicalAssets: DiagramTechnicalAsset[]
): Record<string, { x: number; y: number }> {
    const positions: Record<string, { x: number; y: number }> = {};
    const ASSET_WIDTH = 140;
    const ASSET_HEIGHT = 80;
    const TB_WIDTH = 300;
    const TB_HEIGHT = 200;
    const GAP_X = 60;
    const GAP_Y = 60;
    const COLS = Math.max(3, Math.ceil(Math.sqrt(trustBoundaries.length + technicalAssets.length)));

    let index = 0;

    trustBoundaries.forEach((tb) => {
        const col = index % COLS;
        const row = Math.floor(index / COLS);
        positions[tb.internalId] = {
            x: col * (TB_WIDTH + GAP_X) + GAP_X,
            y: row * (TB_HEIGHT + GAP_Y) + GAP_Y,
        };
        index++;
    });

    const orphanAssets = technicalAssets.filter(ta => !ta.parentId);
    orphanAssets.forEach((ta) => {
        const col = index % COLS;
        const row = Math.floor(index / COLS);
        positions[ta.internalId] = {
            x: col * (ASSET_WIDTH + GAP_X) + GAP_X,
            y: row * (ASSET_HEIGHT + GAP_Y) + GAP_Y,
        };
        index++;
    });

    trustBoundaries.forEach((tb) => {
        const children = technicalAssets.filter(ta => ta.parentId === tb.internalId);
        children.forEach((ta, childIdx) => {
            const childCol = childIdx % 2;
            const childRow = Math.floor(childIdx / 2);
            positions[ta.internalId] = {
                x: childCol * (ASSET_WIDTH + 20) + 20,
                y: childRow * (ASSET_HEIGHT + 20) + 40,
            };
        });
    });

    return positions;
}

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

    const hasPositions = json.ui?.positions && Object.keys(json.ui.positions).length > 0;
    const positions = hasPositions
        ? json.ui!.positions
        : computeAutoLayout(json.trust_boundaries || [], json.technical_assets || []);

    graph.model.beginUpdate();
    try {
        const dataAssets: DataAsset[] = json.data_assets || [];
        dataAssets.forEach(asset => dataAssetProvider.addElement(asset));

        const commonInformation: CommonInformation = json.common_information || {};
        setCommonInformation(commonInformation);

        const trustBoundaries = json.trust_boundaries || [];
        trustBoundaries.forEach((tb: DiagramTrustBoundary) => {
            const pos = positions[tb.internalId];
            const vertex = TrustBoundaryVertex(graph, pos?.x ?? 0, pos?.y ?? 0, 300, 200, tb.trustBoundary.name);

            (vertex as any).trustBoundary = tb.trustBoundary;
            cellMap[tb.internalId] = vertex;
        });

        const technicalAssets = json.technical_assets || [];
        technicalAssets.forEach((ta: DiagramTechnicalAsset) => {
            const parentCell = ta.parentId ? cellMap[ta.parentId] : parent;
            const pos = positions[ta.internalId];
            const vertex = graph.insertVertex(
                parentCell,
                null,
                ta.technicalAsset.name,
                pos?.x ?? 0,
                pos?.y ?? 0,
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
