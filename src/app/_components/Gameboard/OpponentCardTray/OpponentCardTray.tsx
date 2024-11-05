import React from "react";
import Grid from "@mui/material/Grid2";
import Resources from "../_subcomponents/PlayerTray/Resources";
import DeckDiscard from "../_subcomponents/PlayerTray/DeckDiscard";
import PlayerHand from "../_subcomponents/PlayerTray/PlayerHand";
import { OpponentCardTrayProps } from "@/app/_components/Gameboard/GameboardTypes";
import { usePlayer } from "@/app/_contexts/Player.context";

const OpponentCardTray: React.FC<OpponentCardTrayProps> = ({ participant }) => {
	//---------------Styles------------------- //
	const leftColumn = {
		display: "flex",
		alignItems: "flex-start",
		justifyContent: "flex-start",
		pl: "2em",
		pt: "2em",
	};

	const centerColumn = {
		height: "100%",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
	};

	const rightColumn = {
		display: "flex",
		alignItems: "flex-start",
		justifyContent: "flex-end",
		pr: "2em",
		pt: "2em",
	};

	const { gameState, connectedPlayer, getOpponent } = usePlayer();

	return (
		<Grid container sx={{ height: "15%" }}>
			<Grid size={3} sx={leftColumn}>
				<Resources
					trayPlayer={participant.type}
				/>
			</Grid>
			<Grid size={6} sx={centerColumn}>
				<PlayerHand cards={gameState?.players[getOpponent(connectedPlayer)].cardPiles["hand"] || []} />
			</Grid>
			<Grid size={3} sx={rightColumn}>
				<DeckDiscard deckSize={participant.deckSize} />
			</Grid>
		</Grid>
	);
};

export default OpponentCardTray;
