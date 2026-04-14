/*

Fields definitions used both in sidebar left and sidebar right
--------------------------------------------------------------

StringField
    Used for input on a single string (with whitespace) - sentence (description) is considered a string

BooleanField
    Used for True/False input

MultiSelectField
    Used to select [0-n] options from n options

EnumField
    Used to select a value from a predefined (enum) set of values

StringArrayField
    Used for question, abuse_cases and security requirements in common information

AuthorField
    Used for author on common information

ContributorsField
    Used for contributors on common information

OverviewField
    Used for *overview fields in common information

TagField
    Tag field used across different components of the threat model

NumberField
    Used for number input

EnumFieldObject
    Used for selection of 1 component (technical assets/data assets etc.)

MultiSelectTechnicalAssetsField
    Used to select [0-n] technical assets

EnumFieldTrustBoundary
    Used to select a trust boundary (special field bcs trust boundary is missing a name field) // TODO

HistoryStringField
    Used for left sidebar to store values in history directly

isFieldInvalid
    Helper function to check field validity

MultiStringField
    Used to input [0+] strings

*/

import { TextField, ListItemText, FormControl, InputLabel, Select, MenuItem, Accordion, AccordionSummary, Typography, AccordionDetails, Box, Button, IconButton, FormControlLabel, Checkbox, type SelectChangeEvent, Autocomplete, Chip } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";
import type { AuthorInformation } from "@components/types/threagileComponents";
import type { ContributorInformation } from "@components/types/threagileComponents";
import { useTags } from "@context/TagContext";
import type { TechnicalAsset, TrustBoundary } from "@components/types/threagileComponents";
import { HistoryManager } from "@features/draw/history/HistoryManager";
import { useHistoryField } from "./useHistoryField";
import type { FieldRequirements } from "@components/types/threagileComponentsRequirements";
import type { TwoFieldObject } from "@components/types/threagileComponents";

interface BooleanFieldProps {
    label: string;
    value: boolean | null;
    onChange: (value: boolean) => void;
}

interface MultiSelectField<T extends string> {
    label: string;
    values: T[] | null;
    options: T[];
    requirements: FieldRequirements;
    fieldKey: string;
    onChange: (value: T[]) => void;
}

interface StringFieldProps {
    label: string;
    value: string;
    requirements: FieldRequirements;
    fieldKey: string;
    onChange: (value: string) => void;
    onFocus?: () => void;
    onBlur?: (value: string) => void;
    multiline?: boolean;
    rows?: number;
}

interface EnumFieldProps<T extends string | null> {
    label: string;
    value: T;
    options: T[];
    requirements: FieldRequirements;
    fieldKey: string;
    onChange: (value: T) => void;
    onFocus?: () => void;
    onBlur?: (value: T) => void;
}

interface StringArrayFieldProps<T extends TwoFieldObject> {
    label: string;
    values: T[];
    requirements: FieldRequirements;
    fieldKey: string;
    fields: Array<{ key: keyof T, label: string }>;
    onChange: (value: T[]) => void;
    onItemFocus?: (index: number, oldValues: T[]) => void;
    onItemBlur?: (index: number, newValues: T[]) => void;
    onAdd?: (newValues: T[]) => void;
    onRemove?: (oldValues: T[], newValues: T[]) => void;
}

interface OverviewFieldProps {
    label: string;
    value: OverviewValue;
    requirements: FieldRequirements;
    onChange: (value: OverviewValue) => void;
    onBlur?: (value: OverviewValue) => void;
    onItemFocus?: <K extends keyof OverviewValue>(
        field: K,
        oldVal: OverviewValue[K]
    ) => void;
    onItemBlur?: <K extends keyof OverviewValue>(
        field: K,
        newVal: OverviewValue[K]
    ) => void;
    onAddImage?: (oldValue: OverviewValue, newValue: OverviewValue) => void;
    onRemoveImage?: (oldValue: OverviewValue, newValue: OverviewValue) => void;
}

interface AuthorFieldProps {
    value: AuthorInformation;
    requirements: FieldRequirements;
    onChange: (value: AuthorInformation) => void;
    onItemFocus?: (field: keyof AuthorInformation, oldValue: string) => void;
    onItemBlur?: (field: keyof AuthorInformation, newValue: string) => void;
}

interface ContributorsFieldProps {
    values: ContributorInformation[];
    onChange: (value: ContributorInformation[]) => void;
    onItemFocus?: (idx: number, field: keyof ContributorInformation, oldVal: string) => void;
    onItemBlur?: (idx: number, field: keyof ContributorInformation, newVal: string) => void;
    onAdd?: (newArr: ContributorInformation[]) => void;
    onRemove?: (oldArr: ContributorInformation[]) => void;
}

interface OverviewValue {
    description: string;
    images: string[];
}

interface TagFieldProps {
    value: string[];
    onChange: (tags: string[]) => void;
}

interface NumberFieldProps {
    label: string;
    value: number | null;
    requirements: FieldRequirements;
    fieldKey: string;
    onChange: (value: number) => void;
    onFocus?: () => void;
    onBlur?: (value: number) => void;
}

interface MultiSelectFieldProps {
    label: string;
    value: TechnicalAsset[];
    options: TechnicalAsset[];
    requirements: FieldRequirements;
    fieldKey: string;
    onChange: (newVal: TechnicalAsset[]) => void;
}

interface HistoryStringFieldProps<T extends Record<string, any>, K extends keyof T> {
    assetId: string;
    fieldKey: K;
    label: string;
    value: Extract<T[K], string | null | undefined> extends never
    ? string
    : Extract<T[K], string | null | undefined>;
    updateField: <P extends keyof T>(
        id: string,
        key: P,
        value: T[P]
    ) => void;
    requirements: FieldRequirements;
    history: HistoryManager;
}

export interface EnumFieldTrustBoundaryProps {
    label: string;
    value: TrustBoundary | null;
    options: TrustBoundary[];
    requirements: FieldRequirements;
    fieldKey: string;
    onChange: (newVal: TrustBoundary) => void;
}

interface MultiStringFieldProps {
    label: string;
    values: string[];
    requirements: FieldRequirements;
    fieldKey: string;
    onChange: (value: string[]) => void;
    onItemFocus?: (index: number, oldValue: string[]) => void;
    onItemBlur?: (index: number, newValue: string[]) => void;
    onAdd?: (newValues: string[]) => void;
    onRemove?: (oldValues: string[], newValues: string[]) => void;
}

export function StringField({ label, value, multiline, rows, requirements, fieldKey, onChange, onFocus, onBlur }: StringFieldProps) {
    const invalid = requirements ? isFieldInvalid(fieldKey, value, requirements) : false;

    return (
        <TextField
            sx={{
                "&:before": { display: "none" },
                boxShadow: "none",
                mb: 1,
                borderRadius: "8px",
                background: "#121212",
            }}
            margin="dense"
            fullWidth
            label={label}
            value={value || ""}
            error={invalid}
            helperText={invalid ? `${label} is required` : ""}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus ? () => onFocus() : undefined}
            onBlur={onBlur ? (e) => onBlur(e.target.value) : undefined}
            multiline={multiline}
            rows={rows}
        />
    );
}

export function BooleanField({ label, value, onChange }: BooleanFieldProps) {
    return (
        <FormControlLabel
            control={
                <Checkbox
                    checked={Boolean(value)}
                    onChange={(e) => onChange(e.target.checked)}
                />
            }
            label={label}
        />
    );
}

export function MultiSelectField<T extends string>({ label, values, options, requirements, fieldKey, onChange }: MultiSelectField<T>) {
    const handleChange = (event: SelectChangeEvent<string[]>) => {
        const selected = event.target.value as T[];
        onChange(selected);
    };

    const invalid = requirements ? isFieldInvalid(fieldKey, values, requirements) : false;

    return (
        <FormControl fullWidth margin="dense">
            <InputLabel>{label}</InputLabel>
            <Select
                multiple
                value={values || []}
                label={label}
                onChange={handleChange}
                error={invalid}
            >
                {options.map((option) => (
                    <MenuItem key={option} value={option}>
                        {option}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    )
}

export function EnumField<T extends string | null>({
    label,
    value,
    options,
    requirements,
    fieldKey,
    onChange,
}: EnumFieldProps<T>) {
    const invalid = requirements ? isFieldInvalid(fieldKey, value, requirements) : false;

    return (
        <FormControl fullWidth margin="dense"
            sx={{
                "&:before": { display: "none" },
                boxShadow: "none",
                mb: 1,
                borderRadius: "8px",
                background: "#121212",
            }}>
            <InputLabel>{label}</InputLabel>
            <Select
                value={value ?? ""}
                label={label}
                onChange={(e) => onChange(e.target.value as T)}
                error={invalid}
            >
                {options.map((option) => (
                    <MenuItem key={option ?? ""} value={option ?? ""}>
                        {option ?? ""}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}

export function StringArrayField<T extends TwoFieldObject>({ label, values, requirements, fieldKey, fields, onChange, onItemFocus, onItemBlur, onAdd, onRemove }: StringArrayFieldProps<T>) {
    const handleChange = (index: number, key: keyof T, newValue: string) => {
        const updated = [...values];
        updated[index] = { ...updated[index], [key]: newValue };
        onChange(updated);
    };

    const addItem = () => {
        const emptyObj = {} as T;
        fields.forEach(f => {
            emptyObj[f.key] = "" as (T[keyof T]);
        });
        onAdd ? onAdd([...values, emptyObj]) : onChange([...values, emptyObj]);
    };

    const removeItem = (index: number) => {
        const oldArr = [...values];
        const updated = values.filter((_, i) => i !== index);
        if (onRemove) onRemove(oldArr, updated);
        else onChange(updated);
    };

    return (
        <Accordion
            disableGutters
            square
            sx={{
                "&:before": { display: "none" },
                boxShadow: "none",
                border: "1px solid #494949",
                borderRadius: "5px",
                mb: 1,
                background: "#121212",
                marginTop: "10px",
                marginBottom: "15px",
            }}
        >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ color: "#b8b8b8" }}>{label}</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {values.map((item, index) => (
                        <Box key={index} sx={{ p: 1, border: "1px solid #333", borderRadius: "5px" }}>
                            {fields.map(field => (
                                <StringField
                                    key={String(field.key)}
                                    label={field.label}
                                    value={item[field.key]}
                                    onFocus={() => onItemFocus?.(index, [...values])}
                                    requirements={requirements}
                                    fieldKey={`${fieldKey}.${index}.${String(field.key)}`}
                                    onChange={(v) => handleChange(index, field.key, v)}
                                    onBlur={() => onItemBlur?.(index, [...values])}
                                />
                            ))}
                            <Button
                                onClick={() => removeItem(index)}
                                size="small"
                                variant="outlined"
                                sx={{ mt: 1 }}
                            >
                                Remove
                            </Button>
                        </Box>
                    ))}
                    <Button
                        onClick={addItem}
                        size="small"
                        variant="outlined"
                        sx={{ alignSelf: "flex-start", mt: 1 }}
                    >
                        Add {label.slice(0, -1)}
                    </Button>
                </Box>
            </AccordionDetails>
        </Accordion>
    );
}

export function AuthorField({
    value,
    requirements,
    onChange,
    onItemFocus,
    onItemBlur,
}: AuthorFieldProps) {
    const handleChange = (field: keyof AuthorInformation, newVal: string) =>
        onChange({ ...value, [field]: newVal });

    return (
        <Accordion
            disableGutters
            sx={{
                "&:before": { display: "none" },
                boxShadow: "none",
                border: "1px solid #494949",
                borderRadius: "5px",
                mb: 1,
                background: "#121212",
                mt: 2,
                overflow: "hidden",
            }}
        >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ color: "#b8b8b8" }}>Author</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {(["name", "contact", "homepage"] as (keyof AuthorInformation)[]).map((field) => (
                    <TextField
                        key={field}
                        label={field[0].toUpperCase() + field.slice(1)}
                        variant="standard"
                        value={value?.[field] || ""}
                        error={requirements ? isFieldInvalid(field, value?.[field], requirements) : false}
                        onFocus={() => onItemFocus?.(field, value?.[field] ?? "")}
                        onChange={(e) => handleChange(field, e.target.value)}
                        onBlur={(e) => onItemBlur?.(field, e.target.value)}
                    />
                ))}
            </AccordionDetails>
        </Accordion>
    );
}

export function ContributorsField({
    values,
    onChange,
    onItemFocus,
    onItemBlur,
    onAdd,
    onRemove,
}: ContributorsFieldProps) {
    const handleChange = (index: number, field: keyof ContributorInformation, val: string) => {
        const updated = [...values];
        updated[index] = { ...updated[index], [field]: val };
        onChange(updated);
    };

    const addItem = () => {
        const updated = [...values, { name: "", contact: "", homepage: "" }];
        onAdd ? onAdd(updated) : onChange(updated);
    };

    const removeItem = (index: number) => {
        const updated = values.filter((_, i) => i !== index);
        onRemove ? onRemove(updated) : onChange(updated);
    };

    return (
        <Accordion
            disableGutters
            sx={{
                "&:before": { display: "none" },
                boxShadow: "none",
                border: "1px solid #494949",
                borderRadius: "5px",
                mb: 1,
                background: "#121212",
                mt: 2,
                overflow: "hidden",
                marginBottom: "15px",
            }}
        >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ color: "#b8b8b8" }}>
                    Contributors
                </Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {values.map((contrib, idx) => (
                        <Box key={idx} sx={{ display: "flex", gap: 1 }}>
                            {(["name", "contact", "homepage"] as (keyof ContributorInformation)[]).map((field) => (
                                <TextField
                                    key={field}
                                    margin="dense"
                                    fullWidth
                                    label={field[0].toUpperCase() + field.slice(1)}
                                    value={contrib[field]}
                                    onFocus={() => onItemFocus?.(idx, field, contrib[field])}
                                    onChange={(e) => handleChange(idx, field, e.target.value)}
                                    onBlur={(e) => onItemBlur?.(idx, field, e.target.value)}
                                />
                            ))}
                            <IconButton onClick={() => removeItem(idx)} aria-label="remove">
                                <DeleteIcon />
                            </IconButton>
                        </Box>
                    ))}
                    <Button onClick={addItem} size="small" variant="outlined">
                        Add Contributor
                    </Button>
                </Box>
            </AccordionDetails>
        </Accordion>
    );
}

export function OverviewField({
    label,
    value,
    requirements,
    onChange,
    onItemFocus,
    onItemBlur,
    onAddImage,
    onRemoveImage,
}: OverviewFieldProps) {

    const updateImage = (idx: number, newVal: string) => {
        const images = [...value.images];
        images[idx] = newVal;
        onChange({ ...value, images });
    };

    const addImage = () => {
        const oldValue = value;
        const newValue = { ...value, images: [...value.images, ""] };
        if (onAddImage) {
            onAddImage(oldValue, newValue);
        } else {
            onChange(newValue);
        }
    };

    const removeImage = (idx: number) => {
        const oldValue = value;
        const images = value.images.filter((_, i) => i !== idx);
        const newValue = { ...value, images };
        if (onRemoveImage) {
            onRemoveImage(oldValue, newValue);
        } else {
            onChange(newValue);
        }
    };

    return (
        <Accordion
            disableGutters
            sx={{
                "&:before": { display: "none" },
                boxShadow: "none",
                border: "1px solid #494949",
                mb: 1,
                borderRadius: "8px",
                background: "#121212",
                marginBottom: "15px",
            }}
        >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ color: "#b8b8b8" }}>{label}</Typography>
            </AccordionSummary>

            <AccordionDetails>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {/* Description */}
                    <TextField
                        label="Description"
                        variant="standard"
                        fullWidth
                        multiline
                        value={value.description}
                        error={requirements ? isFieldInvalid("description", value.description, requirements) : false}
                        onFocus={() => onItemFocus?.("description", value.description)}
                        onChange={(e) =>
                            onChange({ ...value, description: e.target.value })
                        }
                        onBlur={(e) =>
                            onItemBlur?.("description", e.target.value)
                        }
                    />

                    {/* Images */}
                    <Typography variant="subtitle2" sx={{ color: "#999" }}>
                        Images
                    </Typography>

                    {value.images.map((img, idx) => (
                        <Box key={idx} sx={{ display: "flex", gap: 1 }}>
                            <TextField
                                fullWidth
                                variant="standard"
                                value={img}
                                error={requirements ? isFieldInvalid(`images.${idx}`, img, requirements) : false}
                                onFocus={() =>
                                    onItemFocus?.("images", value.images)
                                }
                                onChange={(e) =>
                                    updateImage(idx, e.target.value)
                                }
                                onBlur={() =>
                                    onItemBlur?.("images", value.images)
                                }
                            />
                            <IconButton onClick={() => removeImage(idx)}>
                                <DeleteIcon />
                            </IconButton>
                        </Box>
                    ))}

                    <Button
                        onClick={addImage}
                        size="small"
                        variant="outlined"
                        sx={{ alignSelf: "flex-start" }}
                    >
                        Add Image
                    </Button>
                </Box>
            </AccordionDetails>
        </Accordion>
    );
}

export function TagField({ value, onChange }: TagFieldProps) {
    const { tags, addTag } = useTags();

    const handleChange = (_: any, newValue: string[]) => {
        newValue.forEach((tag) => addTag(tag));
        onChange(newValue);
    };

    const handleDelete = (tagToDelete: string) => {
        onChange(value.filter((tag) => tag !== tagToDelete));
    };

    return (
        <Autocomplete
            sx={{
                "&:before": { display: "none" },
                marginBottom: "15px",
                marginTop: "7px",
                background: "#121212",
            }}
            multiple
            freeSolo
            options={tags}
            value={value}
            onChange={handleChange}
            renderValue={(selected) => (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {selected.map((tag) => (
                        <Chip
                            key={tag}
                            label={tag}
                            variant="outlined"
                            onDelete={() => handleDelete(tag)}
                        />
                    ))}
                </div>
            )}
            renderInput={(params) => <TextField {...params} label="Tags" placeholder="Add tags..." />}
        />
    );
};

export function NumberField({
    label,
    value,
    requirements,
    fieldKey,
    onChange,
    onFocus,
    onBlur,
}: NumberFieldProps) {
    const invalid = requirements ? isFieldInvalid(fieldKey, value, requirements) : false;

    return (
        <TextField
            sx={{
                "&:before": { display: "none" },
                boxShadow: "none",
                mb: 1,
                borderRadius: "8px",
                background: "#121212",
            }}
            type="number"
            margin="dense"
            fullWidth
            label={label}
            value={value ?? ""}
            error={invalid}
            onChange={(e) => {
                const newValue = e.target.value === "" ? null : Number(e.target.value);
                if (newValue === null || !isNaN(newValue)) {
                    onChange(newValue as number);
                }
            }}
            onFocus={onFocus}
            onBlur={(e) => {
                const finalValue = e.target.value === "" ? null : Number(e.target.value);
                if (onBlur && finalValue !== null && !isNaN(finalValue)) {
                    onBlur(finalValue);
                }
            }}
        />
    );
}

export function EnumFieldObject<T extends { _internalId: string, name: string }>({
    label,
    value,
    options,
    requirements,
    fieldKey,
    onChange,
}: {
    label: string;
    value: T | null;
    options: T[];
    requirements: FieldRequirements;
    fieldKey: string;
    onChange: (newVal: T) => void;
}) {
    const invalid = requirements ? isFieldInvalid(fieldKey, value, requirements) : false;
    const valid = options.some(o => o.name === value?.name);
    const currentValue = valid ? value!.name : "";

    return (
        <FormControl fullWidth margin="dense" sx={{ mb: 1, borderRadius: "8px", background: "#121212" }}>
            <InputLabel>{label}</InputLabel>
            <Select
                value={currentValue}
                label={label}
                error={invalid}
                onChange={(e) => {
                    const selected = options.find((o) => o.name === e.target.value);
                    if (selected) onChange(selected);
                }}
            >
                {options.map((option) => (
                    <MenuItem key={option.name} value={option.name}>
                        {option.name}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}

export function MultiSelectTechnicalAssetsField({
    label,
    value,
    options,
    requirements,
    fieldKey,
    onChange,
}: MultiSelectFieldProps) {
    const selectedNames = value.map((v) => v.name);

    const invalid = requirements ? isFieldInvalid(fieldKey, value, requirements) : false;

    return (
        <FormControl fullWidth margin="dense" sx={{ mb: 1, borderRadius: "8px", background: "#121212" }}>
            <InputLabel>{label}</InputLabel>
            <Select
                multiple
                value={selectedNames}
                label={label}
                renderValue={(selected) => (selected as string[]).join(", ")}
                error={invalid}
                onChange={(e) => {
                    const selectedNames = e.target.value as string[];
                    const selectedAssets = options.filter((o) => selectedNames.includes(o.name));
                    onChange(selectedAssets);
                }}
            >
                {options.map((option) => (
                    <MenuItem key={option.name} value={option.name}>
                        <Checkbox checked={selectedNames.includes(option.name)} />
                        <ListItemText primary={option.name} />
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}


export function HistoryStringField<
    T extends Record<string, any>,
    K extends keyof T
>({
    assetId,
    fieldKey,
    label,
    value,
    requirements,
    updateField,
    history,
}: HistoryStringFieldProps<T, K>) {
    const { handleFocus, handleBlur } = useHistoryField<string>(
        (value ?? "") as string,
        (v) => updateField(assetId, fieldKey, v as T[K]),
        history
    );

    return (
        <StringField
            key={String(fieldKey)}
            label={label}
            value={(value ?? "") as string}
            requirements={requirements}
            fieldKey={fieldKey as string}
            onChange={(v) => updateField(assetId, fieldKey, v as T[K])}
            onFocus={handleFocus}
            onBlur={() => handleBlur((value ?? "") as string)}
        />
    );
}

export const isFieldInvalid = (
    field: string,
    value: any,
    requiredFields: Record<string, boolean>
): boolean => {
    let isRequired = requiredFields[field];
    if (isRequired === undefined && field.includes('.')) {
        const parts = field.split('.');
        const nestedFieldName = parts[parts.length - 1];
        isRequired = requiredFields[nestedFieldName];
    }

    if (!isRequired) return false;
    if (Array.isArray(value)) {
        return value.length === 0;
    }
    return value === "" || value === null || value === undefined;
};

export function MultiStringField({
    label,
    values,
    requirements,
    fieldKey,
    onChange,
    onItemFocus,
    onItemBlur,
}: MultiStringFieldProps) {
    const addItem = () => {
        onChange([...values, ""]);
    };

    const removeItem = (idx: number) => {
        onChange(values.filter((_, i) => i !== idx));
    };

    const handleChange = (index: number, newValue: string) => {
        const updated = [...values];
        updated[index] = newValue;
        onChange(updated);
    };

    const handleBlur = (index: number) => {
        onItemBlur?.(index, [...values]);
    };

    return (
        <FormControl
            fullWidth
            margin="dense"
            sx={{
                "&:before": { display: "none" },
                boxShadow: "none",
                mb: 1,
                borderRadius: "8px",
                background: "#121212",
            }}
        >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, margin: "10px" }}>
                {values.map((val, idx) => {
                    const invalid = requirements
                        ? isFieldInvalid(`${fieldKey}.${idx}`, val, requirements)
                        : false;

                    return (
                        <Box key={idx} sx={{ display: "flex", gap: 1 }}>
                            <TextField
                                fullWidth
                                variant="standard"
                                value={val}
                                error={invalid}
                                onChange={(e) => handleChange(idx, e.target.value)}
                                onFocus={() => onItemFocus?.(idx, [...values])}
                                onBlur={() => handleBlur(idx)}
                            />

                            <IconButton
                                onClick={() => removeItem(idx)}
                                aria-label="remove"
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Box>
                    );
                })}

                <Button
                    onClick={addItem}
                    size="small"
                    variant="outlined"
                    sx={{ alignSelf: "flex-start" }}
                >
                    Add {label.slice(0, -1)}
                </Button>
            </Box>
        </FormControl>
    );
}
