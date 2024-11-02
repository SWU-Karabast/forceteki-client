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
			<Typography sx={typographyStyle}>Game #{randomGameId}</Typography>
			<Button sx={buttonStyle}>Join Game</Button>
		</Box>
	);
};

export default JoinableGame;
