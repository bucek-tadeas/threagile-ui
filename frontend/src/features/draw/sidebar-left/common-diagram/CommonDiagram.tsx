/*

Left sidebar component using abstraction of "common diagram information" to group common information about final diagram visuals together

Has to following fields:
NumberField
    - diagram_tweak_nodesep
    - diagram_tweak_ranksep

EnumField
    - diagram_tweak_edge_layout

MultiStringField
    - diagram_tweak_invisible_connections_between_assets
    - diagram_tweak_same_rank_assets

BooleanField
    - diagram_tweak_suppress_edge_labels
    - diagram_tweak_layout_left_to_right


*/

import { Box } from "@mui/material";
import { HistoryManager } from "@features/draw/history/HistoryManager";
import { useHistoryField } from "@features/draw/components/fields/useHistoryField";
import type { CommonDiagram } from "@components/types/threagileComponents";
import { commonDiagramBooleanFields, commonDiagramNumberFields, commonDiagramStringArrayFields } from "@features/draw/components/fields/FieldsEnums";
import { NumberField, BooleanField, MultiStringField, EnumField } from "@features/draw/components/fields/FieldsDefinition";
import { CommonDiagramDiagramTweakEgdeLayout, type CommonDiagramDiagramTweakEgdeLayoutType } from "@components/types/threagileEnums";
import { CommonDiagramRequirements } from "@components/types/threagileComponentsRequirements";


interface Props {
    formValues: CommonDiagram;
    setFormValues: React.Dispatch<React.SetStateAction<CommonDiagram>>;
    history: HistoryManager;
}

export const CommonDiagramSidebarLeft: React.FC<Props> = ({
    formValues,
    setFormValues,
    history,
}) => {
    return (
        <Box sx={{ p: 2 }}>
            {commonDiagramNumberFields.map(({ key, label }) => {
                return (
                    <NumberField
                        key={key}
                        label={label}
                        value={formValues[key]}
                        fieldKey={key}
                        requirements={CommonDiagramRequirements}
                        onChange={(val) =>
                            history.perform({
                                do: () => setFormValues(prev => ({ ...prev!, [key]: val })),
                                undo: () => setFormValues(prev => ({ ...prev!, [key]: formValues ? formValues[key] : null })),
                            })
                        }
                    />
                )
            })}

            <EnumField<CommonDiagramDiagramTweakEgdeLayoutType>
                label="Diagram Tweak Edge Layout"
                value={formValues.diagram_tweak_edge_layout ?? ""}
                options={CommonDiagramDiagramTweakEgdeLayout}
                fieldKey="diagram_tweak_edge_layout"
                requirements={CommonDiagramRequirements}
                onChange={(val) => history.perform({
                    do: () => setFormValues(prev => ({ ...prev!, diagram_tweak_edge_layout: val })),
                    undo: () => setFormValues(prev => ({ ...prev!, diagram_tweak_edge_layout: formValues.diagram_tweak_edge_layout })),
                })}
            />

            {commonDiagramStringArrayFields.map(({ key, label }) => {
                const { handleFocus, handleBlur } = useHistoryField<string[]>(
                    formValues[key] ?? [],
                    (v) => setFormValues((p) => ({ ...p!, [key]: v })),
                    history
                );

                return (
                    <MultiStringField
                        key={key}
                        label={label}
                        values={formValues[key] ?? []}
                        fieldKey={key}
                        requirements={CommonDiagramRequirements}
                        onChange={(vals) =>
                            setFormValues((p) => ({ ...p!, [key]: vals }))
                        }

                        onItemFocus={() => { handleFocus(); }}

                        onItemBlur={(_, newVals) => { handleBlur(newVals); }}

                        onAdd={(newVals) => {
                            const oldVals = formValues[key] ?? [];
                            history.perform({
                                do: () => setFormValues((p) => ({ ...p!, [key]: newVals })),
                                undo: () => setFormValues((p) => ({ ...p!, [key]: oldVals })),
                            });
                        }}

                        onRemove={(oldVals, newVals) => {
                            history.perform({
                                do: () => setFormValues((p) => ({ ...p!, [key]: newVals })),
                                undo: () => setFormValues((p) => ({ ...p!, [key]: oldVals })),
                            });
                        }}
                    />
                );
            })}

            {commonDiagramBooleanFields.map(({ key, label }) => (
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
        </Box>
    );
};