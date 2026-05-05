/* eslint-disable react-hooks/rules-of-hooks */
/*

Right sidebar component for trust boundaries

Has to following fields:
StringField
    - name
    - id
    - description

EnumField
    - type

TagField
    - tags

*/

import type { TrustBoundary } from "@components/types/threagileComponents";
import { Box } from "@mui/material";
import { trustBoundaryStringFields, trustBoundaryEnumFields } from "@features/draw/components/fields/FieldsEnums"
import { StringField, EnumField, TagField } from "@features/draw/components/fields/FieldsDefinition"
import { useHistoryField } from "@features/draw/components/fields/useHistoryField";
import type { HistoryManager } from "@features/draw/history/HistoryManager";
import { TrustBoundaryRequirements } from "@components/types/threagileComponentsRequirements";

interface TrustBoundarySidebarRightProps {
    formValues: TrustBoundary | null;
    setFormValues: React.Dispatch<React.SetStateAction<TrustBoundary | null>>;
    history: HistoryManager;
}

export const TrustBoundarySidebarRight: React.FC<TrustBoundarySidebarRightProps> = ({
    formValues,
    setFormValues,
    history,
}) => {
    return (
        <Box sx={{ p: 2 }}>
            {trustBoundaryStringFields.map(({ key, label, multiline, rows }) => {
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
                        requirements={TrustBoundaryRequirements}
                        multiline={multiline}
                        rows={rows}
                        onChange={(v) => setFormValues((p) => ({ ...p!, [key]: v }))}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                    />
                );
            })}

            {trustBoundaryEnumFields.map(({ key, label, options }) => {
                type FieldType = NonNullable<TrustBoundary>[typeof key];
                const currentValue = formValues ? formValues[key] ?? null : null;

                return (
                    <EnumField<FieldType>
                        key={key}
                        label={label}
                        value={currentValue}
                        fieldKey={key}
                        requirements={TrustBoundaryRequirements}
                        options={options as FieldType[]}
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
        </Box>
    );
}