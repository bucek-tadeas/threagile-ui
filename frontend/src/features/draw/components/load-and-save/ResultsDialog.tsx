import React from "react";
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";

export interface ResultsDialogProps {
    open: boolean;
    onClose: () => void;
    executionResults: any;
}

export const ResultsDialog: React.FC<ResultsDialogProps> = ({ open, onClose, executionResults }) => (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Threat Model Execution Results</DialogTitle>

        <DialogContent dividers>
            {executionResults && (
                <Box>
                    <Box mb={2}>
                        <strong>Overall Status:</strong> {executionResults.success ? "✓ Success" : "✗ Failed"}
                    </Box>

                    {executionResults.error && (
                        <Box mb={2} sx={{ color: "error.main" }}>
                            <strong>Error:</strong> {executionResults.error}
                        </Box>
                    )}

                    {executionResults.execution_results && Object.keys(executionResults.execution_results).length > 0 && (
                        <Box>
                            <strong>Execution Details:</strong>
                            {executionResults.execution_results.local && (
                                <Box mt={1} p={1} sx={{ border: "1px solid #ddd", borderRadius: 1, mb: 1 }}>
                                    <Box>
                                        <strong>Local Storage:</strong> {executionResults.execution_results.local.success ? "✓ Success" : "✗ Failed"}
                                        {executionResults.execution_results.local.error_code && (
                                            <Box sx={{ fontSize: "0.85em", color: "text.secondary" }}>
                                                Code: {executionResults.execution_results.local.error_code}
                                            </Box>
                                        )}
                                    </Box>
                                    <Box mt={0.5} sx={{ fontSize: "0.9em", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: "200px", overflow: "auto", backgroundColor: "#0c0404", p: 1, borderRadius: 0.5 }}>
                                        {executionResults.execution_results.local.message}
                                    </Box>
                                </Box>
                            )}

                            {executionResults.execution_results.github && (
                                <Box mt={1} p={1} sx={{ border: "1px solid #ddd", borderRadius: 1 }}>
                                    <Box>
                                        <strong>GitHub Storage:</strong> {executionResults.execution_results.github.success ? "✓ Success" : "✗ Failed"}
                                        {executionResults.execution_results.github.error_code && (
                                            <Box sx={{ fontSize: "0.85em", color: "text.secondary" }}>
                                                Code: {executionResults.execution_results.github.error_code}
                                            </Box>
                                        )}
                                    </Box>
                                    {executionResults.execution_results.github.source_branch && (
                                        <Box mt={0.5} sx={{ fontSize: "0.9em" }}>
                                            Source branch: {executionResults.execution_results.github.source_branch}
                                        </Box>
                                    )}
                                    {executionResults.execution_results.github.target_branch && (
                                        <Box mt={0.5} sx={{ fontSize: "0.9em" }}>
                                            Target branch: {executionResults.execution_results.github.target_branch}
                                        </Box>
                                    )}
                                    {executionResults.execution_results.github.pull_request_url && (
                                        <Box mt={0.5} sx={{ fontSize: "0.9em" }}>
                                            Pull request: <a href={executionResults.execution_results.github.pull_request_url} target="_blank" rel="noopener noreferrer">{executionResults.execution_results.github.pull_request_url}</a>
                                        </Box>
                                    )}
                                    <Box mt={0.5} sx={{ fontSize: "0.9em", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: "200px", overflow: "auto", backgroundColor: "#0c0404", p: 1, borderRadius: 0.5 }}>
                                        {executionResults.execution_results.github.message}
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>
            )}
        </DialogContent>

        <DialogActions>
            <Button variant="contained" onClick={onClose}>Close</Button>
        </DialogActions>
    </Dialog>
);
