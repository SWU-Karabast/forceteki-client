import React from "react";
import { Box, Button, Typography } from "@mui/material";
import GameInProgressPlayer from "../GameInProgressPlayer/GameInProgressPlayer";
import { PublicGameInProgressProps } from "../../HomePageTypes";
import { Margin } from "@mui/icons-material";

const PublicMatch: React.FC<PublicGameInProgressProps> = ({ match }) => {

	const styles = {
		box: {
			width: "100%",
			display: "flex",
			justifyContent: "space-between",
			alignItems: "center",
			mb: "1rem",
		},
		matchItems: {
			display: "flex",
			alignItems: "center",
			gap: "1rem",
		},
		matchType: {
			margin: 0,
		},
	};

	return (
		<Box sx={styles.box}>
			<Box sx={styles.matchItems}>
				<GameInProgressPlayer
					playerImage={match.player1.playerImage}
					hexagonColors={match.player1.hexagonColors}
				/>
				<Typography variant="body1" sx={styles.matchType}>vs</Typography>
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
