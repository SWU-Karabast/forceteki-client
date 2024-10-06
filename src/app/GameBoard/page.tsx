// GameBoard.tsx

"use client";
import React, { useState, useRef, useEffect, use } from "react";
import { Box, IconButton } from "@mui/material";
import { Settings, Menu } from "@mui/icons-material";
import ChatDrawer from "../_components/Gameboard/ChatDrawer/ChatDrawer";
import OpponentCardTray from "../_components/Gameboard/OpponentCardTray/OpponentCardTray";
import Board from "../_components/Gameboard/Board/Board";
import PlayerCardTray from "../_components/Gameboard/PlayerCardTray/PlayerCardTray";
import ResourcesOverlay from "../_components/Gameboard/ResourcesOverlay/ResourcesOverlay";
import { mockPlayer, mockOpponent } from "../_constants/mockData";

const GameBoard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const [activePlayer, setActivePlayer] = useState<Participant>(mockPlayer); // Correct type
  const [round, setRound] = useState(2);

  const drawerRef = useRef<HTMLDivElement | null>(null);
  const [drawerWidth, setDrawerWidth] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resourceSelection, setResourceSelection] = useState(false);

  // State for card management
  const [availableCards, setAvailableCards] = useState<FaceCardProps[]>(
    activePlayer.cards
  );
  const [selectedResourceCards, setSelectedResourceCards] = useState<
    FaceCardProps[]
  >([]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleChatSubmit = () => {
    if (chatMessage.trim()) {
      setChatHistory([...chatHistory, chatMessage]);
      setChatMessage("");
    }
  };

  useEffect(() => {
    // Update the drawer width when the drawer opens or closes
    if (drawerRef.current) {
      setDrawerWidth(drawerRef.current.offsetWidth);
    }
  }, [sidebarOpen]);

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
  };

  // Handler to select a card
  const handleSelectCard = (card: FaceCardProps) => {
    if (resourceSelection && activePlayer.type === "player") {
      setSelectedResourceCards((prev) => [...prev, card]);
      setAvailableCards((prev) => prev.filter((c) => c.id !== card.id));
    }
  };

  const colSpace = 1.2;

  return (
    <Box sx={{ height: "100vh", display: "flex" }}>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          transition: "margin-right 0.3s ease",
          marginRight: sidebarOpen ? `${drawerWidth}px` : "0",
          height: "100%",
          position: "relative",
        }}
      >
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

        <OpponentCardTray participant={mockOpponent} spacing={colSpace} />
        <Board spacing={colSpace} />
        <PlayerCardTray
          participant={activePlayer}
          handleModalToggle={handleModalToggle}
          availableCards={availableCards}
          onSelectCard={handleSelectCard}
          resourceSelection={resourceSelection}
          setResourceSelection={setResourceSelection}
        />
      </Box>

      {sidebarOpen && (
        <ChatDrawer
          ref={drawerRef}
          toggleSidebar={toggleSidebar}
          chatHistory={chatHistory}
          chatMessage={chatMessage}
          setChatMessage={setChatMessage}
          handleChatSubmit={handleChatSubmit}
          sidebarOpen={sidebarOpen}
          currentRound={round}
        />
      )}
      <ResourcesOverlay
        isModalOpen={isModalOpen}
        handleModalToggle={handleModalToggle}
        selectedResourceCards={selectedResourceCards}
      />
    </Box>
  );
};

export default GameBoard;
