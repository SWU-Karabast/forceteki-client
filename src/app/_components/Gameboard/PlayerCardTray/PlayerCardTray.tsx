import React from "react";
import Grid from "@mui/material/Grid2";
import Resources from "../_subcomponents/PlayerTray/Resources";
import DeckDiscard from "../_subcomponents/PlayerTray/DeckDiscard";
import CardActionTray from "../_subcomponents/PlayerTray/CardActionTray";
import PlayerHand from "../_subcomponents/PlayerTray/PlayerHand";
import { IPlayerCardTrayProps } from "@/app/_components/Gameboard/GameboardTypes";
import { useGame } from "@/app/_contexts/Game.context";

const PlayerCardTray: React.FC<IPlayerCardTrayProps> = ({
	trayPlayer,
	handleModalToggle,
}) => {
	// -------------- Contexts ---------------- //
	const { gameState, connectedPlayer } = useGame();

	//---------------Styles------------------- //
	const leftColumnStyle = {
		display: "flex",
		alignItems: "center",
		justifyContent: "flex-start",
		padding: "1em",
	};

	const centerColumnStyle = {
		height: "100%",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
	};

	const rightColumnStyle = {
		display: "flex",
		alignItems: "center",
		justifyContent: "flex-end",
		padding: "1em",
	};

	return (
		<Grid container sx={{ height: "20.82%" }}>
			<Grid size={3} sx={leftColumnStyle}>
				<DeckDiscard trayPlayer={trayPlayer} />
				<Resources
					trayPlayer={trayPlayer}
					handleModalToggle={handleModalToggle}
				/>
			</Grid>
			<Grid size={6} sx={centerColumnStyle}>
				<PlayerHand cards={gameState?.players[connectedPlayer].cardPiles["hand"] || []} />
			</Grid>
			<Grid size={3} sx={rightColumnStyle}>
				<CardActionTray />
			</Grid>
		</Grid>
	);
};

export default PlayerCardTray;
