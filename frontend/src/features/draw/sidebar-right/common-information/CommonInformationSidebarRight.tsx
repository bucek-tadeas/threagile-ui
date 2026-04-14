/*

Right sidebar component for common information - abstraction covering all the top level information

Has to following fields:
StringField
    - threagile_version
    - title
    - date
    - management_summary_comment

EnumField
    - business_criticality

StringArrayField
    - questions
    - abuse_cases
    - security_requirements

AuthorField
    - author

ContributorsField
    - contributors

OverviewField
    - application_description
    - business_overview
    - technical_overview

*/

import { Box } from "@mui/material";
import {
    commonInformationStringFields,
    commonInformationEnumFields,
    commonInformationStringArrayFields,
    commonInformationOverviewFields,
} from "@features/draw/components/fields/FieldsEnums";
import {
    StringField,
    EnumField,
    StringArrayField,
    AuthorField,
    ContributorsField,
    OverviewField,
} from "@features/draw/components/fields/FieldsDefinition";
import { useHistoryField } from "@features/draw/components/fields/useHistoryField";
import type { CommonInformation, AuthorInformation, Question, AbuseCase, SecurityRequirement } from "@components/types/threagileComponents";
import type { HistoryManager } from "@features/draw/history/HistoryManager";
import type { ContributorInformation } from "@components/types/threagileComponents";
import { CommonInformationRequirements, AuthorInformationRequirements } from "@components/types/threagileComponentsRequirements";

interface Props {
    formValues: CommonInformation;
    setFormValues: React.Dispatch<React.SetStateAction<CommonInformation>>;
    history: HistoryManager;
}

export const CommonInformationSidebarRight: React.FC<Props> = ({
    formValues,
    setFormValues,
    history,
}) => {
    return (
        <Box sx={{ p: 2 }}>
            {commonInformationStringFields.map(({ key, label, multiline, rows }) => {
                const { handleFocus, handleBlur } = useHistoryField<string>(
                    formValues[key] ?? "",
                    (v) => setFormValues((p) => ({ ...p!, [key]: v })),
                    history
                );

                return (
                    <StringField
                        key={key}
                        label={label}
                        value={formValues[key] ?? ""}
                        fieldKey={key}
                        requirements={CommonInformationRequirements}
                        multiline={multiline}
                        rows={rows}
                        onChange={(v) => setFormValues((p) => ({ ...p!, [key]: v }))}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                    />
                );
            })}

            {commonInformationEnumFields.map(({ key, label, options }) => {
                type FieldType = typeof formValues[typeof key];
                const currentValue = formValues[key] ?? null;

                return (
                    <EnumField<FieldType>
                        key={key}
                        label={label}
                        value={currentValue}
                        fieldKey={key}
                        requirements={CommonInformationRequirements}
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

            {commonInformationStringArrayFields.map(({ key, label }) => {
                type FieldType = (typeof formValues[typeof key])[number];

                const { handleFocus, handleBlur } = useHistoryField<FieldType[]>(
                    formValues[key] ?? [],
                    (v) => setFormValues((p) => ({ ...p!, [key]: v })),
                    history
                );

                const Schemas = {
                    questions: [
                        { key: "question" as keyof Question, label: "Question", multiline: false },
                        { key: "answer" as keyof Question, label: "Answer", multiline: true },
                    ],
                    abuse_cases: [
                        { key: "abuse_case" as keyof AbuseCase, label: "Abuse Case", multiline: false },
                        { key: "description" as keyof AbuseCase, label: "Description", multiline: true },
                    ],
                    security_requirements: [
                        { key: "security_requirement" as keyof SecurityRequirement, label: "Security Requirement", multiline: false },
                        { key: "description" as keyof SecurityRequirement, label: "Description", multiline: true },
                    ]
                }

                return (
                    <StringArrayField<FieldType>
                        key={key}
                        label={label}
                        values={formValues[key] ?? []}
                        fieldKey={key}
                        requirements={CommonInformationRequirements}
                        fields={Schemas[key]}
                        onChange={(vals) => setFormValues((p) => ({ ...p!, [key]: vals }))}
                        onItemFocus={() => handleFocus()}
                        onItemBlur={(_, newVals) => handleBlur(newVals)}
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

            {(() => {
                const { handleFocus, handleBlur: handleAuthorBlur } = useHistoryField<AuthorInformation>(
                    formValues.author,
                    (v) => setFormValues((p) => ({ ...p!, author: v })),
                    history
                );

                const handleBlur = (field: keyof AuthorInformation, newValue: string) => {
                    const newAuthor = { ...formValues.author, [field]: newValue };
                    handleAuthorBlur(newAuthor);
                };

                return (
                    <AuthorField
                        value={formValues.author}
                        requirements={AuthorInformationRequirements}
                        onChange={(v) => setFormValues((p) => ({ ...p!, author: v }))}
                        onItemFocus={handleFocus}
                        onItemBlur={handleBlur}
                    />
                );
            })()}

            {(() => {
                const { handleFocus, handleBlur: handleArrayBlur } = useHistoryField<ContributorInformation[]>(
                    formValues.contributors,
                    (v) => setFormValues((p) => ({ ...p!, contributors: v })),
                    history
                );

                const handleItemBlur = (
                    idx: number,
                    field: keyof ContributorInformation,
                    newValue: string
                ) => {
                    const updated = [...formValues.contributors];
                    updated[idx] = { ...updated[idx], [field]: newValue };
                    handleArrayBlur(updated);
                };

                return (
                    <ContributorsField
                        values={formValues.contributors}
                        onChange={(v) => setFormValues((p) => ({ ...p!, contributors: v }))}
                        onItemFocus={() => handleFocus()}
                        onItemBlur={handleItemBlur}
                        onAdd={(newVals) => handleArrayBlur(newVals)}
                        onRemove={(oldArr) => handleArrayBlur(oldArr)}
                    />
                );
            })()}

            {commonInformationOverviewFields.map(({ key, label }) => {
                const { handleFocus, handleBlur: handleObjectBlur } = useHistoryField<{ description: string; images: string[] }>(
                    formValues[key] ?? { description: "", images: [] },
                    (v) => setFormValues((p) => ({ ...p!, [key]: v })),
                    history
                );

                const handleItemBlur = <K extends keyof { description: string; images: string[] }>(
                    field: K,
                    newValue: { description: string; images: string[] }[K]
                ) => {
                    const newObj = { ...formValues[key], [field]: newValue, };
                    handleObjectBlur(newObj);
                };

                const handleAddImage = (oldValue: { description: string; images: string[] }, newValue: { description: string; images: string[] }) => {
                    history.perform({
                        do: () => setFormValues((p) => ({ ...p!, [key]: newValue })),
                        undo: () => setFormValues((p) => ({ ...p!, [key]: oldValue })),
                    });
                };

                const handleRemoveImage = (oldValue: { description: string; images: string[] }, newValue: { description: string; images: string[] }) => {
                    history.perform({
                        do: () => setFormValues((p) => ({ ...p!, [key]: newValue })),
                        undo: () => setFormValues((p) => ({ ...p!, [key]: oldValue })),
                    });
                };

                return (
                    <OverviewField
                        key={key}
                        label={label}
                        value={formValues[key] ?? { description: "", images: [] }}
                        requirements={CommonInformationRequirements}
                        onChange={(v) => setFormValues((p) => ({ ...p!, [key]: v }))}
                        onItemFocus={() => handleFocus()}
                        onItemBlur={handleItemBlur}
                        onAddImage={handleAddImage}
                        onRemoveImage={handleRemoveImage}
                    />
                );
            })}
        </Box>
    );
};
