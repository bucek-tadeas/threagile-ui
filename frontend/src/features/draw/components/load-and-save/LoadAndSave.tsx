/*

Handle files. Options to load files and direct access to the filesystem or optional fallback if the browser doesn't support this functionality.
To handle files, 8 functions are implemented: handleLoad, handleSave, handleSaveAs, handleFileChange, handleExecute, handleGithubRepoChange, handleGithubBranchChange, handleExecuteConfirm 

*/

import React, { useRef, useCallback, useState, useEffect } from "react";
import { serializeGraph } from "./utils/serialize";
import { deserializeGraph } from "./utils/deserialize";
import { validateDiagramFile } from "./utils/validation";
import { Box, Grid, Button, Alert, AlertTitle } from "@mui/material";
import yaml from "js-yaml";
import type { CommonInformation, CommonDiagram } from "@components/types/threagileComponents";
import type { DiagramFile } from "./utils/diagramInterface";
import { useDataAssets, useRisksIdentified, useSharedRuntimes, useRiskTracking, useIndividualRiskCategories } from "@context/ThreatModelContext";
import { validateStrictDiagramModel, type StrictModel } from "../execute/strictValidation";
import { serializeToThreagileYAML } from "../execute/serialize";
import { APIClient } from "@api/apiClient";
import { ApiErrorHandler } from "@api/errorHandler";
import { ExecuteDialog } from "./ExecuteDialog";
import { ResultsDialog } from "./ResultsDialog";

const apiClient = new APIClient();

type LoadAndSaveProps = {
    graph: any;
    commonInformation: CommonInformation;
    setCommonInformation: React.Dispatch<React.SetStateAction<CommonInformation>>;
    common_diagram: CommonDiagram;
    setCommonDiagram: React.Dispatch<React.SetStateAction<CommonDiagram>>;
};

function deleteAllFields(providers: {
    riskTrackingProvider: ReturnType<typeof useRiskTracking>,
    individualRiskCategoriesProvider: ReturnType<typeof useIndividualRiskCategories>,
    sharedRuntimesProvider: ReturnType<typeof useSharedRuntimes>,
    dataAssetProvider: ReturnType<typeof useDataAssets>,
    risksIdentifiedProvider: ReturnType<typeof useRisksIdentified>,
}) {
    const { riskTrackingProvider, individualRiskCategoriesProvider, sharedRuntimesProvider, dataAssetProvider, risksIdentifiedProvider } = providers;
    riskTrackingProvider.deleteAllElements();
    individualRiskCategoriesProvider.deleteAllElements();
    sharedRuntimesProvider.deleteAllElements();
    dataAssetProvider.deleteAllElements();
    risksIdentifiedProvider.deleteAllElements();
}

export const LoadAndSave: React.FC<LoadAndSaveProps> = ({ graph, commonInformation, setCommonInformation, common_diagram, setCommonDiagram }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);

    const riskTrackingProvider = useRiskTracking();
    const individualRiskCategoriesProvider = useIndividualRiskCategories();
    const sharedRuntimesProvider = useSharedRuntimes();
    const dataAssetProvider = useDataAssets();
    const risksIdentifiedProvider = useRisksIdentified();

    const [showExecuteDialog, setShowExecuteDialog] = useState(false);
    const [saveDest, setSaveDest] = useState<("local" | "server" | "github")[]>([]);
    const [availableMethods, setAvailableMethods] = useState<("local" | "server" | "github")[]>(["local", "server", "github"]);
    const [localPath, setLocalPath] = useState("");
    const [githubRepo, setGithubRepo] = useState("");
    const [githubBranch, setGithubBranch] = useState("");
    const [githubFilePath, setGithubFilePath] = useState("");
    const [yamlModel, setYamlModel] = useState("");
    const [localBasePaths, setLocalBasePaths] = useState<string[]>([]);
    const [githubReposList, setGithubReposList] = useState<string[]>([]);
    const [githubBranchesList, setGithubBranchesList] = useState<string[]>([]);
    const [githubFilesList, setGithubFilesList] = useState<string[]>([]);
    const [githubOverwriteConfirmed, setGithubOverwriteConfirmed] = useState(false);
    const [selectedBasePath, setSelectedBasePath] = useState("");
    const [modelName, setModelName] = useState("threatmodel.yaml");
    const [showResultsDialog, setShowResultsDialog] = useState(false);
    const [executionResults, setExecutionResults] = useState<any>(null);
    const [showErrorAlert, setShowErrorAlert] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [errorCode, setErrorCode] = useState<string>("");
    const [isLoadingGithub, setIsLoadingGithub] = useState(false);
    const [githubLoadingMessage, setGithubLoadingMessage] = useState("");
    const [isExecuting, setIsExecuting] = useState(false);

    useEffect(() => {
        if (showExecuteDialog) {
            (async () => {
                try {
                    const { methods } = await apiClient.getExecutionMethods();
                    setAvailableMethods(methods as ("local" | "server" | "github")[]);

                    if (methods.includes("server")) {
                        const { paths } = await apiClient.getLocalPaths();
                        setLocalBasePaths(paths);
                        if (paths.length > 0) {
                            setSelectedBasePath(paths[0]);
                        }
                    }
                } catch (error: any) {
                    console.error("Failed to fetch execution methods:", error);
                    setAvailableMethods(["local", "server", "github"]);
                }
            })();
        }
    }, [showExecuteDialog]);

    useEffect(() => {
        if (showExecuteDialog && saveDest.includes("github")) {
            (async () => {
                setIsLoadingGithub(true);
                setGithubLoadingMessage("Fetching GitHub repositories, please wait...");
                try {
                    await apiClient.getCurrentUser();
                    const { repos } = await apiClient.getGithubRepos();
                    setGithubReposList(repos);
                } catch (error: any) {
                    if (error.success === false) {
                        setErrorCode(error.error_code || "GITHUB_ERROR");
                        setErrorMessage(ApiErrorHandler.formatErrorMessage(error));
                        setShowErrorAlert(true);
                    } else {
                        localStorage.setItem("unsaved-diagram", JSON.stringify(serializeGraph(graph, commonInformation, common_diagram, { riskTrackingProvider, individualRiskCategoriesProvider, sharedRuntimesProvider, dataAssetProvider, risksIdentifiedProvider }
                        )));
                        try {
                            const { url } = await apiClient.getGithubAuthUrl();
                            window.location.href = url;
                        } catch (authError) {
                            setErrorMessage("Failed to initialize GitHub authentication");
                            setErrorCode("AUTH_INIT_ERROR");
                            setShowErrorAlert(true);
                        }
                    }
                } finally {
                    setIsLoadingGithub(false);
                    setGithubLoadingMessage("");
                }
            })();
        }
    }, [showExecuteDialog, saveDest]);

    const handleLoad = useCallback(async () => {
        try {
            if (!("showOpenFilePicker" in window)) {
                alert("Your browser does not support file system access. Please use Chrome or Edge.");
                if (fileInputRef.current) {
                    fileInputRef.current.click();
                }
                return;
            }

            const [handle] = await (window as any).showOpenFilePicker({
                types: [
                    {
                        description: "Threagile Diagram Files",
                        accept: { "application/json": [".json", ".yaml", ".yml"] },
                    },
                ],
                excludeAcceptAllOption: true,
                multiple: false,
            });

            const file = await handle.getFile();
            const text = await file.text();
            const data = text.trim().startsWith("{") ? JSON.parse(text) : yaml.load(text);

            graph.model.beginUpdate();
            try {
                graph.model.clear();
            } finally {
                graph.model.endUpdate();
            }
            deleteAllFields({ riskTrackingProvider, individualRiskCategoriesProvider, sharedRuntimesProvider, dataAssetProvider, risksIdentifiedProvider });
            setFileHandle(handle);
            deserializeGraph(graph, data, setCommonInformation, setCommonDiagram, { riskTrackingProvider, individualRiskCategoriesProvider, sharedRuntimesProvider, dataAssetProvider, risksIdentifiedProvider });
        } catch (err) {
            console.error("File open cancelled or failed:", err);
        }
    }, [graph, setCommonInformation, setCommonDiagram, riskTrackingProvider, individualRiskCategoriesProvider, sharedRuntimesProvider, dataAssetProvider, risksIdentifiedProvider]);

    const handleSave = useCallback(async () => {
        const data = serializeGraph(graph, commonInformation, common_diagram, { riskTrackingProvider, individualRiskCategoriesProvider, sharedRuntimesProvider, dataAssetProvider, risksIdentifiedProvider });
        const json = JSON.stringify(data, null, 2);

        try {
            if (!("showSaveFilePicker" in window)) {
                const blob = new Blob([json], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "diagram.json";
                a.click();
                URL.revokeObjectURL(url);
                return;
            }

            let handle = fileHandle;
            if (!handle) {
                handle = await (window as any).showSaveFilePicker({
                    suggestedName: "diagram.json",
                    types: [
                        {
                            description: "Threagile Diagram Files",
                            accept: { "application/json": [".json"] },
                        },
                    ],
                });
                setFileHandle(handle);
            }

            if (handle) {
                const writable = await handle.createWritable();
                await writable.write(json);
                await writable.close();
            }
        } catch (err) {
            console.error("Save failed or cancelled:", err);
        }
    }, [graph, commonInformation, common_diagram, fileHandle, riskTrackingProvider, individualRiskCategoriesProvider, sharedRuntimesProvider, dataAssetProvider, risksIdentifiedProvider]);

    const handleSaveAs = useCallback(async () => {
        const data = serializeGraph(graph, commonInformation, common_diagram, { riskTrackingProvider, individualRiskCategoriesProvider, sharedRuntimesProvider, dataAssetProvider, risksIdentifiedProvider });
        const json = JSON.stringify(data, null, 2);

        try {
            const newHandle = await (window as any).showSaveFilePicker({
                suggestedName: "diagram.json",
                types: [
                    {
                        description: "Threagile Diagram Files",
                        accept: { "application/json": [".json"] },
                    },
                ],
            });

            const writable = await newHandle.createWritable();
            await writable.write(json);
            await writable.close();
            setFileHandle(newHandle);
        } catch (err) {
            console.error("Save As failed or cancelled:", err);
        }
    }, [graph, commonInformation, common_diagram, riskTrackingProvider, individualRiskCategoriesProvider, sharedRuntimesProvider, dataAssetProvider, risksIdentifiedProvider]);

    const handleExecute = useCallback(async () => {
        const modelToExecute: StrictModel = {
            graph,
            commonInformation,
            common_diagram,
            riskTracking: riskTrackingProvider.elements,
            individualRiskCategories: individualRiskCategoriesProvider.elements,
            sharedRuntimes: sharedRuntimesProvider.elements,
            dataAssets: dataAssetProvider.elements,
            risksIdentified: risksIdentifiedProvider.elements,
        };

        const result = validateStrictDiagramModel(modelToExecute);
        if (!result.valid) {
            alert("Validation failed:\n" + result.errors.join("\n"));
            return;
        }

        setYamlModel(serializeToThreagileYAML(modelToExecute));

        const { paths } = await apiClient.getLocalPaths();
        setLocalBasePaths(paths);

        setShowExecuteDialog(true);
    }, [
        graph,
        commonInformation,
        common_diagram,
        riskTrackingProvider.elements,
        individualRiskCategoriesProvider.elements,
        sharedRuntimesProvider.elements,
        dataAssetProvider.elements,
        risksIdentifiedProvider.elements,
    ]);

    const handleGithubRepoChange = async (repo: string) => {
        setGithubRepo(repo);
        setGithubBranch("");
        setGithubFilePath("");
        setGithubOverwriteConfirmed(false);
        setGithubBranchesList([]);
        setGithubFilesList([]);

        if (!repo) return;

        setIsLoadingGithub(true);
        setGithubLoadingMessage("Fetching branches, please wait...");
        try {
            const { branches } = await apiClient.getGithubBranches(repo);
            setGithubBranchesList(branches);
        } catch (error: any) {
            const errorMsg = error.success === false
                ? ApiErrorHandler.formatErrorMessage(error)
                : error.message || "Failed to fetch branches";
            setErrorCode(error.error_code || "BRANCHES_FETCH_ERROR");
            setErrorMessage(errorMsg);
            setShowErrorAlert(true);
        } finally {
            setIsLoadingGithub(false);
            setGithubLoadingMessage("");
        }
    };

    const handleGithubBranchChange = async (branch: string) => {
        setGithubBranch(branch);
        setGithubFilePath("");
        setGithubOverwriteConfirmed(false);
        setGithubFilesList([]);

        if (!branch || !githubRepo) return;

        setIsLoadingGithub(true);
        setGithubLoadingMessage("Fetching file paths, this might take a minute...");
        try {
            const { files } = await apiClient.getGithubFiles(githubRepo, branch);
            setGithubFilesList(["", ...files]);
        } catch (error: any) {
            const errorMsg = error.success === false
                ? ApiErrorHandler.formatErrorMessage(error)
                : error.message || "Failed to fetch files";
            setErrorCode(error.error_code || "FILES_FETCH_ERROR");
            setErrorMessage(errorMsg);
            setShowErrorAlert(true);
        } finally {
            setIsLoadingGithub(false);
            setGithubLoadingMessage("");
        }
    };

    const handleExecuteConfirm = useCallback(async () => {
        if (saveDest.includes("github") && !githubOverwriteConfirmed) {
            setErrorCode("GITHUB_OVERWRITE_CONFIRMATION_REQUIRED");
            setErrorMessage("Please confirm that existing files can be overwritten before creating a GitHub pull request.");
            setShowErrorAlert(true);
            return;
        }

        const saveConfig = {
            destination: saveDest,
            final_local_path: `${selectedBasePath}/${localPath}/${modelName}`,
            github_repo: githubRepo,
            github_branch: githubBranch,
            github_file_path: githubFilePath,
            github_overwrite_confirmed: githubOverwriteConfirmed,
            model_name: modelName,
            yaml_model: yamlModel,
        };

        setIsExecuting(true);
        try {
            if (saveDest.includes("local")) {
                const blob = new Blob([yamlModel], { type: "application/x-yaml" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = modelName || "threatmodel.yaml";
                a.click();
                URL.revokeObjectURL(url);
            }

            const result = await apiClient.executeThreatModel(saveConfig);

            if (result.success === false && result.error) {
                setErrorCode(result.error_code || "EXECUTION_ERROR");
                setErrorMessage(ApiErrorHandler.formatErrorMessage(result));
                setShowErrorAlert(true);
            }

            setExecutionResults(result);
            setShowResultsDialog(true);
            setShowExecuteDialog(false);
            setSaveDest([]);
        } catch (error: any) {
            const errorMsg = error.success === false
                ? ApiErrorHandler.formatErrorMessage(error)
                : error.message || "An unexpected error occurred during execution";

            setErrorCode(error.error_code || "EXECUTION_ERROR");
            setErrorMessage(errorMsg);
            setShowErrorAlert(true);

            setExecutionResults({
                success: false,
                execution_results: {},
                error: errorMsg,
            });
            setShowResultsDialog(true);
            setShowExecuteDialog(false);
            setSaveDest([]);
        } finally {
            setIsExecuting(false);
        }
    }, [
        saveDest,
        localPath,
        githubRepo,
        githubBranch,
        githubFilePath,
        githubOverwriteConfirmed,
        modelName,
        selectedBasePath,
        yamlModel
    ]);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const json = yaml.load(text) as object;
                const result = validateDiagramFile(json);
                if (!result.valid) {
                    console.error("Invalid diagram file:", result.errors);
                    alert("Invalid file:\n" + result.errors.join("\n"));
                    return;
                }

                graph.model.beginUpdate();
                try {
                    graph.model.clear();
                } finally {
                    graph.model.endUpdate();
                }
                deleteAllFields({ riskTrackingProvider, individualRiskCategoriesProvider, sharedRuntimesProvider, dataAssetProvider, risksIdentifiedProvider });
                deserializeGraph(graph, json as DiagramFile, setCommonInformation, setCommonDiagram, { riskTrackingProvider, individualRiskCategoriesProvider, sharedRuntimesProvider, dataAssetProvider, risksIdentifiedProvider });
            } catch (err) {
                alert("Error loading diagram file: " + (err as Error).message);
            }
        };
        reader.readAsText(file);
    }, [graph]);

    const toggleDest = (val: "local" | "server" | "github") => {
        setSaveDest(prev =>
            prev?.includes(val)
                ? prev.filter(v => v !== val)
                : [...prev, val]
        );
    };

    return (
        <Box
            p={2}
        >
            <Grid container spacing={2}>
                <Grid><Button variant="contained" color="secondary" onClick={handleLoad}>Load</Button></Grid>
                <Grid><Button variant="contained" color="secondary" onClick={handleSave}>Save</Button></Grid>
                <Grid><Button variant="contained" color="secondary" onClick={handleSaveAs}>Save As</Button></Grid>
                <Grid><Button variant="contained" color="success" onClick={handleExecute}>Execute</Button></Grid>
            </Grid>

            <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept=".json,.xml"
                onChange={handleFileChange}
            />

            <ExecuteDialog
                open={showExecuteDialog}
                onClose={() => setShowExecuteDialog(false)}
                onConfirm={handleExecuteConfirm}
                availableMethods={availableMethods}
                saveDest={saveDest}
                toggleDest={toggleDest}
                modelName={modelName}
                setModelName={setModelName}
                localBasePaths={localBasePaths}
                selectedBasePath={selectedBasePath}
                setSelectedBasePath={setSelectedBasePath}
                localPath={localPath}
                setLocalPath={setLocalPath}
                githubRepo={githubRepo}
                onGithubRepoChange={handleGithubRepoChange}
                githubReposList={githubReposList}
                githubBranch={githubBranch}
                onGithubBranchChange={handleGithubBranchChange}
                githubBranchesList={githubBranchesList}
                githubFilePath={githubFilePath}
                setGithubFilePath={setGithubFilePath}
                githubFilesList={githubFilesList}
                githubOverwriteConfirmed={githubOverwriteConfirmed}
                setGithubOverwriteConfirmed={setGithubOverwriteConfirmed}
                isLoadingGithub={isLoadingGithub}
                githubLoadingMessage={githubLoadingMessage}
                isExecuting={isExecuting}
            />

            {showErrorAlert && (
                <Alert
                    severity="error"
                    onClose={() => setShowErrorAlert(false)}
                    sx={{ mt: 2, mb: 2 }}
                >
                    <AlertTitle>
                        {errorCode ? `Error [${errorCode}]` : "Error"}
                    </AlertTitle>
                    <Box sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {errorMessage}
                    </Box>
                </Alert>
            )}

            <ResultsDialog
                open={showResultsDialog}
                onClose={() => setShowResultsDialog(false)}
                executionResults={executionResults}
            />

        </Box>
    );
};
