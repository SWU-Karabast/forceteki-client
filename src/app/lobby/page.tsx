/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React from "react";
import { Typography, Paper, Grid2 as Grid } from "@mui/material";
import { usePlayer } from "../_contexts/Player.context";
import { usePathname } from "next/navigation";
import Players from "../_components/Lobby/Players/Players";
import Deck from "../_components/Lobby/Deck/Deck";

const Lobby = () => {
	const { activePlayer } = usePlayer();
	const pathname = usePathname();
	const isLobbyView = pathname === "/lobby";

	return (
		<Grid
			container
			sx={{ height: "100vh", backgroundColor: "tomato", overflow: "hidden" }}
		>
			<Grid size={4}>
				<Paper sx={{ backgroundColor: "lightpink", height: "100%" }}>
					<Typography>HELLO</Typography>
				</Paper>
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
				sx={{ justifyContent: "center", alignContent: "center" }}
			>
				<Deck activePlayer={activePlayer} />
			</Grid>
		</Grid>
	);
};

export default Lobby;
