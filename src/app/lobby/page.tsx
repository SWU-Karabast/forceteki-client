"use client";
import React, { useState } from "react";
import { Grid2 as Grid } from "@mui/material";
import { usePlayer } from "../_contexts/Player.context";
import { usePathname } from "next/navigation";
import Players from "../_components/Lobby/Players/Players";
import Deck from "../_components/Lobby/Deck/Deck";
import SetUp from "../_components/Lobby/SetUp/SetUp";

const Lobby = () => {
	const { activePlayer, setActivePlayer } = usePlayer();
	const pathname = usePathname();
	const isLobbyView = pathname === "/lobby";

	const [chatMessage, setChatMessage] = useState("");
	const [chatHistory, setChatHistory] = useState<string[]>([]);
	const [playerRoll, setPlayerRoll] = useState(0);
	const [isRolling, setIsRolling] = useState(false);
	const [isRollSame, setIsRollSame] = useState(false);
	const [opponentRoll, setOpponentRoll] = useState(0);

	const handleChatSubmit = () => {
		if (chatMessage.trim()) {
			setChatHistory([...chatHistory, chatMessage]);
			setChatMessage("");
		}
	};

	const handleRollInitiative = () => {
		setIsRolling(true);
		setIsRollSame(false);
		setTimeout(() => {
			const playerDieRoll = Math.floor(Math.random() * 20) + 1;
			const opponentDieRoll = Math.floor(Math.random() * 20) + 1;
			if (playerDieRoll === opponentDieRoll) {
				handleRollInitiative();
				setIsRollSame(true);
				setIsRolling(false);
				return;
			}
			setPlayerRoll(playerDieRoll);
			setOpponentRoll(opponentDieRoll);

			const newInitiative = playerDieRoll > opponentDieRoll;
			setActivePlayer({
				...activePlayer,
				initiative: newInitiative,
			});

			setIsRolling(false);
		}, Math.random() * 3000 + 2000);
	};

	return (
		<Grid container sx={{ height: "100vh", overflow: "hidden" }}>
			<Grid
				container
				size={4}
				sx={{
					justifyContent: "center",
					alignContent: "center",
					paddingLeft: "20px",
					marginBottom: "30vh",
				}}
			>
				<SetUp
					participant={activePlayer}
					chatMessage={chatMessage}
					chatHistory={chatHistory}
					handleChatSubmit={handleChatSubmit}
					setChatMessage={setChatMessage}
					handleRollInitiative={handleRollInitiative}
					playerRoll={playerRoll}
					opponentRoll={opponentRoll}
					isRolling={isRolling}
					isRollSame={isRollSame}
				/>
			</Grid>
			<Grid
				container
				size={3}
				sx={{ justifyContent: "center", alignContent: "center" }}
			>
				<Players participant={activePlayer} isLobbyView={isLobbyView} />
			</Grid>
			<Grid
				container
				size={5}
				sx={{
					justifyContent: "center",
					alignContent: "center",
					paddingRight: "20px",
				}}
			>
				<Deck activePlayer={activePlayer} />
			</Grid>
		</Grid>
	);
};

export default Lobby;
