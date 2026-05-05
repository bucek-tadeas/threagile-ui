/* eslint-disable @typescript-eslint/no-explicit-any */
/*

Different listeners:

  - "Click listener" that changes context of a selected cell
  - "Add listener" that handles connections between cells (communication links)
  - "Key listener" that listens for the Delete key to be pressed to allow deletion of cells

*/

import { InternalEvent, Graph, ParallelEdgeLayout, EventObject } from "@maxgraph/core";
import { createCommunicationLinkTemplate } from "@components/types/threagileTemplate";
import type { CommunicationLink, TechnicalAsset, TrustBoundary, CommonInformation, CommonDiagram } from "@components/types/threagileComponents";
import { enableTrustBoundaryGrouping } from "@components/VertexAndEdgeInsert";
import type React from "react";
import { deserializeGraph, type DeserializeProviders } from "@features/draw/components/load-and-save/utils/deserialize";
import { validateDiagramFile } from "@features/draw/components/load-and-save/utils/validation";

export function registerGraphListeners(
    g: Graph,
    container: HTMLElement,
    selectedCellRef: React.RefObject<any>,
    formAssetValuesRef: React.RefObject<TechnicalAsset | null>,
    formLinkValuesRef: React.RefObject<CommunicationLink | null>,
    formBoundaryValuesRef: React.RefObject<TrustBoundary | null>,
    setSelectedCell: (cell: any | null) => void,
    setCommonInformation: React.Dispatch<React.SetStateAction<CommonInformation>>,
    setGraphVersion: React.Dispatch<React.SetStateAction<number>>,
    setCommonDiagram: React.Dispatch<React.SetStateAction<CommonDiagram>>,
    providers: DeserializeProviders,
    onError: (message: string, title?: string) => void,
) {
    InternalEvent.disableContextMenu(container);

    g.setPanning(true);
    g.setConnectable(true);
    g.setAllowDanglingEdges(false);
    enableTrustBoundaryGrouping(g);

    const layout = new ParallelEdgeLayout(g);

    g.addListener(InternalEvent.CLICK, (_sender: any, evt: EventObject) => {
        const cell = evt.getProperty("cell");

        setGraphVersion(v => v + 1);

        if (cell !== selectedCellRef.current && selectedCellRef.current) {
            const model = g.model;
            model.beginUpdate();
            try {
                if (formAssetValuesRef.current && selectedCellRef.current.technicalAsset) {
                    selectedCellRef.current.technicalAsset = { ...formAssetValuesRef.current };
                    model.setValue(selectedCellRef.current, formAssetValuesRef.current.name || "");
                } else if (formLinkValuesRef.current && selectedCellRef.current.communicationLink) {
                    selectedCellRef.current.communicationLink = { ...formLinkValuesRef.current };
                    model.setValue(selectedCellRef.current, formLinkValuesRef.current.name || "");
                } else if (formBoundaryValuesRef.current && selectedCellRef.current.trustBoundary) {
                    selectedCellRef.current.trustBoundary = { ...formBoundaryValuesRef.current };
                    model.setValue(selectedCellRef.current, formBoundaryValuesRef.current.name || "");
                }
            } finally {
                model.endUpdate();
            }
        }

        if (cell && cell.isVertex() && (cell as any).technicalAsset) {
            setSelectedCell(cell);
        } else if (cell && cell.isEdge() && (cell as any).communicationLink) {
            setSelectedCell(cell);
        } else if (cell && cell.isVertex() && (cell as any).trustBoundary) {
            setSelectedCell(cell);
        } else {
            setSelectedCell(null);
        }
    });

    g.addListener(InternalEvent.ADD_CELLS, (_sender: any, evt: EventObject) => {
        const cells = evt.getProperty("cells");

        g.batchUpdate(() => {
            layout.execute(g.getDefaultParent());
        });
        cells.forEach((cell: any) => {
            if (cell.isEdge()) {
                const src = cell.getTerminal(true);
                const tgt = cell.getTerminal(false);
                if (!src || !tgt) {
                    g.model.remove(cell);
                } else {
                    cell.communicationLink = createCommunicationLinkTemplate();
                }
            }
        });

        const parent = evt.getProperty("parent");
        if (parent && (parent as any).isTrustBoundary) {
            cells.forEach((cell: any) => {
                if (cell.isVertex() && (cell as any).technicalAsset) {
                    (cell as any).parentBoundaryId = parent.id;
                }
            });
        }
    });

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer?.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const json = JSON.parse(text);
                const result = validateDiagramFile(json);
                if (!result.valid) {
                    console.error("Invalid diagram file:", result.errors);
                    onError("Invalid file:\n" + result.errors.join("\n"), "Invalid File");
                    return;
                }

                deserializeGraph(g, json, setCommonInformation, setCommonDiagram, providers);
            } catch (err) {
                onError("Error loading dropped file: " + (err as Error).message);
            }
        };
        reader.readAsText(file);
        container.classList.remove("drag-over");
    };

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        container.classList.add("drag-over");
    };

    const handleDragLeave = () => {
        container.classList.remove("drag-over");
    };

    container.addEventListener("drop", handleDrop);
    container.addEventListener("dragover", handleDragOver);
    container.addEventListener("dragleave", handleDragLeave);

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Delete" && g.isEnabled()) {
            const cells = g.getSelectionCells();
            if (cells.length > 0) {
                g.model.beginUpdate();
                try {
                    g.removeCells(cells, true);
                    setSelectedCell(null);
                    setGraphVersion(v => v + 1);
                } finally {
                    g.model.endUpdate();
                }
            }
        }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
        window.removeEventListener("keydown", handleKeyDown);
        container.removeEventListener("drop", handleDrop);
        container.removeEventListener("dragover", handleDragOver);
        container.removeEventListener("dragleave", handleDragLeave);
        g.destroy();
    };
}
