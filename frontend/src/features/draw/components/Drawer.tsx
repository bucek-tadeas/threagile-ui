/*

Sidebar interface

*/

import { Drawer, type DrawerProps } from "@mui/material"

const DRAWERWIDTH = "15%";

export const DrawerComponent = ({ children, ...props }: DrawerProps) => {
    return (
        <Drawer
            {...props}
            variant="permanent"
            sx={{
                width: DRAWERWIDTH,
                [`& .MuiDrawer-paper`]: { width: DRAWERWIDTH, boxSizing: "border-box" },
            }}
        >
            {children}
        </Drawer>
    );
};
