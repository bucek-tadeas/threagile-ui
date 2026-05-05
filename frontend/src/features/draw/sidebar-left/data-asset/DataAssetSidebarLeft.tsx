/* eslint-disable @typescript-eslint/no-explicit-any */
/*

Left sidebar component for data assets

Has to following fields:
HistoryStringField
    - name
    - id
    - description
    - origin
    - owner
    - justification_cia_rating

EnumField
    - usage
    - quantity
    - confidentiality
    - integrity
    - availability

TagField
    - tags

*/

import { Box, Button, Accordion, AccordionSummary, Typography, AccordionDetails } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useDataAssets } from "@context/ThreatModelContext";
import { TagField } from "@features/draw/components/fields/FieldsDefinition";
import { dataAssetsStringArrayFields, dataAssetsEnumFields } from "@features/draw/components/fields/FieldsEnums";
import { HistoryStringField, EnumField } from "@features/draw/components/fields/FieldsDefinition";
import { HistoryManager } from "@features/draw/history/HistoryManager";
import { DataAssetRequirements } from "@components/types/threagileComponentsRequirements";

interface Props {
    history: HistoryManager;
}

export const DataAssetSidebarLeft: React.FC<Props> = ({ history }) => {
    const dataAssets = useDataAssets();

    return (
        <Box
            sx={{
                width: "100%",
                alignSelf: "center",
                [`& .MuiDrawer-paper`]: { width: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" },
            }}
        >
            <Box sx={{ p: 2 }}>
                <Button
                    fullWidth
                    variant="contained"
                    onClick={() => {
                        const newAsset = {
                            _internalId: crypto.randomUUID(),
                            id: "",
                            name: crypto.randomUUID().slice(0, 8),
                            description: "",
                            usage: null,
                            origin: "",
                            owner: "",
                            quantity: null,
                            confidentiality: null,
                            integrity: null,
                            availability: null,
                            justification_cia_rating: "",
                        };

                        history.perform({
                            do: () => dataAssets.addElement(newAsset),
                            undo: () => dataAssets.deleteElement(newAsset._internalId),
                        });
                    }}
                >
                    Add Data Asset
                </Button>
            </Box>

            <Box sx={{ flexGrow: 1, overflowY: "auto", px: 2 }}>
                {dataAssets.elements.map((asset) => (
                    <Accordion key={asset._internalId}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>{asset.name || "Unnamed Data Asset"}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            {dataAssetsStringArrayFields.map(({ key, label }) => (
                                <HistoryStringField
                                    key={key}
                                    assetId={asset._internalId}
                                    fieldKey={key}
                                    requirements={DataAssetRequirements}
                                    label={label}
                                    value={asset[key] ?? ""}
                                    updateField={dataAssets.updateElementField as any}
                                    history={history}
                                />
                            ))}

                            {dataAssetsEnumFields.map(({ key, label, options }) => {
                                type FieldType = typeof asset[typeof key];
                                const currentValue = asset[key] ?? null;

                                return (
                                    <EnumField<FieldType>
                                        key={key}
                                        label={label}
                                        value={currentValue}
                                        fieldKey={key}
                                        requirements={DataAssetRequirements}
                                        options={options as FieldType[]}
                                        onChange={(newVal) => {
                                            const oldVal = currentValue;
                                            if (oldVal === newVal) return;
                                            history.perform({
                                                do: () => dataAssets.updateElementField(asset._internalId, key, newVal),
                                                undo: () => dataAssets.updateElementField(asset._internalId, key, oldVal),
                                            });
                                        }}
                                    />
                                );
                            })}

                            <TagField
                                value={asset.tags || []}
                                onChange={(newTags) =>
                                    history.perform({
                                        do: () => dataAssets.updateElementField(asset._internalId, "tags", newTags),
                                        undo: () => dataAssets.updateElementField(asset._internalId, "tags", asset.tags),
                                    })
                                }
                            />

                            <Button
                                variant="outlined"
                                color="error"
                                onClick={() => {
                                    const removedAsset = { ...asset };
                                    history.perform({
                                        do: () => dataAssets.deleteElement(asset._internalId),
                                        undo: () => dataAssets.addElement(removedAsset),
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
