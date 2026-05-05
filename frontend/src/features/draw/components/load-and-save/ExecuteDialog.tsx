/*

Execution dialog UI - lets the user choose execution destinations (local download, server, GitHub),
configure paths/repos/branches, and trigger threat model execution against the backend.

*/

import React from "react";
import {
    Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, FormControlLabel, Checkbox, Select, MenuItem,
    InputLabel, FormControl, CircularProgress, Alert,
} from "@mui/material";

export interface ExecuteDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    availableMethods: ("server" | "github")[];
    saveDest: ("server" | "github")[];
    toggleDest: (val: "server" | "github") => void;
    modelName: string;
    setModelName: (v: string) => void;
    localBasePaths: string[];
    selectedBasePath: string;
    setSelectedBasePath: (v: string) => void;
    localPath: string;
    setLocalPath: (v: string) => void;
    githubRepo: string;
    onGithubRepoChange: (repo: string) => void;
    githubReposList: string[];
    githubBranch: string;
    onGithubBranchChange: (branch: string) => void;
    githubBranchesList: string[];
    githubFilePath: string;
    setGithubFilePath: (v: string) => void;
    githubFilesList: string[];
    githubOverwriteConfirmed: boolean;
    setGithubOverwriteConfirmed: (v: boolean) => void;
    isLoadingGithub: boolean;
    githubLoadingMessage: string;
    isExecuting: boolean;
}

export const ExecuteDialog: React.FC<ExecuteDialogProps> = ({
    open, onClose, onConfirm,
    availableMethods, saveDest, toggleDest,
    modelName, setModelName,
    localBasePaths, selectedBasePath, setSelectedBasePath, localPath, setLocalPath,
    githubRepo, onGithubRepoChange, githubReposList,
    githubBranch, onGithubBranchChange, githubBranchesList,
    githubFilePath, setGithubFilePath, githubFilesList,
    githubOverwriteConfirmed, setGithubOverwriteConfirmed,
    isLoadingGithub, githubLoadingMessage, isExecuting,
}) => (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Select execution save options</DialogTitle>

        <DialogContent dividers>
            {availableMethods.includes("server") && (
                <Box>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={saveDest.includes("server")}
                                onChange={() => toggleDest("server")}
                            />
                        }
                        label="Save on backend host"
                    />
                    {saveDest.includes("server") && (
                        <>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Base path</InputLabel>
                                <Select
                                    value={selectedBasePath}
                                    label="Base path"
                                    onChange={(e) => setSelectedBasePath(e.target.value)}
                                >
                                    {localBasePaths.map((item) => (
                                        <MenuItem key={item} value={item}>{item}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                margin="normal"
                                label="Subdirectory path (optional)"
                                value={localPath}
                                onChange={(e) => setLocalPath(e.target.value)}
                            />

                            <TextField
                                fullWidth
                                margin="normal"
                                label="Threat model filename"
                                value={modelName}
                                onChange={(e) => setModelName(e.target.value)}
                            />

                            <Box mt={1}>
                                <strong>Final path:</strong><br />
                                {selectedBasePath}/{localPath}/{modelName}
                            </Box>
                        </>
                    )}
                </Box>
            )}

            {availableMethods.includes("github") && (
                <Box>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={saveDest.includes("github")}
                                onChange={() => toggleDest("github")}
                            />
                        }
                        label="Save in GitHub repository"
                    />
                    {saveDest.includes("github") && (
                        <>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Repo</InputLabel>
                                <Select
                                    value={githubRepo}
                                    onChange={(e) => onGithubRepoChange(e.target.value)}
                                >
                                    {githubReposList.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth margin="normal">
                                <InputLabel>Branch</InputLabel>
                                <Select
                                    value={githubBranch}
                                    onChange={(e) => onGithubBranchChange(e.target.value)}
                                >
                                    {githubBranchesList.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth margin="normal">
                                <InputLabel>Path within repo</InputLabel>
                                <Select
                                    value={githubFilePath}
                                    onChange={(e) => setGithubFilePath(e.target.value)}
                                >
                                    {githubFilesList.map((f) => <MenuItem key={f} value={f}>{f || "(root)"}</MenuItem>)}
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                margin="normal"
                                label="Threat model filename"
                                value={modelName}
                                onChange={(e) => setModelName(e.target.value)}
                            />

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={githubOverwriteConfirmed}
                                        onChange={(e) => setGithubOverwriteConfirmed(e.target.checked)}
                                    />
                                }
                                label="I confirm existing files at these paths can be overwritten"
                            />

                            <Box mt={1}>
                                <strong>Final path:</strong><br />
                                {githubRepo}/{githubFilePath || "(root)"}/{modelName} (branch: {githubBranch})
                            </Box>

                            {isLoadingGithub && (
                                <Alert severity="info" icon={<CircularProgress size={20} />} sx={{ mt: 2 }}>
                                    {githubLoadingMessage}
                                </Alert>
                            )}
                        </>
                    )}
                </Box>
            )}
        </DialogContent>

        <DialogActions>
            <Button onClick={onClose} disabled={isExecuting}>Cancel</Button>
            <Button variant="contained" color="success" onClick={onConfirm} disabled={isLoadingGithub || isExecuting}>
                {isExecuting ? (
                    <>
                        <CircularProgress size={20} sx={{ mr: 1, color: "inherit" }} />
                        Executing &amp; uploading, please wait...
                    </>
                ) : (
                    "Run Threat Model"
                )}
            </Button>
        </DialogActions>
    </Dialog>
);
