/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useState, useRef, useEffect, useContext } from "react";
import { Box, Grid2 as Grid } from "@mui/material";
import ChatDrawer from "../_components/Gameboard/_subcomponents/Overlays/ChatDrawer/ChatDrawer";
import OpponentCardTray from "../_components/Gameboard/OpponentCardTray/OpponentCardTray";
import Board from "../_components/Gameboard/Board/Board";
import PlayerCardTray from "../_components/Gameboard/PlayerCardTray/PlayerCardTray";
import ResourcesOverlay from "../_components/Gameboard/_subcomponents/Overlays/ResourcesOverlay/ResourcesOverlay";
import BasicPrompt from "../_components/Gameboard/_subcomponents/Overlays/Prompts/BasicPrompt";
import { mockOpponent } from "../_constants/mockData";
import { usePlayer } from "../_contexts/Player.context";
import { useSidebar } from "../_contexts/Sidebar.context";
import { CardData } from "../_components/Gameboard/GameboardTypes";

const GameBoard = () => {
	const { activePlayer, connectedPlayer, gameState } = usePlayer();
	const { sidebarOpen, toggleSidebar } = useSidebar();
	const [chatMessage, setChatMessage] = useState("");
	const [chatHistory, setChatHistory] = useState<string[]>([]);
	const [round, setRound] = useState(2);
	const drawerRef = useRef<HTMLDivElement | null>(null);
	const [drawerWidth, setDrawerWidth] = useState(0);

	// State for resource selection
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isBasicPromptOpen, setBasicPromptOpen] = useState(false);
	const [resourceSelection, setResourceSelection] = useState(false);
	const [totalResources, setTotalResources] = useState(2);
	const [availableResources, setAvailableResources] = useState(0);

	// State for card management
	const [selectedResourceCards, setSelectedResourceCards] = useState<
		CardData[]
	>([]);

	// States for played cards
	const [playedGroundCards, setPlayedGroundCards] = useState<{
		player: CardData[];
		opponent: CardData[];
	}>({ player: [], opponent: [] });

	const [playedSpaceCards, setPlayedSpaceCards] = useState<{
		player: CardData[];
		opponent: CardData[];
	}>({ player: [], opponent: [] });

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

	const handleBasicPromptToggle = () => {
		setBasicPromptOpen(!isBasicPromptOpen);
	};

	// ----------------------Styles-----------------------------//

	const mainBoxStyle = {
		flexGrow: 1,
		transition: "margin-right 0.3s ease",
		mr: sidebarOpen ? `${drawerWidth}px` : "0",
		height: "100vh",
		position: "relative",
	};

	return (
		<Grid container sx={{ height: "100vh" }}>
			<Box component="main" sx={mainBoxStyle}>
				<OpponentCardTray participant={mockOpponent} />
				<Board
					sidebarOpen={sidebarOpen}
					playedGroundCards={playedGroundCards}
					playedSpaceCards={playedSpaceCards}
					participant={activePlayer}
				/>
				<PlayerCardTray
					trayPlayer={connectedPlayer}
					handleModalToggle={handleModalToggle}
					handleBasicPromptToggle={handleBasicPromptToggle}
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
			<BasicPrompt
				isBasicPromptOpen={isBasicPromptOpen}
				handleBasicPromptToggle={handleBasicPromptToggle}
			/>
		</Grid>
	);
};

export default GameBoard;
