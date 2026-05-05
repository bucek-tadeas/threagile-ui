/* eslint-disable react-refresh/only-export-components */
/*

Global notification system using MUI Snackbar/Alert.

Provides a NotificationProvider that wraps the app and a useNotification hook that exposes
showNotification(message, severity, title) to display toast-style messages from anywhere.

*/

import React, { createContext, useContext, useState, useCallback } from "react";
import { Snackbar, Alert, AlertTitle, Box } from "@mui/material";

type NotificationSeverity = "error" | "warning" | "info" | "success";

interface Notification {
    message: string;
    severity: NotificationSeverity;
    title?: string;
}

interface NotificationContextType {
    showNotification: (message: string, severity?: NotificationSeverity, title?: string) => void;
}

const NotificationContext = createContext<NotificationContextType>({
    showNotification: () => { },
});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notification, setNotification] = useState<Notification | null>(null);
    const [open, setOpen] = useState(false);

    const showNotification = useCallback((message: string, severity: NotificationSeverity = "error", title?: string) => {
        setNotification({ message, severity, title });
        setOpen(true);
    }, []);

    const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === "clickaway") return;
        setOpen(false);
    };

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            <Snackbar
                open={open}
                autoHideDuration={8000}
                onClose={handleClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    onClose={handleClose}
                    severity={notification?.severity ?? "error"}
                    variant="filled"
                    sx={{ width: "100%", maxWidth: 600, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                    {notification?.title && <AlertTitle>{notification.title}</AlertTitle>}
                    <Box>{notification?.message}</Box>
                </Alert>
            </Snackbar>
        </NotificationContext.Provider>
    );
};
