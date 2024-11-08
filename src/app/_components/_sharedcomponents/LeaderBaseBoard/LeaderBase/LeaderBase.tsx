import React from "react";
import Grid from "@mui/material/Grid2";
import LeaderBaseCard from "../../Cards/LeaderBaseCard/LeaderBaseCard";
import { LeaderBaseProps } from "../LeaderBaseBoardTypes";
import { usePlayer } from "@/app/_contexts/Player.context";

const LeaderBase: React.FC<LeaderBaseProps> = ({
	player,
	isLobbyView = false,
	title,
}) => {
	// Adjusted styles
	const containerStyle = {
		// justifyContent:
		// 	participant === "opponent" && isLobbyView
		// 		? "flex-end"
		// 		: participant === "player" && isLobbyView
		// 		? "flex-start"
		// 		: participant === "player"
		// 		? "flex-end"
		// 		: "flex-start",
		// alignItems: "center",
		// gap: ".5em",
		// height: "94%",
		// pt: isLobbyView ? 0 : "3.5em",
		// pb:
		// 	participant === "player" && isLobbyView
		// 		? 0
		// 		: participant === "player"
		// 		? "4vh"
		// 		: 0,
	};

	const { gameState, connectedPlayer } = usePlayer();
	const playerLeader = gameState?.players[player].leader;
	const playerBase = gameState?.players[player].base;

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
