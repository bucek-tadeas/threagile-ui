/*

Left sidebar component for individual risk categories - also contains risks identified

Has to following fields:
StringField
    - id
    - description
    - impact
    - asvs
    - cheat_sheet
    - action
    - mitigation
    - check
    - detection_logic
    - risk_assessment
    - false_positives
    - model_failure_possible_reason

EnumField
    - function
    - stride

NumberField
    - cwe

*/

import { Box, Button, Accordion, AccordionDetails, AccordionSummary, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { HistoryManager } from "@features/draw/history/HistoryManager";
import { individualRiskCategoriesEnumFields, individualRiskCategoriesStringFields } from "@features/draw/components/fields/FieldsEnums";
import { StringField, EnumField, NumberField, BooleanField } from "@features/draw/components/fields/FieldsDefinition";
import { RisksIdentifiedSidebarLeft } from "../risks-identified/RisksIdentified";
import type React from "react";
import { IndividualRiskCategoriesRequirements } from "@components/types/threagileComponentsRequirements";
import { useIndividualRiskCategories } from "@context/ThreatModelContext";


interface Props {
    history: HistoryManager;
}

export const IndividualRiskCategoriesSidebarLeft: React.FC<Props> = ({
    history,
}) => {
    const individualRiskCategories = useIndividualRiskCategories()

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ p: 2 }}>
                <Button
                    fullWidth
                    variant="contained"
                    onClick={() => {
                        const newCategory = {
                            _internalId: crypto.randomUUID(),
                            name: crypto.randomUUID().slice(0, 7),
                            id: "",
                            description: "",
                            impact: "",
                            asvs: "",
                            cheat_sheet: "",
                            action: "",
                            mitigation: "",
                            check: "",
                            function: null,
                            stride: null,
                            detection_logic: "",
                            risk_assessment: "",
                            false_positives: "",
                            model_failure_possible_reason: null,
                            cwe: null,
                            risks_identified: [],
                        };

                        history.perform({
                            do: () => individualRiskCategories.addElement(newCategory),
                            undo: () => individualRiskCategories.deleteElement(newCategory._internalId),
                        });
                    }}
                >
                    Add Individual Risk Category
                </Button>
            </Box>

            <Box sx={{ flexGrow: 1, overflowY: "auto", px: 2 }}>
                {individualRiskCategories.elements.map((asset) => (
                    <Accordion key={asset._internalId}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>{asset.name || "Unnamed Shared Runtime"}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            {individualRiskCategoriesStringFields.map(({ key, label }) => {
                                const currentValue = asset[key] ?? null;

                                return (
                                    <StringField
                                        key={key}
                                        label={label}
                                        value={asset[key] ?? ""}
                                        fieldKey={key}
                                        requirements={IndividualRiskCategoriesRequirements}
                                        onChange={(newVal) => {
                                            const oldVal = currentValue;
                                            if (oldVal === newVal) return;
                                            history.perform({
                                                do: () => individualRiskCategories.updateElementField(asset._internalId, key, newVal),
                                                undo: () => individualRiskCategories.updateElementField(asset._internalId, key, oldVal),
                                            });
                                        }}
                                    />
                                );
                            })}

                            {individualRiskCategoriesEnumFields.map(({ key, label, options }) => {
                                type FieldType = typeof asset[typeof key];
                                const currentValue = asset[key] ?? null;

                                return (
                                    <EnumField<FieldType>
                                        key={key}
                                        label={label}
                                        value={currentValue}
                                        fieldKey={key}
                                        requirements={IndividualRiskCategoriesRequirements}
                                        options={options as FieldType[]}
                                        onChange={(newVal) => {
                                            const oldVal = currentValue;
                                            if (oldVal === newVal) return;
                                            history.perform({
                                                do: () => individualRiskCategories.updateElementField(asset._internalId, key, newVal),
                                                undo: () => individualRiskCategories.updateElementField(asset._internalId, key, oldVal),
                                            });
                                        }}
                                    />
                                );
                            })}

                            <NumberField
                                label="CWE"
                                value={asset.cwe}
                                fieldKey="cwe"
                                requirements={IndividualRiskCategoriesRequirements}
                                onChange={(newVal) =>
                                    history.perform({
                                        do: () => individualRiskCategories.updateElementField(asset._internalId, "cwe", newVal),
                                        undo: () => individualRiskCategories.updateElementField(asset._internalId, "cwe", asset.cwe),
                                    })
                                }
                            />

                            <BooleanField
                                label="Model failure possible reason"
                                value={asset.model_failure_possible_reason}
                                onChange={(newVal) =>
                                    history.perform({
                                        do: () => individualRiskCategories.updateElementField(asset._internalId, "model_failure_possible_reason", newVal),
                                        undo: () => individualRiskCategories.updateElementField(asset._internalId, "model_failure_possible_reason", asset.model_failure_possible_reason),
                                    })
                                }
                            />

                            <RisksIdentifiedSidebarLeft history={history}></RisksIdentifiedSidebarLeft>
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={() => {
                                    const removedCategory = { ...asset };
                                    history.perform({
                                        do: () => individualRiskCategories.deleteElement(asset._internalId),
                                        undo: () => individualRiskCategories.addElement(removedCategory),
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