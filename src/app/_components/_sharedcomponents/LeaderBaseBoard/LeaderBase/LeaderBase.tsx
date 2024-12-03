import React from "react";
import Grid from "@mui/material/Grid2";
import LeaderBaseCard from "../../Cards/LeaderBaseCard/LeaderBaseCard";
import { LeaderBaseProps } from "../LeaderBaseBoardTypes";
import { useGame } from "@/app/_contexts/Game.context";

const LeaderBase: React.FC<LeaderBaseProps> = ({
	player,
	isLobbyView = false,
	title,
}) => {

	const { gameState, connectedPlayer, connectedDeck } = useGame();
	let playerLeader = null
	let playerBase = null
	console.log("HEREIAM");
	console.log(connectedDeck);
	if(isLobbyView && connectedDeck){
		playerLeader = connectedDeck.data.leader[0]
		playerBase = connectedDeck.data.base[0]
	}else {
		playerLeader = gameState?.players[player].leader;
		playerBase = gameState?.players[player].base;
	}
	const containerStyle = {
		height: "100%",
		width: "100%",
		justifyContent: "center",
	};

	return (
		<Grid container direction="row" sx={containerStyle}>
			{isLobbyView ? (
				<>
					<LeaderBaseCard
						variant="leader"
						isLobbyView={isLobbyView}
						title={title}
						card={playerLeader}
					/>
					<LeaderBaseCard variant="base" isLobbyView={isLobbyView} card={playerBase} />
				</>
			) : player === connectedPlayer ? (
				<>
					<LeaderBaseCard variant="base" isLobbyView={isLobbyView} card={playerBase} />
					<LeaderBaseCard
						variant="leader"
						isLobbyView={isLobbyView}
						title={title}
						card={playerLeader}
					/>
				</>
			) : (
				<>
					<LeaderBaseCard
						variant="leader"
						isLobbyView={isLobbyView}
						title={title}
						card={playerLeader}
					/>
					<LeaderBaseCard variant="base" isLobbyView={isLobbyView} card={playerBase} />
				</>
			)}
		</Grid>
	);
};

export default LeaderBase;
