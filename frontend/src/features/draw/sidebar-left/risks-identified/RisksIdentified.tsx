/*

Left sidebar component for risks identiifed

Has to following fields:
StringField
    - name

EnumField
    - severity
    - exploitation_likelihood
    - exploitation_impact
    - data_breach_probability

MultiSelectTechnicalAssetsField
    - data_breach_technical_assets

EnumFieldObject
    - most_relevant_data_asset
    - most_relevant_technical_asset
    - most_relevant_communication_link
    - most_relevant_trust_boundary
    - most_relevant_shared_runtime

*/

import { Box } from "@mui/material";
import { HistoryManager } from "@features/draw/history/HistoryManager";
import { StringField, EnumField, EnumFieldObject, MultiSelectTechnicalAssetsField } from "@features/draw/components/fields/FieldsDefinition";
import { risksIdentifiedEnumFields, risksIdentifiedEnumObjectFields } from "@features/draw/components/fields/FieldsEnums";
import { Button, Accordion, AccordionSummary, AccordionDetails, Typography } from "@mui/material";
import { useDataAssets, useRisksIdentified, useSharedRuntimes } from "@context/ThreatModelContext";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useThreatModel } from "@context/ThreatModelContext";

import { RisksIdentifiedRequirements } from "@components/types/threagileComponentsRequirements";
import type { CommunicationLink, DataAsset, SharedRuntimes, TechnicalAsset, TrustBoundary } from "@components/types/threagileComponents";


interface Props {
    history: HistoryManager;
}

export const RisksIdentifiedSidebarLeft: React.FC<Props> = ({
    history,
}) => {
    const risksIdentified = useRisksIdentified();
    const { technicalAssets, communicationLinks, trustBoundaries } = useThreatModel();
    const dataAssets = useDataAssets()
    const sharedRuntimes = useSharedRuntimes()

    return (
        <Box
            sx={{
                width: "100%",
                alignSelf: "center",
                [`& .MuiDrawer-paper`]: { width: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" },
                borderRadius: "5px",
                background: "#121212",
                overflow: "hidden",
            }}
        >
            <Box sx={{ p: 2 }}>
                <Button
                    fullWidth
                    variant="contained"
                    onClick={() => {
                        const newRisk = {
                            _internalId: crypto.randomUUID(),
                            name: "New Risk",
                            severity: null,
                            exploitation_likelihood: null,
                            exploitation_impact: null,
                            data_breach_probability: null,
                            data_breach_technical_assets: [],
                            most_relevant_data_asset: null,
                            most_relevant_technical_asset: null,
                            most_relevant_communication_link: null,
                            most_relevant_trust_boundary: null,
                            most_relevant_shared_runtime: null,
                        };

                        history.perform({
                            do: () => risksIdentified.addElement(newRisk),
                            undo: () => risksIdentified.deleteElement(newRisk._internalId),
                        });
                    }}
                >
                    Add Risk
                </Button>
            </Box>

            <Box sx={{ flexGrow: 1, overflowY: "auto", px: 2 }}>
                {risksIdentified.elements.map((asset) => (
                    <Accordion key={asset._internalId} sx={{ marginBottom: "15px" }}>


                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>{asset.name || "Unnamed Data Asset"}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <StringField
                                label="Name"
                                value={asset.name}
                                fieldKey="name"
                                requirements={RisksIdentifiedRequirements}
                                onChange={(newVal) => {
                                    const oldVal = asset.name;
                                    if (oldVal === newVal) return;
                                    history.perform({
                                        do: () => risksIdentified.updateElementField(asset._internalId, "name", newVal),
                                        undo: () => risksIdentified.updateElementField(asset._internalId, "name", oldVal),
                                    });
                                }}
                            />

                            {risksIdentifiedEnumFields.map(({ key, label, options }) => {
                                type FieldType = typeof asset[typeof key];
                                const currentValue = asset[key] ?? null;

                                return (
                                    <EnumField<FieldType>
                                        key={key}
                                        label={label}
                                        value={currentValue}
                                        options={options as FieldType[]}
                                        fieldKey={key}
                                        requirements={RisksIdentifiedRequirements}
                                        onChange={(newVal) => {
                                            const oldVal = currentValue;
                                            if (oldVal === newVal) return;
                                            history.perform({
                                                do: () => risksIdentified.updateElementField(asset._internalId, key, newVal),
                                                undo: () => risksIdentified.updateElementField(asset._internalId, key, oldVal),
                                            });
                                        }}
                                    />
                                );
                            })}

                            <MultiSelectTechnicalAssetsField
                                label="Data Breach Technical Assets"
                                value={asset.data_breach_technical_assets}
                                options={technicalAssets}
                                fieldKey="data_breach_technical_assets"
                                requirements={RisksIdentifiedRequirements}
                                onChange={(newVal) =>
                                    history.perform({
                                        do: () => risksIdentified.updateElementField(asset._internalId, "data_breach_technical_assets", newVal),
                                        undo: () => risksIdentified.updateElementField(asset._internalId, "data_breach_technical_assets", asset.data_breach_technical_assets),
                                    })
                                }
                            />

                            {risksIdentifiedEnumObjectFields.map(({ key, label }) => {
                                type RiskKey =
                                    | "most_relevant_data_asset"
                                    | "most_relevant_technical_asset"
                                    | "most_relevant_communication_link"
                                    | "most_relevant_trust_boundary"
                                    | "most_relevant_shared_runtime";

                                const optionMap: Record<RiskKey, (DataAsset | TechnicalAsset | CommunicationLink | TrustBoundary | SharedRuntimes)[]> = {
                                    most_relevant_data_asset: dataAssets.elements,
                                    most_relevant_technical_asset: technicalAssets,
                                    most_relevant_communication_link: communicationLinks,
                                    most_relevant_trust_boundary: trustBoundaries,
                                    most_relevant_shared_runtime: sharedRuntimes.elements,
                                } as const;

                                return (
                                    <EnumFieldObject
                                        key={key}
                                        label={label}
                                        value={asset[key]}
                                        options={optionMap[key]}
                                        fieldKey={key}
                                        requirements={RisksIdentifiedRequirements}
                                        onChange={(newVal) =>
                                            history.perform({
                                                do: () => risksIdentified.updateElementField(asset._internalId, key, newVal),
                                                undo: () => risksIdentified.updateElementField(asset._internalId, key, asset.most_relevant_data_asset),
                                            })
                                        }
                                    />
                                );
                            })}

                            <Button
                                variant="outlined"
                                color="error"
                                onClick={() => {
                                    const removedRisk = { ...asset };
                                    history.perform({
                                        do: () => risksIdentified.deleteElement(asset._internalId),
                                        undo: () => risksIdentified.addElement(removedRisk),
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