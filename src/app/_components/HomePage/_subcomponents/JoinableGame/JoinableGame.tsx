import React from "react";
import { Box, Button, Typography } from "@mui/material";

const JoinableGame: React.FC = () => {
	const randomGameId = Math.floor(Math.random() * 10000);

	//------------------------STYLES------------------------//

	const styles = {
		box: {
			width: "100%",
			display: "flex",
			justifyContent: "space-between",
			alignContent: "center",
			alignItems: "center",
			mb: "1rem",
		},
		matchType: {
		  	margin: 0,
		},
	};

	return (
		<Box sx={styles.box}>
			<Typography variant="body1" sx={styles.matchType}>Game #{randomGameId}</Typography>
			<Button>Join Game</Button>
		</Box>
	);
};

export default JoinableGame;
