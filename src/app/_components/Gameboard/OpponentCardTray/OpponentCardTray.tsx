import React from "react";
import Grid from "@mui/material/Grid2";
import Resources from "../_subcomponents/PlayerTray/Resources";
import DeckDiscard from "../_subcomponents/PlayerTray/DeckDiscard";
import { OpponentCardTrayProps } from "@/app/_components/Gameboard/GameboardTypes";

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

	return (
		<Grid container sx={{ height: "15%" }}>
			<Grid size={3} sx={leftColumn}>
				<Resources
					trayPlayer={participant.type}
				/>
			</Grid>
			<Grid size={6} sx={centerColumn}>
			</Grid>
			<Grid size={3} sx={rightColumn}>
				<DeckDiscard deckSize={participant.deckSize} />
			</Grid>
		</Grid>
	);
};

export default OpponentCardTray;
