/*

Back and forth arrows used for undo/redo

*/

import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import { ArrowBack, ArrowForward } from "@mui/icons-material";
import { HistoryManager } from "../history/HistoryManager";

export const HistoryToolbarButtons: React.FC<{ history: HistoryManager }> = ({ history }) => {
    const [, setVersion] = React.useState(0);

    React.useEffect(() => {
        const unsubscribe = history.subscribe(() => setVersion(v => v + 1));
        return unsubscribe;
    }, [history]);

    return (
        <>
            <Tooltip title="Undo">
                <span>
                    <IconButton
                        color="inherit"
                        onClick={() => history.undo()}
                        disabled={!history.canUndo()}
                    >
                        <ArrowBack />
                    </IconButton>
                </span>
            </Tooltip>
            <Tooltip title="Redo">
                <span>
                    <IconButton
                        color="inherit"
                        onClick={() => history.redo()}
                        disabled={!history.canRedo()}
                    >
                        <ArrowForward />
                    </IconButton>
                </span>
            </Tooltip>
        </>
    );
};

