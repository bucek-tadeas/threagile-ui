/* eslint-disable @typescript-eslint/no-explicit-any */
/*

Contains all the sections and implements the logic of current section visibility

*/

import { useState } from "react";
import { Box, List, ListItemButton, ListItemText, Divider, Typography, Drawer } from "@mui/material";
import { DataAssetSidebarLeft } from "./data-asset/DataAssetSidebarLeft";
import { AssetAndLinkMenu } from "./asset-and-link-menu/AssetAndLinkMenu";
import { CommonDiagramSidebarLeft } from "./common-diagram/CommonDiagram";
import { RiskTrackingSidebarLeft } from "./risk-tracking/RiskTracking";
import { IndividualRiskCategoriesSidebarLeft } from "./individual-risk-categories/IndividualRiskCategories";
import { SharedRuntimesSidebarLeft } from "./shared-runtimes/SharedRuntimes";
import type { HistoryManager } from "../history/HistoryManager";
import type { CommonDiagram } from "@components/types/threagileComponents";

interface SidebarLeftProps {
    graph: any;
    commonDiagramFormValues: CommonDiagram;
    commonDiagramSetFormValues: React.Dispatch<React.SetStateAction<CommonDiagram>>;
    history: HistoryManager;
}

export default function SidebarLeft({
    graph,
    commonDiagramFormValues,
    commonDiagramSetFormValues,
    history,
}: SidebarLeftProps) {
    const [activeSection, setActiveSection] = useState("dataAssets");

    const sections = [
        { key: "dataAssets", label: "Data Assets", component: <DataAssetSidebarLeft history={history}></DataAssetSidebarLeft> },
        { key: "diagram", label: "Diagram Information", component: <CommonDiagramSidebarLeft formValues={commonDiagramFormValues} setFormValues={commonDiagramSetFormValues} history={history} /> },
        { key: "riskTracking", label: "Risk Tracking", component: <RiskTrackingSidebarLeft history={history} /> },
        { key: "individualRiskCategories", label: "Individual Risk Categories", component: <IndividualRiskCategoriesSidebarLeft history={history} /> },
        { key: "sharedRuntimes", label: "Shared Runtimes", component: <SharedRuntimesSidebarLeft history={history} /> },
    ];

    const currentSection = sections.find((s) => s.key === activeSection)?.component;

    return (
        <Drawer
            variant="permanent"
            sx={{
                [`& .MuiDrawer-paper`]: { width: "15%", boxSizing: "border-box", display: "flex", flexDirection: "column" },
            }}
        >
            <Box sx={{ display: "flex", flexDirection: "column", backgroundColor: "#1e1e1e", color: "#fff" }}>
                <Box
                    sx={{
                        width: "100%",
                        borderRight: "1px solid #333",
                        display: "flex",
                        flexDirection: "column",
                        p: 1.5,
                        bgcolor: "#121212",
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            color: "#b8b8b8",
                            mb: 1,
                            textAlign: "center",
                            fontWeight: 600,
                        }}
                    >
                        Menu
                    </Typography>
                    <Divider sx={{ bgcolor: "#333", mb: 1, marginTop: 3 }} />
                    <List>
                        {sections.map((section) => (
                            <ListItemButton
                                key={section.key}
                                selected={activeSection === section.key}
                                onClick={() => setActiveSection(section.key)}
                                sx={{
                                    borderRadius: 1,
                                    mb: 0.5,
                                    color: activeSection === section.key ? "#fff" : "#b8b8b8",
                                    bgcolor: activeSection === section.key ? "#2e2e2e" : "transparent",
                                    "&:hover": { bgcolor: "#2a2a2a" },
                                }}
                            >
                                <ListItemText primary={section.label} />
                            </ListItemButton>
                        ))}
                    </List>
                </Box>

                {currentSection}

                <Box sx={{ p: 2 }}>
                    <AssetAndLinkMenu graph={graph}></AssetAndLinkMenu>
                </Box>
            </Box>

        </Drawer>
    );

}
