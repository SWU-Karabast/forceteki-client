import React from "react";
import { Box, Button, Typography } from "@mui/material";
import GameInProgressPlayer from "../GameInProgressPlayer/GameInProgressPlayer";

const PublicMatch: React.FC<PublicGameInProgressProps> = ({ match }) => {
	return (
		<Box
			sx={{
				width: "100%",
				display: "flex",
				justifyContent: "space-between",
				alignContent: "center",
				alignItems: "center",
				mb: 1,
			}}
		>
			<GameInProgressPlayer
				playerImage={match.player1.playerImage}
				hexagonColors={match.player1.hexagonColors}
			/>

			<p>vs</p>

			<GameInProgressPlayer
				playerImage={match.player2.playerImage}
				hexagonColors={match.player2.hexagonColors}
			/>

			<Button className="button">
			Spectate
			</Button>
		</Box>
	);
};

export default PublicMatch;
