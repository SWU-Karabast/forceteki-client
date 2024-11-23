import React from "react";
import { Card, CardContent, Typography, Divider } from "@mui/material";
import JoinableGame from "../_subcomponents/JoinableGame/JoinableGame";
import GamesInProgress from "../_subcomponents/GamesInProgress/GamesInProgress";
import { PublicGamesProps } from "../HomePageTypes";

const PublicGames: React.FC<PublicGamesProps> = ({ format }) => {
	//------------------------STYLES------------------------//


	const PublicGamesWrapper = {
		height: "100%",
	  };

	const cardContentStyle = {
		display: "flex",
		flexDirection: "column",
		justifyContent: "center",
	};

	const dividerStyle = {
		backgroundColor: "#fff",
		my: ".7em",
	};

	return (
		<Card variant="black" sx={PublicGamesWrapper}>
			<CardContent sx={cardContentStyle}>
				<Typography variant="h2">Public Games</Typography>
				<Typography variant="h3">{format}</Typography>
				<Divider sx={dividerStyle} />
				<JoinableGame />
				<JoinableGame />
				<JoinableGame />
				<Typography variant="h3">
					Request-Undo {format}
				</Typography>
				<Divider sx={dividerStyle} />
				<JoinableGame />
				<GamesInProgress />
			</CardContent>
		</Card>
	);
};

export default PublicGames;
