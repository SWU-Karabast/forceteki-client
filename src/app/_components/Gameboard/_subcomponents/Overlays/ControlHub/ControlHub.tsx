import React from "react";
import { Box, IconButton } from "@mui/material";
import { Settings, Menu } from "@mui/icons-material";

const ControlHub: React.FC<ControlHub> = ({ sidebarOpen, toggleSidebar }) => {
  return (
    <Box
      sx={{
        position: "absolute",
        top: 10,
        right: 10,
        display: "flex",
        alignItems: "center",
        zIndex: 1,
      }}
    >
      <IconButton>
        <Settings sx={{ color: "#fff" }} />
      </IconButton>
      {!sidebarOpen && (
        <IconButton onClick={toggleSidebar}>
          <Menu sx={{ color: "#fff" }} />
        </IconButton>
      )}
    </Box>
  );
};

export default ControlHub;
