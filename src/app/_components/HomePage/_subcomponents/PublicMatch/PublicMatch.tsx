import React from "react";
import { Box, Button, Typography } from "@mui/material";
import GameInProgressPlayer from "../GameInProgressPlayer/GameInProgressPlayer";

const PublicMatch: React.FC<PublicGameInProgressProps> = ({ match }) => {
	return (
		<Box
			sx={{
				width: "100%",
				display: "flex",
				justifyContent: "space-between",
				alignContent: "center",
				alignItems: "center",
				mb: 1,
			}}
		>
			<GameInProgressPlayer
				playerImage={match.player1.playerImage}
				hexagonColors={match.player1.hexagonColors}
			/>

			<Typography
				sx={{
					fontFamily: "var(--font-barlow), sans-serif",
					fontSize: "1.4em",
					color: "#fff",
				}}
			>
				VS
			</Typography>

			<GameInProgressPlayer
				playerImage={match.player2.playerImage}
				hexagonColors={match.player2.hexagonColors}
			/>

			<Button
				sx={{
					fontFamily: "var(--font-barlow), sans-serif",
					width: "5vw",
					height: "3.5em",
					fontSize: ".9rem",
					borderRadius: "0.5vw",
					backgroundColor: "#292929",
					color: "#fff",
					"&:hover": {
						backgroundColor: "#3a3a3a",
					},
				}}
			>
				Spectate
			</Button>
		</Box>
	);
};

export default PublicMatch;
