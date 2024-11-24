import React from "react";
import { Box, Button, Typography } from "@mui/material";
import GameInProgressPlayer from "../GameInProgressPlayer/GameInProgressPlayer";
import { PublicGameInProgressProps } from "../../HomePageTypes";

const PublicMatch: React.FC<PublicGameInProgressProps> = ({ match }) => {

	const boxStyle = {
		width: "100%",
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		mb: "1rem",
	};

	const matchItemsStyle = {
		display: "flex",
		alignItems: "center",
		gap: "1rem", // This adds a 1rem margin between each item
	};

	return (
		<Box sx={boxStyle}>
			<Box sx={matchItemsStyle}>
				<GameInProgressPlayer
					playerImage={match.player1.playerImage}
					hexagonColors={match.player1.hexagonColors}
				/>
				<Typography variant="body1">vs</Typography>
				<GameInProgressPlayer
					playerImage={match.player2.playerImage}
					hexagonColors={match.player2.hexagonColors}
				/>
			</Box>
			<Button>Spectate</Button>
		</Box>
	);
};

export default PublicMatch;
