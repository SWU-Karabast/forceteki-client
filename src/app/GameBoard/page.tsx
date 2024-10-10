/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useState, useRef, useEffect } from "react";
import { Box } from "@mui/material";
import Grid from "@mui/material/Grid2";

import ChatDrawer from "../_components/Gameboard/_subcomponents/Overlays/ChatDrawer/ChatDrawer";
import OpponentCardTray from "../_components/Gameboard/OpponentCardTray/OpponentCardTray";
import Board from "../_components/Gameboard/Board/Board";
import PlayerCardTray from "../_components/Gameboard/PlayerCardTray/PlayerCardTray";
import ResourcesOverlay from "../_components/Gameboard/_subcomponents/Overlays/ResourcesOverlay/ResourcesOverlay";
import { mockOpponent } from "../_constants/mockData";
import { usePlayer } from "../_contexts/Player.context";
import { useSidebar } from "../_contexts/Sidebar.context";

const GameBoard = () => {
	const { activePlayer } = usePlayer();
	const { sidebarOpen, toggleSidebar } = useSidebar();
	const [chatMessage, setChatMessage] = useState("");
	const [chatHistory, setChatHistory] = useState<string[]>([]);
	const [round, setRound] = useState(2);
	const drawerRef = useRef<HTMLDivElement | null>(null);
	const [drawerWidth, setDrawerWidth] = useState(0);

	// State for resource selection
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [resourceSelection, setResourceSelection] = useState(false);
	const [totalResources, setTotalResources] = useState(2);
	const [availableResources, setAvailableResources] = useState(0);

	// State for card management
	const [availableCards, setAvailableCards] = useState<FaceCardProps[]>(
		activePlayer.cards
	);
	const [selectedResourceCards, setSelectedResourceCards] = useState<
		FaceCardProps[]
	>([]);

	// States for played cards
	const [playedGroundCards, setPlayedGroundCards] = useState<{
		player: FaceCardProps[];
		opponent: FaceCardProps[];
	}>({ player: [], opponent: [] });

	const [playedSpaceCards, setPlayedSpaceCards] = useState<{
		player: FaceCardProps[];
		opponent: FaceCardProps[];
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

	// Handler to select a card for resource selection
	const handleSelectResourceCard = (card: FaceCardProps) => {
		if (resourceSelection && activePlayer.type === "player") {
			if (availableResources < totalResources) {
				// Check resource limit
				setSelectedResourceCards((prev) => [...prev, card]);
				setAvailableResources((prev) => prev + 1); // Increment available resources
				setAvailableCards((prev) => prev.filter((c) => c.id !== card.id));
				if (availableResources + 1 >= totalResources) {
					setResourceSelection(false);
				}
			}
		}
	};

	// Function to handle playing a card from the hand to the board
	const handlePlayCard = (card: FaceCardProps) => {
		if (availableResources > 0 && activePlayer.type === "player") {
			if (card.unitType === "ground") {
				setPlayedGroundCards((prev) => ({
					...prev,
					player: [...prev.player, card],
				}));
			} else if (card.unitType === "space") {
				setPlayedSpaceCards((prev) => ({
					...prev,
					player: [...prev.player, card],
				}));
			}
			// Remove played card from availableCards
			setAvailableCards((prev) => prev.filter((c) => c.id !== card.id));
			// Optionally, decrement availableResources if playing a card consumes resources
			// setAvailableResources((prev) => prev - 1);
		}
	};

	// Pre-populate opponent's played cards only once
	const opponentCardsInitialized = useRef(false);

	useEffect(() => {
		if (!opponentCardsInitialized.current) {
			const groundCard = mockOpponent.cards.find(
				(card) => card.unitType === "ground"
			);
			const spaceCard = mockOpponent.cards.find(
				(card) => card.unitType === "space"
			);
			if (groundCard) {
				setPlayedGroundCards((prev) => ({
					...prev,
					opponent: [...prev.opponent, groundCard],
				}));
			}
			if (spaceCard) {
				setPlayedSpaceCards((prev) => ({
					...prev,
					opponent: [...prev.opponent, spaceCard],
				}));
			}
			opponentCardsInitialized.current = true;
		}
	}, [activePlayer]);

	return (
		<Grid container sx={{ height: "100vh" }}>
			<Box
				component="main"
				sx={{
					flexGrow: 1,
					transition: "margin-right 0.3s ease",
					marginRight: sidebarOpen ? `${drawerWidth}px` : "0",
					height: "100vh",
					position: "relative",
				}}
			>
				<OpponentCardTray participant={mockOpponent} />
				<Board
					sidebarOpen={sidebarOpen}
					playedGroundCards={playedGroundCards}
					playedSpaceCards={playedSpaceCards}
					participant={activePlayer}
				/>
				<PlayerCardTray
					participant={activePlayer}
					handleModalToggle={handleModalToggle}
					availableCards={availableCards}
					onSelectCard={handleSelectResourceCard}
					resourceSelection={resourceSelection}
					setResourceSelection={setResourceSelection}
					availableResources={availableResources}
					totalResources={totalResources}
					handlePlayCard={handlePlayCard}
					selectedResourceCards={selectedResourceCards}
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
		</Grid>
	);
};

export default GameBoard;
