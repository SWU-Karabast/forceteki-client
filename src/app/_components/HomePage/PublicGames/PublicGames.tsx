import React from "react";
import { Card, CardContent, Typography, Divider } from "@mui/material";
import JoinableGame from "../_subcomponents/JoinableGame/JoinableGame";
import GamesInProgress from "../_subcomponents/GamesInProgress/GamesInProgress";

const PublicGames: React.FC<PublicGamesProps> = ({ format }) => {
	return (
		<Card
			sx={{
				maxHeight: "80vh",
				width: { xs: "90vw", sm: "70vw", md: "40vw", lg: "30vw" },
				fontFamily: "var(--font-barlow), sans-serif",
				borderRadius: "1.5vw",
				backgroundColor: "#000000E6",
				backdropFilter: "blur(20px)",
				ml: 3,
				p: "2em",
			}}
		>
			<CardContent
				sx={{
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
				}}
			>
				<Typography
					sx={{
						fontFamily: "var(--font-barlow), sans-serif",
						fontWeight: "800",
						color: "#fff",
						fontSize: "1.5rem",
					}}
				>
					{format}
				</Typography>

				<Divider
					sx={{
						backgroundColor: "#fff",
						mt: ".5vh",
						mb: "1vh",
					}}
				/>
				<JoinableGame />
				<JoinableGame />
				<JoinableGame />
				<Typography
					sx={{
						mt: 1,
						fontFamily: "var(--font-barlow), sans-serif",
						fontWeight: "800",
						color: "#fff",
						fontSize: "1.5rem",
					}}
				>
					Request-Undo {format}
				</Typography>

				<Divider
					sx={{
						backgroundColor: "#fff",
						mt: ".5vh",
						mb: "1vh",
					}}
				/>

				<JoinableGame />
				<GamesInProgress />
			</CardContent>
		</Card>
	);
};

export default PublicGames;
