import React from "react";
import { Card, CardContent, Typography, Divider } from "@mui/material";
import JoinableGame from "../_subcomponents/JoinableGame/JoinableGame";
import GamesInProgress from "../_subcomponents/GamesInProgress/GamesInProgress";
import { PublicGamesProps } from "../HomePageTypes";

const PublicGames: React.FC<PublicGamesProps> = ({ format }) => {
	//------------------------STYLES------------------------//

	const cardStyle = {
		height: "80vh",
		width: { xs: "90vw", sm: "70vw", md: "40vw", lg: "30vw" },
		borderRadius: "1.5em",
		backgroundColor: "#000000E6",
		backdropFilter: "blur(20px)",
		fontFamily: "var(--font-barlow), sans-serif",
		ml: "1.8em",
		p: "2em",
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
		<Card sx={cardStyle}>
			<CardContent sx={cardContentStyle}>
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
