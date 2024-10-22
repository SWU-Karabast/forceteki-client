import React from "react";
import { Box, Divider, Typography } from "@mui/material";
import PublicMatch from "../PublicMatch/PublicMatch";
import { playerMatches } from "@/app/_constants/mockData";

const GamesInProgress: React.FC = () => {
	const randomGamesInProgress = Math.floor(Math.random() * 1000);

	return (
		<>
			<Box
				sx={{
					mt: 1,
					position: "sticky",
					top: 0,
					zIndex: 1,
					display: "flex",
					justifyContent: "space-between",
					alignItems: "flex-end",
					alignContent: "center",
				}}
			>
				<h3>Games in Progress</h3>
				<h3 className="light">{randomGamesInProgress}</h3>
			</Box>
			<hr></hr>
			<Box
				sx={{
					mb: 1,
					pr: 1,
				}}
			>
				{playerMatches.map((match, index) => (
					<PublicMatch key={index} match={match} />
				))}
			</Box>
		</>
	);
};

export default GamesInProgress;
