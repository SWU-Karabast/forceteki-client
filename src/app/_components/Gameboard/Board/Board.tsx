import React from "react";
import Grid from "@mui/material/Grid2";
import SpaceUnitsBoard from "../_subcomponents/BoardRow/SpaceUnitsBoard/SpaceUnitsBoard";
import GroundUnitsBoard from "../_subcomponents/BoardRow/GroundUnitsBoard/GroundUnitsBoard";
import LeaderBaseBoard from "../../_sharedcomponents/LeaderBaseBoard/LeaderBaseBoard";
import { BoardProps } from "@/app/_components/Gameboard/GameboardTypes";

const Board: React.FC<BoardProps> = ({
	sidebarOpen,
	playedGroundCards,
	playedSpaceCards,
	participant,
}) => {
	//----------------Styles----------------//
	const leftColumnStyle = {
		justifyContent: "flex-end",
		alignItems: "center",
	};

	const rightColumnStyle = {
		justifyContent: "flex-start",
		alignItems: "center",
	};

	return (
		<Grid container sx={{ height: "64.18%" }}>
			<Grid container size={5} sx={leftColumnStyle}>
				<SpaceUnitsBoard
					sidebarOpen={sidebarOpen}
					playedSpaceCards={playedSpaceCards}
				/>
			</Grid>
			<Grid container size={2}>
				<LeaderBaseBoard participant={participant} />
			</Grid>
			<Grid container size={5} sx={rightColumnStyle}>
				<GroundUnitsBoard
					sidebarOpen={sidebarOpen}
					playedGroundCards={playedGroundCards}
				/>
			</Grid>
		</Grid>
	);
};

export default Board;
