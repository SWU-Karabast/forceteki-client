import React, { forwardRef } from "react";
import { Drawer, Box, IconButton, TextField } from "@mui/material";
import { Settings, Close, Send } from "@mui/icons-material";

const ChatDrawer = forwardRef<HTMLDivElement, ChatDrawerProps>(
  (
    {
      sidebarOpen,
      toggleSidebar,
      chatHistory,
      chatMessage,
      setChatMessage,
      handleChatSubmit,
      currentRound,
    },
    ref
  ) => {
    return (
      <Drawer
        anchor="right"
        open={sidebarOpen}
        onClose={toggleSidebar}
        variant="persistent"
        sx={{
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            backgroundColor: "rgba(0,0,0,0.8)",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          },
        }}
        PaperProps={{
          ref: ref,
        }}
      >
        <Box sx={{ padding: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={{ margin: 0 }}>ROUND {currentRound}</h3>
            <Box>
              <IconButton>
                <Settings sx={{ color: "#fff" }} />
              </IconButton>
              <IconButton onClick={toggleSidebar}>
                <Close sx={{ color: "#fff" }} />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ mt: 1 }}>
            <p style={{ fontWeight: "bold" }}>Last Played</p>
            <Box
              sx={{
                backgroundColor: "#333",
                height: "150px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <p style={{ color: "#888" }}>Image Placeholder</p>
            </Box>
          </Box>

          <Box sx={{ mt: 2 }}>
            <p>Player 1 has connected.</p>
            <p>Player 2 has connected.</p>
          </Box>

          <Box sx={{ mt: 2 }}>
            <p style={{ fontWeight: "bold" }}>Chat History:</p>
            <Box
              sx={{
                backgroundColor: "#111",
                padding: "10px",
                borderRadius: "4px",
                minHeight: "100px",
                overflowY: "auto",
              }}
            >
              {chatHistory.length > 0 ? (
                chatHistory.map((message, index) => (
                  <p key={index} style={{ color: "#fff" }}>
                    {message}
                  </p>
                ))
              ) : (
                <p style={{ color: "#888" }}>No messages yet.</p>
              )}
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#222",
            padding: "10px",
          }}
        >
          <TextField
            variant="outlined"
            placeholder="Chat"
            value={chatMessage}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setChatMessage(e.target.value)
            }
            onKeyPress={(e: React.KeyboardEvent<HTMLDivElement>) => {
              if (e.key === "Enter") {
                handleChatSubmit();
              }
            }}
            sx={{
              backgroundColor: "#333",
              color: "#fff",
              borderRadius: "4px",
              flexGrow: 1,
              input: { color: "#fff" },
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "#555",
                },
              },
            }}
            InputProps={{
              endAdornment: (
                <IconButton onClick={handleChatSubmit}>
                  <Send sx={{ color: "#fff" }} />
                </IconButton>
              ),
            }}
          />
        </Box>
      </Drawer>
    );
  }
);

export default ChatDrawer;
