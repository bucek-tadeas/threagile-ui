/*

Pop up menu which allows user to add different components on the canvas

*/

import { SpeedDial, SpeedDialAction, SpeedDialIcon, Box } from "@mui/material";
import StorageIcon from "@mui/icons-material/Storage";
import PublicIcon from "@mui/icons-material/Public";
import MemoryIcon from "@mui/icons-material/Memory";
import BorderStyleIcon from "@mui/icons-material/BorderStyle";
import { TechnicalAssetVertex } from "@components/VertexAndEdgeInsert";
import { TrustBoundaryVertex } from "@components/VertexAndEdgeInsert";

interface AssetAndLinkMenuProps {
    graph: any;
}

export const AssetAndLinkMenu = ({ graph }: AssetAndLinkMenuProps) => {
    const handleAddAsset = (type: string) => {
        switch (type) {
            case "datastore":
            case "external-entity":
            case "process":
                TechnicalAssetVertex(type, graph, Math.random() * 500, Math.random() * 500);
                break;
            case "trust-boundary":
                TrustBoundaryVertex(graph, Math.random() * 400, Math.random() * 400, 300, 200);
                break;
        }
    };

    const actions = [
        { icon: <StorageIcon />, name: "Technical Asset: Datastore", type: "datastore" },
        { icon: <PublicIcon />, name: "Technical Asset: External Entity", type: "external-entity" },
        { icon: <MemoryIcon />, name: "Technical Asset: Process", type: "process" },
        { icon: <BorderStyleIcon />, name: "Trust Boundary", type: "trust-boundary" },
    ];

    return (
        <Box
            sx={{
                position: "fixed",
                bottom: 16,
                left: 16,
                zIndex: 1500,
            }}
        >
            <SpeedDial
                ariaLabel="Add Asset"
                icon={<SpeedDialIcon />}
                direction="up"
            >
                {actions.map((action) => (
                    <SpeedDialAction
                        key={action.name}
                        icon={action.icon}
                        title={action.name}
                        onClick={() => handleAddAsset(action.type)}
                    />
                ))}
            </SpeedDial>
        </Box>
    );
};
