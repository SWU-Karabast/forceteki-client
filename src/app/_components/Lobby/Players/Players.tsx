// Players.tsx
import React from "react";
import { Card, Box, Typography } from "@mui/material";
import LeaderBaseBoard from "../../_sharedcomponents/LeaderBaseBoard/LeaderBaseBoard";
import { IPlayersProps } from "../LobbyTypes";

const Players: React.FC<IPlayersProps> = ({ isLobbyView }) => {
	//------------------------STYLES------------------------//

	const cardStyle = {
		borderRadius: "1.1em",
		borderColor: "#FFFFFF00",
		height:"90vh",  // For small screens and up (600px and above)
		width: "80%",
		minWidth: "212px",
		display: "flex",
		flexDirection: isLobbyView ? "column" : "row",
		justifyContent: isLobbyView ? "flex-start" : "center",
		pt: ".8em",
		backgroundColor: "#00000080",
		backdropFilter: "blur(30px)",
		'@media (max-height: 759px)': {
			height: '84vh',
		},
		'@media (max-height: 1000px)': {
			maxHeight: '85.5vh',
		},
		"::-webkit-scrollbar": {
			width: "0.2vw",
		},
		"::-webkit-scrollbar-thumb": {
			backgroundColor: "#D3D3D3B3",
			borderRadius: "1vw",
		},
		"::-webkit-scrollbar-button": {
			display: "none",
		},
		transition: "scrollbar-color 0.3s ease-in-out",
	};

	const typographyStyle = {
		fontSize: "2.0em",
		fontWeight: "bold",
		color: "white",
		ml: "30px",
		mb: "0px"
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
