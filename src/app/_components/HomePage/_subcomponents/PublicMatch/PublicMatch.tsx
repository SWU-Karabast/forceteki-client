import React from "react";
import { Box, Button, Typography } from "@mui/material";
import GameInProgressPlayer from "../GameInProgressPlayer/GameInProgressPlayer";
import { PublicGameInProgressProps } from "../../HomePageTypes";

const PublicMatch: React.FC<PublicGameInProgressProps> = ({ match }) => {
	//------------------------STYLES------------------------//

	const boxStyle = {
		width: "100%",
		display: "flex",
		justifyContent: "space-between",
		alignContent: "center",
		alignItems: "center",
		mb: "1rem",
	};

	return (
		<Box sx={boxStyle}>
			<GameInProgressPlayer
				playerImage={match.player1.playerImage}
				hexagonColors={match.player1.hexagonColors}
			/>

			<Typography variant="body1">vs</Typography>

			<GameInProgressPlayer
				playerImage={match.player2.playerImage}
				hexagonColors={match.player2.hexagonColors}
			/>

			<Button>Spectate</Button>
		</Box>
	);
};

export default PublicMatch;
