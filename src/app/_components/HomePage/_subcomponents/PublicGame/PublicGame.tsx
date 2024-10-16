import React from "react";
import { Box, Button, Typography } from "@mui/material";

const PublicGame: React.FC = () => {
	const randomGameId = Math.floor(Math.random() * 10000);

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
			<Typography
				sx={{
					fontFamily: "var(--font-barlow), sans-serif",
					fontSize: ".9em",
					color: "#fff",
				}}
			>
				Game #{randomGameId}
			</Typography>
			<Button
				sx={{
					fontFamily: "var(--font-barlow), sans-serif",
					width: "6vw",
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
				Join Game
			</Button>
		</Box>
	);
};

export default PublicGame;
