/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useState } from "react";
import { Typography, Paper, Grid2 as Grid } from "@mui/material";
import { mockPlayer } from "../_constants/mockData";
import Players from "../_components/Lobby/Players/Players";
import ControlHub from "../_components/ControlHub/ControlHub";

const Lobby = () => {
	const [activePlayer, setActivePlayer] = useState<Participant>(mockPlayer);

	const isLobbyView = true;

	return (
		<Grid container sx={{ height: "100vh", backgroundColor: "tomato" }}>
			<Grid size={12}>
				<Typography
					paddingTop={"1vh"}
					paddingLeft={"1vw"}
					variant="h4"
					sx={{
						color: "white",
						fontFamily: "var(--font-barlow), sans-serif",
						fontWeight: "800",
					}}
				>
					GAME LOBBY
				</Typography>
				<ControlHub isLobbyView={isLobbyView} />
			</Grid>
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
