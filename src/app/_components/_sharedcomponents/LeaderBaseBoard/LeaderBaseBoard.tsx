import React from "react";
import Grid from "@mui/material/Grid2";
import LeaderBase from "./LeaderBase/LeaderBase";
import CardActionTray from "@/app/_components/Gameboard/_subcomponents/PlayerTray/CardActionTray";
import { useGame } from "@/app/_contexts/Game.context";
import { ILeaderBaseBoardProps } from "./LeaderBaseBoardTypes";


const LeaderBaseBoard: React.FC<ILeaderBaseBoardProps> = ({
	isLobbyView,
}) => {
	const { connectedPlayer, getOpponent } = useGame();
	const titleOpponent =
		connectedPlayer === "ThisIsTheWay" ? "Order66" : "ThisIsTheWay";
	//------------------------STYLES------------------------//
	const containerStyle = {
		height: "100%",
		width: "100%",
		justifyContent: "space-between"
	};

	const rowStyle = {
		flexGrow: 1,
		width: "100%"
	};

	return (
		<Grid container direction="column" sx={containerStyle}>
			{isLobbyView ? (
				// If it's the lobby view, show the player's row first, then the opponent's.
				<>
					{/* Player's row */}
					<Grid sx={rowStyle}>
						<LeaderBase
							player={connectedPlayer}
							isLobbyView={isLobbyView}
							title={connectedPlayer}
						/>
					</Grid>
					{/* Opponent's row */}
					<Grid sx={rowStyle}>
						<LeaderBase
							player={getOpponent(connectedPlayer)}
							isLobbyView={isLobbyView}
							title={titleOpponent}
						/>
					</Grid>
				</>
			) : (
				// Otherwise (in-game view), show the opponent's row first, then the player’s row, with the CardActionTray in between.
				<>
					{/* Opponent's row */}
					<Grid sx={rowStyle}>
						<LeaderBase
							player={getOpponent(connectedPlayer)}
							isLobbyView={isLobbyView}
							title={titleOpponent}
						/>
					</Grid>
					<CardActionTray />
					{/* Player's row */}
					<Grid sx={rowStyle}>
						<LeaderBase
							player={connectedPlayer}
							isLobbyView={isLobbyView}
							title={connectedPlayer}
						/>
					</Grid>
				</>
			)}
		</Grid>
	);
};

export default LeaderBaseBoard;
