import { TextField, FormControl, InputLabel } from "@mui/material";
import { Select, MenuItem, Button } from "@mui/material";
import type { DataAsset } from "@components/types/threagileComponents";

interface AssetTextFieldProps<K extends keyof DataAsset> {
    asset: DataAsset;
    field: K;
    label: string;
    updateDataAsset: (id: string, field: K, value: DataAsset[K]) => void;
}

interface AssetSelectProps<K extends keyof DataAsset> {
    asset: DataAsset;
    field: K;
    options: string[];
    label: string;
    updateDataAsset: (id: string, field: K, value: DataAsset[K]) => void;
}

interface AssetDeleteProps {
    asset: DataAsset;
    deleteDataAsset: (id: string) => void;
}

export const DataAssetTextField = <K extends keyof DataAsset>({
    asset,
    field,
    label,
    updateDataAsset,
}: AssetTextFieldProps<K>) => (
    <TextField
        label={label}
        value={asset[field] ?? ""}
        fullWidth
        margin="dense"
        onChange={(e) => updateDataAsset(asset._internalId, field, e.target.value as DataAsset[K])}
    />
);

export const DataAssetSelect = <K extends keyof DataAsset>({
    asset,
    field,
    options,
    label,
    updateDataAsset,
}: AssetSelectProps<K>) => (
    <FormControl fullWidth margin="dense">
        <InputLabel>{label}</InputLabel>
        <Select
            value={asset[field] ?? ""}
            label={label}
            onChange={(e) =>
                updateDataAsset(asset._internalId, field, e.target.value as DataAsset[K])
            }
        >
            {options.map((option) => (
                <MenuItem key={option} value={option}>
                    {option}
                </MenuItem>
            ))}
        </Select>
    </FormControl>
);

export const DataAssetDelete = ({ asset, deleteDataAsset }: AssetDeleteProps) => {
    return (
        <Button
            variant="outlined"
            color="error"
            onClick={() => deleteDataAsset(asset._internalId)}
            sx={{ mt: 1 }}
        >
            Delete
        </Button>
    );
};