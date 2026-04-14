/*

Left sidebar component for shared runtimes

Has to following fields:
HistoryStringField
    - name
    - id
    - description

TagField
    - tags

MultiSelectTechnicalAssetsField
    - technical_assets_running

*/


import { Box, Button, Accordion, AccordionSummary, AccordionDetails, Typography } from "@mui/material";
import { HistoryManager } from "@features/draw/history/HistoryManager";
import { sharedRuntimesStringFields } from "@features/draw/components/fields/FieldsEnums";
import { HistoryStringField, TagField, MultiSelectTechnicalAssetsField } from "@features/draw/components/fields/FieldsDefinition";
import { useSharedRuntimes } from "@context/ThreatModelContext";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useThreatModel } from "@context/ThreatModelContext";
import { SharedRuntimesRequirements } from "@components/types/threagileComponentsRequirements";


interface Props {
    history: HistoryManager;
}

export const SharedRuntimesSidebarLeft: React.FC<Props> = ({
    history,
}) => {
    const sharedRuntimes = useSharedRuntimes();
    const { technicalAssets } = useThreatModel();

    return (
        <Box
            sx={{
                width: "100%",
                alignSelf: "center",
                [`& .MuiDrawer-paper`]: { width: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" },
                borderRadius: "5px",
                overflow: "hidden",
            }}
        >
            <Box sx={{ p: 2 }}>
                <Button
                    fullWidth
                    variant="contained"
                    onClick={() => {
                        const newRuntime = {
                            _internalId: crypto.randomUUID(),
                            name: crypto.randomUUID().slice(0, 7),
                            id: "",
                            description: "",
                            tags: [],
                            technical_assets_running: [],
                        };

                        history.perform({
                            do: () => sharedRuntimes.addElement(newRuntime),
                            undo: () => sharedRuntimes.deleteElement(newRuntime._internalId),
                        });
                    }}
                >
                    Add Shared Runtime
                </Button>
            </Box>

            <Box sx={{ flexGrow: 1, overflowY: "auto", px: 2 }}>
                {sharedRuntimes.elements.map((asset) => (
                    <Accordion key={asset._internalId}>


                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>{asset.name || "Unnamed Shared Runtime"}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box sx={{ p: 2 }}>
                                {sharedRuntimesStringFields.map(({ key, label }) => (
                                    <HistoryStringField
                                        key={key}
                                        assetId={asset._internalId}
                                        fieldKey={key}
                                        label={label}
                                        value={asset[key] ?? ""}
                                        requirements={SharedRuntimesRequirements}
                                        updateField={sharedRuntimes.updateElementField as any}
                                        history={history}
                                    />
                                ))}

                                <TagField
                                    value={asset?.tags || []}
                                    onChange={(newTags) =>
                                        history.perform({
                                            do: () => sharedRuntimes.updateElementField(asset._internalId, "tags", newTags),
                                            undo: () => sharedRuntimes.updateElementField(asset._internalId, "tags", asset.tags),
                                        })

                                    }
                                />

                                <MultiSelectTechnicalAssetsField
                                    label="Technical Assets Running"
                                    value={asset.technical_assets_running}
                                    options={technicalAssets}
                                    fieldKey="technical_assets_running"
                                    requirements={SharedRuntimesRequirements}
                                    onChange={(newVal) =>
                                        history.perform({
                                            do: () => sharedRuntimes.updateElementField(asset._internalId, "technical_assets_running", newVal),
                                            undo: () => sharedRuntimes.updateElementField(asset._internalId, "technical_assets_running", asset.technical_assets_running),
                                        })
                                    }
                                />

                            </Box>

                            <Button
                                variant="outlined"
                                color="error"
                                onClick={() => {
                                    const removedRuntime = { ...asset };
                                    history.perform({
                                        do: () => sharedRuntimes.deleteElement(asset._internalId),
                                        undo: () => sharedRuntimes.addElement(removedRuntime),
                                    });
                                }}
                                sx={{ mt: 1 }}
                            >
                                Delete
                            </Button>
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Box>
        </Box>
    );
};