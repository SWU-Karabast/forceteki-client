/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React from "react";
import { Typography, Paper, Grid2 as Grid } from "@mui/material";
import Players from "../_components/Lobby/Players/Players";
import { usePlayer } from "../_contexts/Player.context";
import { usePathname } from "next/navigation";

const Lobby = () => {
	const { activePlayer } = usePlayer();
	const pathname = usePathname();
	const isLobbyView = pathname === "/lobby";

	return (
		<Grid container sx={{ height: "100vh", backgroundColor: "tomato" }}>
			<Grid size={3}>
				<Paper sx={{ backgroundColor: "lightpink", height: "100%" }}>
					<Typography>HELLO</Typography>
				</Paper>
			</Grid>
			<Grid
				container
				size={2}
				sx={{ justifyContent: "center", alignContent: "center" }}
			>
				<Players participant={activePlayer} isLobbyView={isLobbyView} />
			</Grid>
			<Grid size={7}>
				<Paper sx={{ backgroundColor: "green", height: "100%" }}>
					<Typography>HELLO</Typography>
				</Paper>
			</Grid>
		</Grid>
	);
};

export default Lobby;
