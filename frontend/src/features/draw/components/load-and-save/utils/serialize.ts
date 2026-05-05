/* eslint-disable @typescript-eslint/no-explicit-any */
/*

Serialization of the model in .json format - used for Save and Save As

*/

import { Graph } from "@maxgraph/core";
import type { CommonDiagram, CommonInformation } from "@components/types/threagileComponents";
import type { DiagramTrustBoundary, DiagramTechnicalAsset, DiagramCommunicationLink, DiagramFile } from "./diagramInterface";
import { useDataAssets, useIndividualRiskCategories, useRisksIdentified, useRiskTracking, useSharedRuntimes } from "@context/ThreatModelContext";

function collectCells(graph: Graph, parent: any, technical_assets: DiagramTechnicalAsset[], trust_boundaries: DiagramTrustBoundary[], communication_links: DiagramCommunicationLink[], ui: any) {
    const cells = graph.getChildCells(parent, true, true);

    cells.forEach((cell: any) => {
        if (cell.isVertex() && cell.technicalAsset) {
            technical_assets.push({
                technicalAsset: { ...cell.technicalAsset },
                internalId: cell.id,
                parentId: cell.parent?.id ?? null,
            });
            ui.positions[`${cell.id}`] = { x: cell.geometry.x, y: cell.geometry.y };
        } else if (cell.isVertex() && cell.trustBoundary) {
            trust_boundaries.push({
                trustBoundary: { ...cell.trustBoundary },
                internalId: cell.id,
                parentId: cell.parent?.id ?? null,
            });
            ui.positions[`${cell.id}`] = { x: cell.geometry.x, y: cell.geometry.y };
            collectCells(graph, cell, technical_assets, trust_boundaries, communication_links, ui);
        } else if (cell.isEdge() && cell.communicationLink) {
            const source = cell.getTerminal(true);
            const target = cell.getTerminal(false);
            communication_links.push({
                communicationLink: { ...cell.communicationLink },
                sourceID: source ? source.id : "",
                targetID: target ? target.id : "",
            });
        }
    });
}

export function serializeGraph(
    graph: Graph,
    commonInformation: CommonInformation,
    common_diagram: CommonDiagram,
    providers: {
        riskTrackingProvider: ReturnType<typeof useRiskTracking>,
        individualRiskCategoriesProvider: ReturnType<typeof useIndividualRiskCategories>,
        sharedRuntimesProvider: ReturnType<typeof useSharedRuntimes>,
        dataAssetProvider: ReturnType<typeof useDataAssets>,
        risksIdentifiedProvider: ReturnType<typeof useRisksIdentified>,
    }
): DiagramFile {
    const { riskTrackingProvider, individualRiskCategoriesProvider, sharedRuntimesProvider, dataAssetProvider, risksIdentifiedProvider } = providers;

    if (!graph) throw new Error("Graph instance not available");

    const technical_assets: DiagramTechnicalAsset[] = [];
    const communication_links: DiagramCommunicationLink[] = [];
    const trust_boundaries: DiagramTrustBoundary[] = [];

    const parent = graph.getDefaultParent();
    const ui = {
        positions: {} as Record<string, { x: number; y: number }>,
        zoom: graph.view.scale,
        pan: { x: graph.view.translate.x, y: graph.view.translate.y },
    };

    collectCells(graph, parent, technical_assets, trust_boundaries, communication_links, ui);

    return {
        technical_assets,
        communication_links,
        trust_boundaries,
        common_information: commonInformation,
        common_diagram,
        risk_tracking: riskTrackingProvider.elements,
        individual_risk_categories: individualRiskCategoriesProvider.elements,
        shared_runtimes: sharedRuntimesProvider.elements,
        data_assets: dataAssetProvider.elements,
        risks_identified: risksIdentifiedProvider.elements,
        ui,
    };
}
