import React from "react";
import Grid from "@mui/material/Grid2";
import LeaderCard from "../../Cards/LeaderCard/LeaderCard";
import BaseCard from "../../Cards/BaseCard/BaseCard";
import { ILeaderBaseProps } from "../LeaderBaseBoardTypes";
import { useGame } from "@/app/_contexts/Game.context";
import {Box} from "@mui/material";

const LeaderBase: React.FC<ILeaderBaseProps> = ({
													player,
													isLobbyView = false,
													title,
												}) => {
	const { gameState, connectedPlayer, connectedDeck } = useGame();

	let playerLeader = null;
	let playerBase = null;

	if (isLobbyView && connectedDeck) {
		playerLeader = connectedDeck.leader[0].card;
		playerBase = connectedDeck.base[0].card;
	} else {
		playerLeader = gameState?.players[player].leader;
		playerBase = gameState?.players[player].base;
	}

	const containerStyle = {
		height: "100%",
		width: "100%",
		justifyContent: "center",
		alignItems: "center"
	};
	const lobbyLeaderBaseContainer = {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		width: "100%",
	}

	return (
		<Grid container direction="column" sx={containerStyle}>
			{isLobbyView ? (
				<Box sx={lobbyLeaderBaseContainer}>
					<LeaderCard isLobbyView={isLobbyView} title={title} card={playerLeader} />
					<BaseCard isLobbyView={isLobbyView} card={playerBase} />
				</Box>
			) : player === connectedPlayer ? (
				<>
					<BaseCard isLobbyView={isLobbyView} card={playerBase} />
					<LeaderCard isLobbyView={isLobbyView} title={title} card={playerLeader} />
				</>
			) : (
				<>
					<LeaderCard isLobbyView={isLobbyView} title={title} card={playerLeader} />
					<BaseCard isLobbyView={isLobbyView} card={playerBase} />
				</>
			)}
		</Grid>
	);
};

export default LeaderBase;