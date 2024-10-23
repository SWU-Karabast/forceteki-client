import React from "react";
import Grid from "@mui/material/Grid2";
import Resources from "../_subcomponents/PlayerOpponentRows/Resources/Resources";
import DeckDiscard from "../_subcomponents/PlayerOpponentRows/DeckDiscard/DeckDiscard";
import CardActionTray from "../_subcomponents/PlayerOpponentRows/CardActionTray/CardActionTray";

const OpponentCardTray: React.FC<OpponentCardTrayProps> = ({ participant }) => {
	//---------------Styles------------------- //
	const leftColumn = {
		display: "flex",
		alignItems: "flex-start",
		justifyContent: "flex-start",
		pl: "1.35%",
		pt: "1.35%",
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
		pr: "1.35%",
		pt: "1.35%",
	};

	return (
		<Grid container sx={{ height: "15%" }}>
			<Grid size={3} sx={leftColumn}>
				<Resources
					availableResources={2}
					totalResources={4}
					activePlayer={participant.type}
				/>
			</Grid>
			<Grid size={6} sx={centerColumn}>
				<CardActionTray
					activePlayer={participant.type}
					availableCards={participant.cards}
					// Opponent doesn't need to handle resource selection or playing cards
				/>
			</Grid>
			<Grid size={3} sx={rightColumn}>
				<DeckDiscard deckSize={participant.deckSize} />
			</Grid>
		</Grid>
	);
};

export default OpponentCardTray;
