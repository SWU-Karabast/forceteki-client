import React from "react";
import { Box, Button, Typography } from "@mui/material";

const JoinableGame: React.FC = () => {
	const randomGameId = Math.floor(Math.random() * 10000);

	//------------------------STYLES------------------------//

	const boxStyle = {
		width: "100%",
		display: "flex",
		justifyContent: "space-between",
		alignContent: "center",
		alignItems: "center",
		mb: ".5em",
		pr: ".5em",
	};

	const typographyStyle = {
		fontFamily: "var(--font-barlow), sans-serif",
		fontSize: "1.5em",
		color: "#fff",
	};

	return (
		<Box sx={boxStyle}>
			<Typography variant="body1">Game #{randomGameId}</Typography>
			<Button>Join Game</Button>
		</Box>
	);
};

export default JoinableGame;
