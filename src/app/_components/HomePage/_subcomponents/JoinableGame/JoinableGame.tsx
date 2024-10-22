import React from "react";
import { Box, Button, Typography } from "@mui/material";

const JoinableGame: React.FC = () => {
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
			<p>Game #{randomGameId}</p>
		
			<Button className="button">
				Join Game
			</Button>
		</Box>
	);
};

export default JoinableGame;
