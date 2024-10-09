// Players.tsx
import React from "react";
import { Card, Box, Typography } from "@mui/material";
import LeaderBaseBoard from "../../LeaderBaseBoard/LeaderBaseBoard";

const Players: React.FC<PlayersProps> = ({ participant, isLobbyView }) => {
	return (
		<Card
			sx={{
				borderRadius: "1.11vw",
				borderColor: "rgba(255, 255, 255, 0.0)",
				height: "90%",
				width: "90%",
				display: "flex",
				flexDirection: isLobbyView ? "column" : "row",
				justifyContent: isLobbyView ? "flex-start" : "center",
				paddingTop: "1vh",
				marginTop: "4vh",
				backgroundColor: "rgba(40, 40, 40, 0.9)",
			}}
		>
			<Box
				sx={{
					marginBottom: isLobbyView ? "5.78vh" : "0",
					marginLeft: isLobbyView ? "0" : "1.11vw",
					marginRight: isLobbyView ? "0" : "1.11vw",
					width: "100%",
				}}
			>
				<Typography
					sx={{
						fontSize: "1.67vw",
						fontWeight: "bold",
						color: "white",
						marginLeft: ".6vw",
					}}
				>
					Players
				</Typography>
				<LeaderBaseBoard participant={participant} isLobbyView={isLobbyView} />
			</Box>
		</Card>
	);
};

export default Players;
