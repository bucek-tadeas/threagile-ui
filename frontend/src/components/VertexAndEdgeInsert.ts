/* eslint-disable @typescript-eslint/no-explicit-any */
/*

3 functions that insert technical asset/communication link/trust boundary in the graph as either vertex/edge/vertex respectively

1 helper function for enabling group of vertices in the trust boudaries

*/


import { Graph } from "@maxgraph/core";
import { createTechnicalAssetTemplate } from "./types/threagileTemplate";
import type { TechnicalAssetTypeType } from "./types/threagileEnums";
import type { TechnicalAsset } from "./types/threagileComponents";
import { technicalAssetStyles } from "./styles/assetVertexStyles";
import type { CellStyle } from "@maxgraph/core";
import type { TrustBoundary } from "./types/threagileComponents";
import { createTrustBoundaryTemplate } from "./types/threagileTemplate";

export const TechnicalAssetVertex = (type: TechnicalAssetTypeType, graph: Graph, x = 0, y = 0) => {
    const parent = graph.getDefaultParent();

    const asset: TechnicalAsset = createTechnicalAssetTemplate(type);
    asset.name = crypto.randomUUID().slice(0, 8);

    const vertex = graph.insertVertex(
        parent,
        undefined,
        asset.name,
        x,
        y,
        140,
        80,
        technicalAssetStyles[type],
    );

    (vertex as any).technicalAsset = asset;
    return vertex;
}

export const TrustBoundaryVertex = (
    graph: Graph,
    x = 0,
    y = 0,
    w = 300,
    h = 200,
    name?: string,
) => {
    const parent = graph.getDefaultParent();

    const boundary: TrustBoundary = createTrustBoundaryTemplate();
    if (name) boundary.name = name;

    const style: CellStyle = {
        fillColor: "#f5f5f5",
        strokeColor: "#999999",
        dashed: true,
        fontStyle: 1,
        align: "center",
        verticalAlign: "top",
    };

    const vertex = graph.insertVertex(
        parent,
        undefined,
        boundary.name,
        x,
        y,
        w,
        h,
        style
    );

    (vertex as any).isTrustBoundary = true;
    (vertex as any).isGroup = true;
    (vertex as any).trustBoundary = boundary;

    vertex.setConnectable(false);

    return vertex;
};

export const enableTrustBoundaryGrouping = (graph: Graph) => {
    graph.setDropEnabled(true);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    graph.isValidDropTarget = (cell, _cells, _evt) => {
        return !!(cell && (cell as any).isTrustBoundary);
    };

    graph.constrainChildren = true;
    graph.extendParentsOnAdd = true;
    graph.extendParents = true;
    graph.swimlaneNesting = true;
};
