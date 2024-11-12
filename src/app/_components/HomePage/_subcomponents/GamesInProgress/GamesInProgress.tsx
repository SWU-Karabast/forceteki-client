import React from "react";
import { Box, Divider, Typography } from "@mui/material";
import PublicMatch from "../PublicMatch/PublicMatch";
import { playerMatches } from "@/app/_constants/mockData";

const GamesInProgress: React.FC = () => {
	const twoOrThreeDigits = Math.random() >= 0.5 ? 100 : 10;
	const randomGamesInProgress =
		Math.floor(Math.random() * 9 * twoOrThreeDigits) + twoOrThreeDigits;

	//------------------------STYLES------------------------//

	const headerBoxStyle = {
		position: "sticky",
		top: 0,
		zIndex: 1,
		display: "flex",
		justifyContent: "space-between",
		alignItems: "flex-end",
		alignContent: "center",
		mt: 1,
	};

	const dividerStyle = {
		backgroundColor: "#fff",
		mt: ".5vh",
		mb: "1vh",
	};

	const scrollableBoxStyle = {
		maxHeight: "40vh",
		overflowY: "auto",
		mb: ".5em",
		pr: ".5em",
		"::-webkit-scrollbar": {
			width: "0.2vw",
		},
		"::-webkit-scrollbar-thumb": {
			backgroundColor: "#D3D3D3B3",
			borderRadius: "1vw",
		},
		"::-webkit-scrollbar-button": {
			display: "none",
		},
		transition: "scrollbar-color 0.3s ease-in-out",
	};

	return (
		<>
			<Box sx={headerBoxStyle}>
				<Typography>Games in Progress</Typography>
				<Typography>{randomGamesInProgress}</Typography>
			</Box>
			<Divider sx={dividerStyle} />
			<Box sx={scrollableBoxStyle}>
				{playerMatches.map((match, index) => (
					<PublicMatch key={index} match={match} />
				))}
			</Box>
		</>
	);
};

export default GamesInProgress;
