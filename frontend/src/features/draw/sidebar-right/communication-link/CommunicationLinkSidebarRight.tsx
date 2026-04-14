/*

Right sidebar component for communication links

Has to following fields:
StringField
    - name
    - description

EnumField
    - protocol
    - authentication
    - authorization
    - usage

MultiSelectField
    - data_assets_received
    - data_assets_sent

TagField
    - tags

NumberField
    - diagram_tweak_constraint
    - diagram_tweak_weight

BooleanField
    - vpn
    - ip_filtered
    - readonly
    - bidirectional

*/

import React from "react";
import { Box } from "@mui/material";
import type { CommunicationLink } from "@components/types/threagileComponents";
import { StringField, BooleanField, EnumField, MultiSelectField, TagField, NumberField } from "@features/draw/components/fields/FieldsDefinition"
import { useHistoryField } from "@features/draw/components/fields/useHistoryField";
import { communicationLinkStringFields, communicationLinkEnumFields, communicationLinkBooleanFields } from "@features/draw/components/fields/FieldsEnums"
import { useDataAssets } from "@context/ThreatModelContext";
import type { DataAsset } from "@components/types/threagileComponents";
import type { HistoryManager } from "@features/draw/history/HistoryManager";
import { CommunicationLinkRequirements } from "@components/types/threagileComponentsRequirements";

interface CommunicationLinkSidebarRightProps {
    formValues: CommunicationLink | null;
    setFormValues: React.Dispatch<React.SetStateAction<CommunicationLink | null>>;
    history: HistoryManager;
}

export const CommunicationLinkSidebarRight: React.FC<CommunicationLinkSidebarRightProps> = ({
    formValues,
    setFormValues,
    history,
}) => {
    const dataAssets = useDataAssets();

    return (
        <Box sx={{ p: 2 }}>
            {communicationLinkStringFields.map(({ key, label, multiline, rows }) => {
                const { handleFocus, handleBlur } = useHistoryField<string>(
                    formValues ? formValues[key] ?? "" : "",
                    (v) => setFormValues((p) => ({ ...p!, [key]: v })),
                    history
                );

                return (
                    <StringField
                        key={key}
                        label={label}
                        value={formValues ? formValues[key] ?? "" : ""}
                        multiline={multiline}
                        rows={rows}
                        fieldKey={key}
                        requirements={CommunicationLinkRequirements}
                        onChange={(v) => setFormValues((p) => ({ ...p!, [key]: v }))}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                    />
                );
            })}

            {communicationLinkEnumFields.map(({ key, label, options }) => {
                type FieldType = Exclude<NonNullable<CommunicationLink>[typeof key], undefined>;
                const currentValue = formValues ? formValues[key] ?? null : null;

                return (
                    <EnumField<FieldType>
                        key={key}
                        label={label}
                        value={currentValue}
                        options={options as FieldType[]}
                        fieldKey={key}
                        requirements={CommunicationLinkRequirements}
                        onChange={(newVal) => {
                            const oldVal = currentValue;
                            if (oldVal === newVal) return;
                            history.perform({
                                do: () => setFormValues((p) => ({ ...p!, [key]: newVal })),
                                undo: () => setFormValues((p) => ({ ...p!, [key]: oldVal })),
                            });
                        }}
                    />
                );
            })}

            <MultiSelectField
                label="Data assets sent"
                values={(formValues as any)?.data_assets_sent?.map((d: DataAsset) => d.name) || []}
                options={dataAssets.elements.map((d) => d.name)}
                fieldKey="data_assets_sent"
                requirements={CommunicationLinkRequirements}
                onChange={(newVal) => {
                    const oldVal = (formValues as any)?.data_assets_sent || [];
                    const newAssets = dataAssets.elements.filter((d) => newVal.includes(d.name));
                    if (JSON.stringify(oldVal) === JSON.stringify(newAssets)) return;
                    history.perform({
                        do: () =>
                            setFormValues((prev) => ({
                                ...prev!,
                                data_assets_sent: newAssets,
                            })),
                        undo: () =>
                            setFormValues((prev) => ({
                                ...prev!,
                                data_assets_sent: oldVal,
                            })),
                    });
                }}
            />

            <MultiSelectField
                label="Data assets received"
                values={(formValues as any)?.data_assets_received?.map((d: DataAsset) => d.name) || []}
                options={dataAssets.elements.map((d) => d.name)}
                fieldKey="data_assets_received"
                requirements={CommunicationLinkRequirements}
                onChange={(newVal) => {
                    const oldVal = (formValues as any)?.data_assets_received || [];
                    const newAssets = dataAssets.elements.filter((d) => newVal.includes(d.name));
                    if (JSON.stringify(oldVal) === JSON.stringify(newAssets)) return;
                    history.perform({
                        do: () =>
                            setFormValues((prev) => ({
                                ...prev!,
                                data_assets_received: newAssets,
                            })),
                        undo: () =>
                            setFormValues((prev) => ({
                                ...prev!,
                                data_assets_received: oldVal,
                            })),
                    });
                }}
            />

            <TagField
                value={formValues?.tags || []}
                onChange={(newTags) =>
                    history.perform({
                        do: () => setFormValues((prev) => (prev ? { ...prev, tags: newTags } : prev)),
                        undo: () => setFormValues((prev) => (prev ? { ...prev, tags: formValues?.tags } : prev))
                    })

                }
            />

            <NumberField
                label="Diagram tweak weight"
                value={(formValues as any)?.diagram_tweak_weight || []}
                fieldKey="diagram_tweak_weight"
                requirements={CommunicationLinkRequirements}
                onChange={(val) =>
                    history.perform({
                        do: () => setFormValues(prev => ({ ...prev!, ["diagram_tweak_weight"]: val })),
                        undo: () => setFormValues(prev => ({ ...prev!, ["diagram_tweak_weight"]: formValues ? formValues["diagram_tweak_weight"] : null })),
                    })
                }
            />

            {communicationLinkBooleanFields.map(({ key, label }) => (
                <BooleanField
                    key={key}
                    label={label}
                    value={(formValues as any)?.[key] ?? null}
                    onChange={(newVal) => {
                        history.perform({
                            do: () => setFormValues(prev => ({ ...prev!, [key]: newVal })),
                            undo: () => setFormValues(prev => ({ ...prev!, [key]: formValues ? formValues[key] : null })),
                        });
                    }}
                />
            ))}

        </Box >
    )
}