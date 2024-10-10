"use client";
import React from "react";
import { Grid2 as Grid } from "@mui/material";
import { usePlayer } from "../_contexts/Player.context";
import { usePathname } from "next/navigation";
import Players from "../_components/Lobby/Players/Players";
import Deck from "../_components/Lobby/Deck/Deck";
import SetUp from "../_components/Lobby/SetUp/SetUp";

const Lobby = () => {
	const { activePlayer } = usePlayer();
	const pathname = usePathname();
	const isLobbyView = pathname === "/lobby";

	return (
		<Grid
			container
			sx={{ height: "100vh", backgroundColor: "tomato", overflow: "hidden" }}
		>
			<Grid
				container
				size={4}
				sx={{
					justifyContent: "center",
					alignContent: "center",
					paddingLeft: "20px",
				}}
			>
				<SetUp activePlayer={activePlayer} />
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
