import React from "react";
import Grid from "@mui/material/Grid2";
import LeaderBaseCard from "../../Cards/LeaderBaseCard/LeaderBaseCard";
import { ILeaderBaseProps } from "../LeaderBaseBoardTypes";
import { useGame } from "@/app/_contexts/Game.context";
import { s3CardImageURL } from "@/app/_utils/s3Utils";

const LeaderBase: React.FC<ILeaderBaseProps> = ({
	player,
	isLobbyView = false,
	title,
}) => {

	const { gameState, connectedPlayer, connectedDeck } = useGame();
	let playerLeader = null
	let playerBase = null
	if(isLobbyView && connectedDeck){
		playerLeader = connectedDeck.leader[0].card
		playerBase = connectedDeck.base[0].card
		console.log(playerLeader);
		console.log(playerBase);
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
		<Grid container direction="column" sx={containerStyle}>
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
