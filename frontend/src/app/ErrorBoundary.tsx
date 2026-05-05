/*

React error boundary - catches unhandled render errors and displays a recovery UI
instead of a white screen. Wraps the entire app tree in App.tsx.

*/

import React from "react";
import { Box, Typography, Button } from "@mui/material";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            gap: 2,
            p: 4,
            textAlign: "center",
          }}
        >
          <Typography variant="h5" color="error">
            Something went wrong
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500 }}>
            {this.state.error?.message || "An unexpected error occurred."}
          </Typography>
          <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
            <Button variant="contained" onClick={this.handleReset}>
              Try Again
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                localStorage.removeItem("unsaved-diagram");
                window.location.reload();
              }}
            >
              Reset & Reload
            </Button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}
