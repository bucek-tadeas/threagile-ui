/* eslint-disable @typescript-eslint/no-explicit-any */
/*

Helper functions for saving information - collect all the data from the graph

*/

import { Graph, Cell } from "@maxgraph/core";
import type { TechnicalAsset, CommunicationLink, TrustBoundary } from "@components/types/threagileComponents";

export const getVertices = (graph: Graph): Cell[] => {
    const vertices = graph.getChildCells(graph.getDefaultParent(), true, false);
    return vertices;
};

export const getEdges = (graph: Graph): Cell[] => {
    const edges = graph.getChildCells(graph.getDefaultParent(), false, true);
    return edges;
};

export const getAllTechnicalAssets = (graph: Graph | null): TechnicalAsset[] => {
    if (!graph) return [];
    const assets = getVertices(graph)
        .map(v => (v as any).technicalAsset)
        .filter((val): val is TechnicalAsset => !!val);
    return assets;
};

export const getAllTrustBoundaries = (graph: Graph | null): TrustBoundary[] => {
    if (!graph) return [];
    const boundaries = getVertices(graph)
        .map(v => (v as any).trustBoundary)
        .filter((val): val is TrustBoundary => !!val);
    return boundaries;
};

export const getAllCommunicationLinks = (graph: Graph | null): CommunicationLink[] => {
    if (!graph) return [];
    const links = getEdges(graph)
        .map(e => (e as any).communicationLink)
        .filter((val): val is CommunicationLink => !!val);
    return links;
};
