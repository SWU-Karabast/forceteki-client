"use client";
import React, { useState } from "react";
import {Grid2 as Grid, Typography} from "@mui/material";
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
		pl: "20px",
		mt: "24px",
	};

	const playersGridStyle = {
		justifyContent: "center",
		mt: "78px"
	};

	const deckGridStyle = {
		justifyContent: "center",
		pr: "20px",
		mt: "23px"
	};
	const disclaimer = {
		position: "absolute",
		bottom: 0,
		width: "100%",
		padding: "1rem",
		textAlign: "center",
		fontSize: "0.90rem",
	};

	return (
		<Grid container sx={containerStyle}>
			<Grid container size={3} sx={setUpGridStyle}>
				<SetUp
					chatMessage={chatMessage}
					chatHistory={chatHistory}
					handleChatSubmit={handleChatSubmit}
					setChatMessage={setChatMessage}
				/>
			</Grid>
			<Grid container size={2} sx={playersGridStyle}>
				<Players isLobbyView={isLobbyView} />
			</Grid>
			<Grid container size={7} sx={deckGridStyle}>
				<Deck />
			</Grid>
			<Grid size={12}>
				<Typography variant="body1" sx={disclaimer}>
					Karabast is in no way affiliated with Disney or Fantasy Flight Games.
					Star Wars characters, cards, logos, and art are property of Disney
					and/or Fantasy Flight Games.
				</Typography>
			</Grid>
		</Grid>
	);
};

export default Lobby;
