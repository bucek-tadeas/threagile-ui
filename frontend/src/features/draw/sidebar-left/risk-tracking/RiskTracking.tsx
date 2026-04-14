/*

Left sidebar component for risk tracking

Has to following fields:
HistoryStringField
    - justification
    - ticket
    - date
    - checked_by

EnumField
    - status
    
*/

import { Box, Button, Accordion, AccordionDetails, AccordionSummary, Typography } from "@mui/material";
import { HistoryManager } from "@features/draw/history/HistoryManager";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { riskTrackingStringFields } from "@features/draw/components/fields/FieldsEnums";
import { EnumField, HistoryStringField } from "@features/draw/components/fields/FieldsDefinition";
import { type RiskTrackingStatusType, RiskTrackingStatus } from "@components/types/threagileEnums";
import { RiskTrackingRequirements } from "@components/types/threagileComponentsRequirements";
import { useRiskTracking } from "@context/ThreatModelContext";


interface Props {
    history: HistoryManager;
}

export const RiskTrackingSidebarLeft: React.FC<Props> = ({
    history,
}) => {
    const riskTracking = useRiskTracking()

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ p: 2 }}>
                <Button
                    fullWidth
                    variant="contained"
                    onClick={() => {
                        const newRisk = {
                            _internalId: crypto.randomUUID(),
                            name: crypto.randomUUID().slice(0, 7),
                            status: null,
                            justification: "",
                            ticket: "",
                            date: "",
                            checked_by: "",
                        };

                        history.perform({
                            do: () => riskTracking.addElement(newRisk),
                            undo: () => riskTracking.deleteElement(newRisk._internalId),
                        });
                    }}
                >
                    Add Risk Tracking
                </Button>
            </Box>

            <Box sx={{ flexGrow: 1, overflowY: "auto", px: 2 }}>
                {riskTracking.elements.map((asset) => (
                    <Accordion key={asset._internalId}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>{asset.name || "Unnamed Risk"}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>

                            {riskTrackingStringFields.map(({ key, label }) => {
                                return (
                                    <HistoryStringField
                                        key={key}
                                        label={label}
                                        value={asset[key] ?? ""}
                                        fieldKey={key}
                                        assetId={asset._internalId}
                                        requirements={RiskTrackingRequirements}
                                        updateField={riskTracking.updateElementField as any}
                                        history={history}
                                    />
                                );
                            })}

                            <EnumField<RiskTrackingStatusType | null>
                                label="Status"
                                value={asset.status}
                                options={RiskTrackingStatus}
                                fieldKey="status"
                                requirements={RiskTrackingRequirements}
                                onChange={(newVal) => {
                                    const oldVal = asset.status;
                                    if (oldVal === newVal) return;
                                    history.perform({
                                        do: () => riskTracking.updateElementField(asset._internalId, "status", newVal),
                                        undo: () => riskTracking.updateElementField(asset._internalId, "status", oldVal),
                                    });
                                }}
                            />
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={() => {
                                    const removedRisk = { ...asset };
                                    history.perform({
                                        do: () => riskTracking.deleteElement(asset._internalId),
                                        undo: () => riskTracking.addElement(removedRisk),
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
        </Box >
    );
};