import React from "react";
import Grid from "@mui/material/Grid2";
import LeaderBase from "./LeaderBase/LeaderBase";

const LeaderBaseBoard: React.FC<LeaderBaseBoardProps> = ({
	participant,
	isLobbyView,
}) => {
	const titlePlayer = "ThisIsTheWay";
	const titleOpponent = "Order66";

	return (
		<Grid
			container
			direction="column"
			sx={{
				height: "100%",
				width: "100%",
				justifyContent: "space-between",
			}}
		>
			{/* Opponent's row */}
			<Grid sx={{ flexGrow: 1, width: "100%" }}>
				<LeaderBase
					participant={"opponent"}
					isLobbyView={isLobbyView}
					title={titleOpponent}
				/>
			</Grid>
			{/* Player's row */}
			<Grid sx={{ flexGrow: 1, width: "100%" }}>
				<LeaderBase
					participant={participant.type}
					isLobbyView={isLobbyView}
					title={titlePlayer}
				/>
			</Grid>
		</Grid>
	);
};

export default LeaderBaseBoard;
