/* 

Index page for modelling. The page consists of couple of logical parts:

  - "History manager" which keeps track of changes and implements undo/redo functionality
  - "Selected cell effect" which sets up variables according to which cell (trust boudnary, technical asset, communication link) is selected
  - "Listeners" that listen for key inputs and mouse clicks 
  - "Page layout" with 4 main parts - sidebar left, sidebar right, canvas in the middle and top navigation bar

*/


import React, { useEffect, useRef } from "react";
import { AppBar, Box, CssBaseline, Toolbar, Typography } from "@mui/material";
import { Graph } from "@maxgraph/core";
import "@maxgraph/core/css/common.css";
import { type TrustBoundary, type CommunicationLink, type TechnicalAsset, type CommonInformation, type CommonDiagram } from "@components/types/threagileComponents";
import { TechnicalAssetSidebarRight } from "./sidebar-right/technical-asset/TechnicalAssetSidebarRight";
import { DrawerComponent } from "./components/Drawer";
import { CommunicationLinkSidebarRight } from "./sidebar-right/communication-link/CommunicationLinkSidebarRight";
import { registerGraphListeners } from "./components/GraphListeners";
import { TrustBoundarySidebarRight } from "./sidebar-right/trust-boundary/TrustBoundarySidebarRight";
import { createCommonInformationTemplate, createCommonDiagramTemplate } from "@components/types/threagileTemplate";
import { CommonInformationSidebarRight } from "./sidebar-right/common-information/CommonInformationSidebarRight";
import { HistoryManager } from "./history/HistoryManager";
import { HistoryToolbarButtons } from "./history/HistoryToolbarButtons";
import { LoadAndSave } from "./components/load-and-save/LoadAndSave";
import SidebarLeft from "./sidebar-left/SidebarLeft";
import {
  ThreatModelAssetProvider,
  useDataAssets,
  useIndividualRiskCategories,
  useRisksIdentified,
  useRiskTracking,
  useSharedRuntimes,
} from "@context/ThreatModelContext";
import { getAllTechnicalAssets, getAllTrustBoundaries, getAllCommunicationLinks } from "./sidebar-right/vertices-and-edges-lists/VerticesAndEdgesLists";
import { technicalAssetStyles } from "@components/styles/assetVertexStyles";
import type { TechnicalAssetTypeType } from "@components/types/threagileEnums";
import { deserializeGraph } from "./components/load-and-save/utils/deserialize";
import { useCascadingCleanup } from "./hooks/useCascadingCleanup";

const DrawPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [graph, setGraph] = React.useState<Graph | null>(null);
  const [graphVersion, setGraphVersion] = React.useState(0);

  const [selectedCell, setSelectedCell] = React.useState<any | null>(null);
  const selectedCellRef = useRef<any>(null);

  const [formAssetValues, setFormAssetValues] = React.useState<TechnicalAsset | null>(null);
  const formAssetValuesRef = useRef<TechnicalAsset | null>(null);

  const [formLinkValues, setFormLinkValues] = React.useState<CommunicationLink | null>(null);
  const formLinkValuesRef = useRef<CommunicationLink | null>(null);

  const [formBoundaryValues, setFormBoundaryValues] = React.useState<TrustBoundary | null>(null);
  const formBoundaryValuesRef = useRef<TrustBoundary | null>(null);

  const [commonInformation, setCommonInformation] = React.useState<CommonInformation>(createCommonInformationTemplate());
  const [commonDiagram, setCommonDiagram] = React.useState<CommonDiagram>(createCommonDiagramTemplate());

  const riskTrackingProvider = useRiskTracking();
  const individualRiskCategoriesProvider = useIndividualRiskCategories();
  const sharedRuntimesProvider = useSharedRuntimes();
  const dataAssetProvider = useDataAssets();
  const risksIdentifiedProvider = useRisksIdentified();

  const history = React.useMemo(() => new HistoryManager(50), []);

  useEffect(() => { selectedCellRef.current = selectedCell; }, [selectedCell]);
  useEffect(() => { formAssetValuesRef.current = formAssetValues; }, [formAssetValues]);
  useEffect(() => { formLinkValuesRef.current = formLinkValues; }, [formLinkValues]);
  useEffect(() => { formBoundaryValuesRef.current = formBoundaryValues; }, [formBoundaryValues]);

  useEffect(() => {
    if (selectedCell?.technicalAsset) {
      setFormAssetValues({ ...selectedCell.technicalAsset });
      setFormLinkValues(null);
      setFormBoundaryValues(null);
    } else if (selectedCell?.communicationLink) {
      setFormAssetValues(null);
      setFormLinkValues({ ...selectedCell.communicationLink });
      setFormBoundaryValues(null);
    } else if (selectedCell?.trustBoundary) {
      setFormAssetValues(null);
      setFormLinkValues(null);
      setFormBoundaryValues({ ...selectedCell.trustBoundary });
    } else {
      setFormAssetValues(null);
      setFormLinkValues(null);
      setFormBoundaryValues(null);
    }
  }, [selectedCell]);

  useEffect(() => {
    if (!graph || !selectedCell?.technicalAsset || !formAssetValues) return;

    const vertex = selectedCell;
    const currentType = vertex.technicalAsset.type as TechnicalAssetTypeType;
    const newType = formAssetValues.type as TechnicalAssetTypeType;

    if (currentType !== newType) {
      const newStyle = technicalAssetStyles[newType];
      if (newStyle) {
        graph.model.beginUpdate();
        try {
          Object.entries(newStyle).forEach(([key, value]) => {
            graph.setCellStyles(key as keyof typeof newStyle, value as string, [vertex]);
          });

          vertex.technicalAsset.type = newType;
        } finally {
          graph.model.endUpdate();
        }
      }
    }
  }, [graph, formAssetValues?.type]);

  useEffect(() => {
    if (!graph || !selectedCell?.communicationLink || !formLinkValues) return;

    const edge = selectedCell;
    const isBidirectional = formLinkValues.bidirectional;

    graph.model.beginUpdate();
    try {
      if (isBidirectional) {
        graph.setCellStyles("startArrow", "block", [edge]);
        graph.setCellStyles("endArrow", "block", [edge]);
      } else {
        graph.setCellStyles("startArrow", "none", [edge]);
        graph.setCellStyles("endArrow", "block", [edge]);
      }

      edge.communicationLink.bidirectional = isBidirectional;
    } finally {
      graph.model.endUpdate();
    }
  }, [graph, formLinkValues?.bidirectional]);


  useEffect(() => {
    if (!containerRef.current) return;

    const g = new Graph(containerRef.current);
    setGraph(g);

    const cleanup = registerGraphListeners(
      g,
      containerRef.current,
      selectedCellRef,
      formAssetValuesRef,
      formLinkValuesRef,
      formBoundaryValuesRef,
      setSelectedCell,
      setCommonInformation,
      setGraphVersion,
      setCommonDiagram,
      {
        riskTrackingProvider,
        individualRiskCategoriesProvider,
        sharedRuntimesProvider,
        dataAssetProvider,
        risksIdentifiedProvider,
      },
    );

    return cleanup;
  }, []);

  const technicalAssets = React.useMemo(
    () => getAllTechnicalAssets(graph),
    [graph, graphVersion]
  );
  const communicationLinks = React.useMemo(
    () => getAllCommunicationLinks(graph),
    [graph, graphVersion]
  );
  const trustBoundaries = React.useMemo(
    () => getAllTrustBoundaries(graph),
    [graph, graphVersion]
  );

  useEffect(() => {
    const saved = localStorage.getItem("unsaved-diagram");
    if (saved && graph) {
      try {
        const data = JSON.parse(saved);

        graph.model.beginUpdate();
        try {
          graph.model.clear();
        } finally {
          graph.model.endUpdate();
        }

        riskTrackingProvider.deleteAllElements();
        individualRiskCategoriesProvider.deleteAllElements();
        sharedRuntimesProvider.deleteAllElements();
        dataAssetProvider.deleteAllElements();
        risksIdentifiedProvider.deleteAllElements();

        deserializeGraph(
          graph,
          data,
          setCommonInformation,
          setCommonDiagram,
          {
            riskTrackingProvider,
            individualRiskCategoriesProvider,
            sharedRuntimesProvider,
            dataAssetProvider,
            risksIdentifiedProvider,
          }
        );
        localStorage.removeItem("unsaved-diagram");
      } catch (error) {
        console.error("Failed to restore unsaved diagram:", error);
        localStorage.removeItem("unsaved-diagram");
      }
    }
  }, [
    dataAssetProvider,
    graph,
    individualRiskCategoriesProvider,
    risksIdentifiedProvider,
    riskTrackingProvider,
    sharedRuntimesProvider,
  ]);

  useCascadingCleanup({
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
  });

  return (
    <Box sx={{ display: "flex", height: "90vh" }}>
      <ThreatModelAssetProvider
        value={{
          technicalAssets,
          communicationLinks,
          trustBoundaries,
        }}
      >
        <CssBaseline />
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
              Threat Model Editor
            </Typography>
            <LoadAndSave graph={graph} commonInformation={commonInformation} setCommonInformation={setCommonInformation} common_diagram={commonDiagram} setCommonDiagram={setCommonDiagram} />
            <HistoryToolbarButtons history={history} />
          </Toolbar>
        </AppBar>

        <DrawerComponent
          anchor="left"
        >
          <Toolbar />
          <Box sx={{ position: "relative", height: "100%" }}>
            <SidebarLeft graph={graph} commonDiagramFormValues={commonDiagram} commonDiagramSetFormValues={setCommonDiagram} history={history} />
          </Box>
        </DrawerComponent>

        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />
          <div
            ref={containerRef}
            style={{
              width: "100%",
              height: "100%",
              background: "#f9f9f9",
              border: "1px solid #ccc",
            }}
          />
        </Box>

        <DrawerComponent
          anchor="right"
        >
          <Toolbar />
          {selectedCell?.technicalAsset && (
            <TechnicalAssetSidebarRight
              formValues={formAssetValues}
              setFormValues={setFormAssetValues}
              history={history} />
          )}
          {selectedCell?.communicationLink && (
            <CommunicationLinkSidebarRight
              formValues={formLinkValues}
              setFormValues={setFormLinkValues}
              history={history} />
          )}
          {selectedCell?.trustBoundary && (
            <TrustBoundarySidebarRight
              formValues={formBoundaryValues}
              setFormValues={setFormBoundaryValues}
              history={history} />
          )}
          {!selectedCell && (
            <CommonInformationSidebarRight
              formValues={commonInformation}
              setFormValues={setCommonInformation}
              history={history} />
          )}
        </DrawerComponent>
      </ThreatModelAssetProvider>
    </Box >
  );
};

export default DrawPage;
