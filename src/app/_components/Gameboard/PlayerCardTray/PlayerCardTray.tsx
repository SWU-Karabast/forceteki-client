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
				{/* <CardActionTray /> */}
			</Grid>
			<Grid size={3} sx={rightColumnStyle}>
				<DeckDiscard trayPlayer={trayPlayer} />
			</Grid>
		</Grid>
	);
};

export default PlayerCardTray;
