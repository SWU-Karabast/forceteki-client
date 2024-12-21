// Players.tsx
import React from "react";
import { Card, Box, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { IPlayersProps } from "../LobbyTypes";
import LeaderBaseCard from "@/app/_components/_sharedcomponents/Cards/LeaderBaseCard/LeaderBaseCard";
import {useGame} from "@/app/_contexts/Game.context";

const Players: React.FC<IPlayersProps> = ({ isLobbyView }) => {
	//------------------------STYLES------------------------//
	const { connectedPlayer, connectedDeck } = useGame();

	const titleOpponent =
		connectedPlayer === "ThisIsTheWay" ? "Order66" : "ThisIsTheWay";
	let playerLeader = null;
	let playerBase = null;

	// we get the connected deck
	if (connectedDeck) {
		playerLeader = connectedDeck.leader[0].card;
		playerBase = connectedDeck.base[0].card;
	}

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

	const lobbyLeaderBaseContainer = {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		width: "100%",
	}
	const containerStyle = {
		height: "100%",
		width: "100%",
		justifyContent: "center",
		alignItems: "center"
	};
	const rowStyle = {
		flexGrow: 1,
		width: "100%",
		alignItems: "center",
		justifyContent: "center",
		display: "flex"
	};
	const titleTypographyStyle = {
		fontFamily: "var(--font-barlow), sans-serif",
		fontWeight: "600",
		fontSize: "1.5em",
		marginBottom: isLobbyView ? 0 : "0.5em",
		textAlign: "left",
		color: "white",
	};
	const titleTypographyStyleOpponent = {
		fontFamily: "var(--font-barlow), sans-serif",
		fontWeight: "600",
		fontSize: "1.5em",
		marginBottom: "10px",
		textAlign: "left" as const,
		color: "white",
		opacity: "15%",
	}
	return (
		<Card sx={cardStyle}>
			<Box sx={{ width: "100%" }}>
				<Typography sx={typographyStyle}>Players</Typography>
				<Grid container direction="column" sx={containerStyle}>
					<Grid sx={rowStyle}>
						<Box sx={lobbyLeaderBaseContainer}>
							<Typography
								variant="subtitle1"
								sx={titleTypographyStyle}
							>
								{connectedPlayer}
							</Typography>
							<LeaderBaseCard
								variant="leader"
								isLobbyView={true}
								title={connectedPlayer}
								card={playerLeader}
							/>
							<LeaderBaseCard variant="base" isLobbyView={true} card={playerBase}></LeaderBaseCard>
						</Box>
					</Grid>
					<Grid sx={rowStyle}>
						<Box sx={lobbyLeaderBaseContainer}>
							<Typography
								variant="subtitle1"
								sx={titleOpponent === undefined ? titleTypographyStyleOpponent : titleTypographyStyle}
							>
								{titleOpponent === undefined ? "Opponent" : titleOpponent}
							</Typography>
							<LeaderBaseCard
								variant="leader"
								isLobbyView={isLobbyView}
								title={titleOpponent}
								card={playerLeader}
							/>
							<LeaderBaseCard variant="base" isLobbyView={isLobbyView} card={playerBase}></LeaderBaseCard>
						</Box>
					</Grid>
				</Grid>
			</Box>
		</Card>
	);
};

export default Players;
