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

	const { gameState, connectedPlayer } = useGame();
	const playerLeader = gameState?.players[player].leader;
	const playerBase = gameState?.players[player].base;

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
