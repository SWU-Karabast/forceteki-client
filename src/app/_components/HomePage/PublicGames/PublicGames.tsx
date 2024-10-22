import React from "react";
import { Card, CardContent, Typography, Divider } from "@mui/material";
import JoinableGame from "../_subcomponents/JoinableGame/JoinableGame";
import GamesInProgress from "../_subcomponents/GamesInProgress/GamesInProgress";

const PublicGames: React.FC<PublicGamesProps> = ({ format }) => {
	return (
		<Card
			className={"container" + ' ' + "black-bg"}
			sx={{
				maxHeight: "80vh",
				width: { xs: "90vw", sm: "70vw", md: "40vw", lg: "30vw" },
				ml: 3,
				overflowY: "scroll",
			}}
		>
			<CardContent 
				className="games-list"
				sx={{
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
				}}
			>
				<h2>Public Games</h2>
				<h3>{format}</h3>
				<hr></hr>
				<JoinableGame />
				<JoinableGame />
				<JoinableGame />

				<h3>Request-Undo {format}</h3>
				<hr></hr>
				<JoinableGame />

				<GamesInProgress />
			</CardContent>
		</Card>
	);
};

export default PublicGames;
