/*

Index for the welcome page

*/

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { APIClient } from "@api/apiClient";
import { Button, Box } from "@mui/material";

const api = new APIClient();

const WelcomePage = () => {
  const navigate = useNavigate();
  const [authUrl, setAuthUrl] = useState("");

  useEffect(() => {
    api.getGithubAuthUrl()
      .then(data => setAuthUrl(data.url))
      .catch(err => console.error("Failed to load GitHub URL:", err));
  }, []);

  return (
    <Box>
      <h1>Welcome</h1>
      <Button onClick={() => navigate("/draw")}>Go to Draw</Button>
      <Button onClick={() => {
        if (authUrl) {
          window.location.href = authUrl;
        }
      }}>Github</Button>
    </Box>
  );
};

export default WelcomePage;