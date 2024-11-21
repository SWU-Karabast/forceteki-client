// Players.tsx
import React from "react";
import { Card, Box, Typography } from "@mui/material";
import LeaderBaseBoard from "../../_sharedcomponents/LeaderBaseBoard/LeaderBaseBoard";
import { PlayersProps } from "../LobbyTypes";

const Players: React.FC<PlayersProps> = ({ isLobbyView }) => {
	//------------------------STYLES------------------------//

	const cardStyle = {
		borderRadius: "1.1em",
		borderColor: "#FFFFFF00",
		height: "90vh",
		width: "80%",
		display: "flex",
		flexDirection: isLobbyView ? "column" : "row",
		justifyContent: isLobbyView ? "flex-start" : "center",
		mt: "2.6em",
		pt: ".8em",
		backgroundColor: "#000000E6",
		backdropFilter: "blur(20px)",
	};

	const typographyStyle = {
		fontSize: "2.4em",
		fontWeight: "bold",
		color: "white",
		ml: ".6em",
		pt: ".2em",
	};

	return (
		<Card sx={cardStyle}>
			<Box sx={{ width: "100%" }}>
				<Typography sx={typographyStyle}>Players</Typography>
				<LeaderBaseBoard isLobbyView={isLobbyView} />
			</Box>
		</Card>
	);
};

export default Players;
