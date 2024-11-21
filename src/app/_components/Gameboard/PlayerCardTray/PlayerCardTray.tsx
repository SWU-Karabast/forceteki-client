import React from "react";
import Grid from "@mui/material/Grid2";
import Resources from "../_subcomponents/PlayerTray/Resources";
// import DeckDiscard from "../_subcomponents/PlayerTray/DeckDiscard/DeckDiscard";
import CardActionTray from "../_subcomponents/PlayerTray/CardActionTray";
import PlayerHand from "../_subcomponents/PlayerTray/PlayerHand";
import { PlayerCardTrayProps } from "@/app/_components/Gameboard/GameboardTypes";
import { usePlayer } from "@/app/_contexts/Player.context";

const PlayerCardTray: React.FC<PlayerCardTrayProps> = ({
	trayPlayer,
	handleModalToggle,
}) => {
	// -------------- Contexts ---------------- //
	const { gameState, connectedPlayer } = usePlayer();

	//---------------Styles------------------- //
	const leftColumnStyle = {
		display: "flex",
		alignItems: "center",
		justifyContent: "flex-start",
		pl: "2em",
		pt: "2em",
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
		pr: "2em",
		pt: "2em",
	};

	return (
		<Grid container sx={{ height: "20.82%" }}>
			<Grid size={3} sx={leftColumnStyle}>
				<Resources
					trayPlayer={trayPlayer}
					handleModalToggle={handleModalToggle}
				/>
			</Grid>
			<Grid size={6} sx={centerColumnStyle}>
				<PlayerHand cards={gameState?.players[connectedPlayer].cardPiles["hand"] || []} />
				<CardActionTray />
			</Grid>
			<Grid size={3} sx={rightColumnStyle}>
				{/* <DeckDiscard deckSize={participant.deckSize} /> */}
			</Grid>
		</Grid>
	);
};

export default PlayerCardTray;
