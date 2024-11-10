import React from "react";
import { Box } from "@mui/material";
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

	return (
		<>
			<Box sx={headerBoxStyle}>
				<h3>Games in Progress</h3>
				<h3 className="light">{randomGamesInProgress}</h3>
			</Box>
			<hr/>
			<Box>
				{playerMatches.map((match, index) => (
					<PublicMatch key={index} match={match} />
				))}
			</Box>
		</>
	);
};

export default GamesInProgress;
