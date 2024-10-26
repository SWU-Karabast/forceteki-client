import React from "react";
import Grid from "@mui/material/Grid2";
import LeaderBase from "./LeaderBase/LeaderBase";
import { usePlayer } from '@/app/_contexts/Player.context';

const LeaderBaseBoard: React.FC<LeaderBaseBoardProps> = ({
	participant,
	isLobbyView,
}) => {
	const { connectedPlayer } = usePlayer()
	const titleOpponent = connectedPlayer === 'ThisIsTheWay' ? 'Order66' : 'ThisIsTheWay';
	//------------------------STYLES------------------------//

	const containerStyle = {
		height: "100%",
		width: "100%",
		justifyContent: "space-between",
	};

	const rowStyle = {
		flexGrow: 1,
		width: "100%",
	};

	return (
		<Grid container direction="column" sx={containerStyle}>
			{/* Opponent's row */}
			<Grid sx={rowStyle}>
				<LeaderBase
					participant={"opponent"}
					isLobbyView={isLobbyView}
					title={titleOpponent}
				/>
			</Grid>
			{/* Player's row */}
			<Grid sx={rowStyle}>
				<LeaderBase
					participant={participant.type}
					isLobbyView={isLobbyView}
					title={connectedPlayer}
				/>
			</Grid>
		</Grid>
	);
};

export default LeaderBaseBoard;
