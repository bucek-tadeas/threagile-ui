/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/rules-of-hooks */
/*

Right sidebar component for technical assets

Has to following fields:
StringField
    - name
    - id
    - description
    - justification_out_of_scope
    - owner
    - justification_cia_rating

EnumField
    - type
    - usage
    - size
    - machine
    - encryption
    - confidentiality
    - integrity
    - availability

- MultiSelectField
    - data_assets_stored
    - data_assets_processed
    - data_formats_accepted
    - technologies

TagField
    - tags

NumberField
    - diagram_tweak_order

BooleanField
    - out_of_scope
    - internet
    - multi_tenant
    - redundant
    - custom_developed_parts
    - used_as_client_by_human

*/

import React from "react";
import { Box } from "@mui/material";
import type { TechnicalAsset } from "@components/types/threagileComponents";
import { StringField, BooleanField, EnumField, MultiSelectField, TagField, NumberField } from "@features/draw/components/fields/FieldsDefinition"
import { technicalAssetStringFields, technicalAssetEnumFields, technicalAssetBooleanFields } from "@features/draw/components/fields/FieldsEnums"
import { TechnicalAssetDataFormat, TechnicalAssetTechnologies } from "@components/types/threagileEnums";
import { useDataAssets } from "@context/ThreatModelContext";
import type { DataAsset } from "@components/types/threagileComponents";
import { useHistoryField } from "@features/draw/components/fields/useHistoryField";
import type { HistoryManager } from "@features/draw/history/HistoryManager";
import { TechnicalAssetRequirements } from "@components/types/threagileComponentsRequirements";

interface TechnicalAssetSidebarRightProps {
    formValues: TechnicalAsset | null;
    setFormValues: React.Dispatch<React.SetStateAction<TechnicalAsset | null>>;
    history: HistoryManager;
}

export const TechnicalAssetSidebarRight: React.FC<TechnicalAssetSidebarRightProps> = ({
    formValues,
    setFormValues,
    history,
}) => {
    const dataAssets = useDataAssets();

    return (
        <Box sx={{ p: 2 }}>
            {technicalAssetStringFields.map(({ key, label, multiline, rows }) => {
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
                        fieldKey={key}
                        requirements={TechnicalAssetRequirements}
                        multiline={multiline}
                        rows={rows}
                        onChange={(v) => setFormValues((p) => ({ ...p!, [key]: v }))}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                    />
                );
            })}

            {technicalAssetEnumFields.map(({ key, label, options }) => {
                type FieldType = NonNullable<TechnicalAsset>[typeof key];
                const currentValue = formValues ? formValues[key] ?? null : null;

                return (
                    <EnumField<FieldType>
                        key={key}
                        label={label}
                        value={currentValue}
                        options={options as FieldType[]}
                        fieldKey={key}
                        requirements={TechnicalAssetRequirements}
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
                label="Technologies"
                values={(formValues as any)?.technologies || []}
                options={TechnicalAssetTechnologies}
                fieldKey="technologies"
                requirements={TechnicalAssetRequirements}
                onChange={(newVal) => {
                    const oldVal = (formValues as any)?.technologies || [];
                    const newAssets = newVal;

                    history.perform({
                        do: () =>
                            setFormValues((prev) => ({
                                ...prev!,
                                technologies: newAssets,
                            })),
                        undo: () =>
                            setFormValues((prev) => ({
                                ...prev!,
                                technologies: oldVal,
                            })),
                    });
                }}
            />

            <MultiSelectField
                label="Data formats accepted"
                values={(formValues as any)?.data_formats_accepted || []}
                options={TechnicalAssetDataFormat}
                fieldKey="data_formats_accepted"
                requirements={TechnicalAssetRequirements}
                onChange={(newVal) => {
                    const oldVal = (formValues as any)?.data_formats_accepted || [];
                    const newAssets = newVal;
                    if (JSON.stringify(oldVal) === JSON.stringify(newAssets)) return;

                    history.perform({
                        do: () =>
                            setFormValues((prev) => ({
                                ...prev!,
                                data_formats_accepted: newAssets,
                            })),
                        undo: () =>
                            setFormValues((prev) => ({
                                ...prev!,
                                data_formats_accepted: oldVal,
                            })),
                    });
                }}
            />

            <MultiSelectField
                label="Data assets processed"
                values={(formValues as any)?.data_assets_processed.map((d: DataAsset) => d.name) || []}
                options={dataAssets.elements.map((d) => d.name)}
                fieldKey="data_assets_processed"
                requirements={TechnicalAssetRequirements}
                onChange={(newVal) => {
                    const oldVal = (formValues as any)?.data_assets_processed || [];
                    const newAssets = dataAssets.elements.filter((d) => newVal.includes(d.name));
                    if (JSON.stringify(oldVal) === JSON.stringify(newAssets)) return;
                    history.perform({
                        do: () =>
                            setFormValues((prev) => ({
                                ...prev!,
                                data_assets_processed: newAssets,
                            })),
                        undo: () =>
                            setFormValues((prev) => ({
                                ...prev!,
                                data_assets_processed: oldVal,
                            })),
                    });
                }}
            />

            <MultiSelectField
                label="Data assets stored"
                values={(formValues as any)?.data_assets_stored.map((d: DataAsset) => d.name) || []}
                options={dataAssets.elements.map((d) => d.name)}
                fieldKey="data_assets_stored"
                requirements={TechnicalAssetRequirements}
                onChange={(newVal) => {
                    const oldVal = (formValues as any)?.data_assets_stored || [];
                    const newAssets = dataAssets.elements.filter((d) => newVal.includes(d.name));
                    if (JSON.stringify(oldVal) === JSON.stringify(newAssets)) return;
                    history.perform({
                        do: () =>
                            setFormValues((prev) => ({
                                ...prev!,
                                data_assets_stored: newAssets,
                            })),
                        undo: () =>
                            setFormValues((prev) => ({
                                ...prev!,
                                data_assets_stored: oldVal,
                            })),
                    });
                }}
            />

            <TagField
                value={formValues?.tags || []}
                onChange={(newTags) => {
                    const oldTags = formValues?.tags || [];
                    history.perform({
                        do: () => setFormValues((prev) => (prev ? { ...prev, tags: newTags } : prev)),
                        undo: () => setFormValues((prev) => (prev ? { ...prev, tags: oldTags } : prev)),
                    });
                }}
            />

            <NumberField
                label="Diagram tweak order"
                value={(formValues as any)?.diagram_tweak_order || []}
                fieldKey="diagram_tweak_order"
                requirements={TechnicalAssetRequirements}
                onChange={(val) =>
                    history.perform({
                        do: () => setFormValues(prev => ({ ...prev!, ["diagram_tweak_order"]: val })),
                        undo: () => setFormValues(prev => ({ ...prev!, ["diagram_tweak_order"]: formValues ? formValues["diagram_tweak_order"] : null })),
                    })
                }
            />

            {technicalAssetBooleanFields.map(({ key, label }) => (
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