"use client";
import React, { useState } from "react";
import { Grid2 as Grid } from "@mui/material";
import { usePathname } from "next/navigation";
import Players from "../_components/Lobby/Players/Players";
import Deck from "../_components/Lobby/Deck/Deck";
import SetUp from "../_components/Lobby/SetUp/SetUp";

const Lobby = () => {

	const pathname = usePathname();
	const isLobbyView = pathname === "/lobby";

	const [chatMessage, setChatMessage] = useState("");
	const [chatHistory, setChatHistory] = useState<string[]>([]);

	const handleChatSubmit = () => {
		if (chatMessage.trim()) {
			setChatHistory([...chatHistory, chatMessage]);
			setChatMessage("");
		}
	};


	//------------------------STYLES------------------------//

	const containerStyle = {
		height: "100vh",
		overflow: "hidden",
	};

	const setUpGridStyle = {
		justifyContent: "center",
		alignContent: "center",
		pl: "20px",
		mb: "16.3em",
	};

	const playersGridStyle = {
		justifyContent: "center",
		alignContent: "center",
	};

	const deckGridStyle = {
		justifyContent: "center",
		alignContent: "center",
		pr: "20px",
	};

	return (
		<Grid container sx={containerStyle}>
			<Grid container size={4} sx={setUpGridStyle}>
				<SetUp
					chatMessage={chatMessage}
					chatHistory={chatHistory}
					handleChatSubmit={handleChatSubmit}
					setChatMessage={setChatMessage}
				/>
			</Grid>
			<Grid container size={3} sx={playersGridStyle}>
				<Players isLobbyView={isLobbyView} />
			</Grid>
			<Grid container size={5} sx={deckGridStyle}>
				<Deck />
			</Grid>
		</Grid>
	);
};

export default Lobby;
