import React from "react";
import Grid from "@mui/material/Grid2";
import UnitsBoard from "../_subcomponents/UnitsBoard";
import { IBoardProps } from "@/app/_components/Gameboard/GameboardTypes";
import {useGame} from "@/app/_contexts/Game.context";
import LeaderBaseCard from "@/app/_components/_sharedcomponents/Cards/LeaderBaseCard/LeaderBaseCard";
import { Box } from "@mui/material";
import CardActionTray from "@/app/_components/Gameboard/_subcomponents/PlayerTray/CardActionTray";

const Board: React.FC<IBoardProps> = ({
	sidebarOpen,
}) => {
	const { gameState, connectedPlayer } = useGame();

	const titleOpponent =
		connectedPlayer === "ThisIsTheWay" ? "Order66" : "ThisIsTheWay";

	const playerLeader = gameState?.players[connectedPlayer].leader;
	const playerBase = gameState?.players[connectedPlayer].base;
	const opponentLeader = gameState?.players[titleOpponent].leader;
	const opponentBase = gameState?.players[titleOpponent].base;


	//----------------Styles----------------//
	const leftColumnStyle = {
		justifyContent: "flex-end",
		alignItems: "center",
	};

	const rightColumnStyle = {
		justifyContent: "flex-start",
		alignItems: "center",
	};
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
	const rowStyle = {
		flexGrow: 1,
		width: "100%"
	};
	return (
		<Grid container sx={{ height: "64.18%" }}>
			<Grid container size={5} sx={leftColumnStyle}>
				<UnitsBoard
					sidebarOpen={sidebarOpen} arena="spaceArena"
				/>
			</Grid>
			<Grid container size={2}>
				<Grid sx={rowStyle}>
					<Grid container direction="column" sx={containerStyle}>
						<Box sx={lobbyLeaderBaseContainer}>
							<LeaderBaseCard
								variant="leader"
								title={titleOpponent}
								isLobbyView={false}
								card={opponentLeader}
							/>
							<LeaderBaseCard variant="base" isLobbyView={false} card={opponentBase}></LeaderBaseCard>
						</Box>
					</Grid>
				</Grid>
				<CardActionTray />
				<Grid sx={rowStyle}>
					<Grid container direction="column" sx={containerStyle}>
						<Box sx={lobbyLeaderBaseContainer}>
							<LeaderBaseCard
								variant="leader"
								isLobbyView={false}
								title={connectedPlayer}
								card={playerLeader}
							/>
							<LeaderBaseCard variant="base" isLobbyView={false} card={playerBase}></LeaderBaseCard>
						</Box>
					</Grid>
				</Grid>
			</Grid>
			<Grid container size={5} sx={rightColumnStyle}>
				<UnitsBoard
					sidebarOpen={sidebarOpen} arena="groundArena"
				/>
			</Grid>
		</Grid>
	);
};

export default Board;
