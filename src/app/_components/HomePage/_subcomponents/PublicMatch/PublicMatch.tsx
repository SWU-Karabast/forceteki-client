import React from "react";
import { Box, Button, Typography } from "@mui/material";
import GameInProgressPlayer from "../GameInProgressPlayer/GameInProgressPlayer";

const PublicMatch: React.FC<PublicGameInProgressProps> = ({ match }) => {
	//------------------------STYLES------------------------//

	const boxStyle = {
		width: "100%",
		display: "flex",
		justifyContent: "space-between",
		alignContent: "center",
		alignItems: "center",
		mb: ".5em",
	};

	const typographyStyle = {
		fontFamily: "var(--font-barlow), sans-serif",
		fontSize: "1.4em",
		color: "#fff",
	};

	const buttonStyle = {
		fontFamily: "var(--font-barlow), sans-serif",
		width: "5vw",
		height: "4.8vh",
		fontSize: "1.2em",
		borderRadius: "0.5vw",
		backgroundColor: "#292929",
		color: "#fff",
		"&:hover": {
			backgroundColor: "#3a3a3a",
		},
	};

	return (
		<Box sx={boxStyle}>
			<GameInProgressPlayer
				playerImage={match.player1.playerImage}
				hexagonColors={match.player1.hexagonColors}
			/>

			<Typography sx={typographyStyle}>VS</Typography>

			<GameInProgressPlayer
				playerImage={match.player2.playerImage}
				hexagonColors={match.player2.hexagonColors}
			/>

			<Button sx={buttonStyle}>SPECTATE</Button>
		</Box>
	);
};

export default PublicMatch;
