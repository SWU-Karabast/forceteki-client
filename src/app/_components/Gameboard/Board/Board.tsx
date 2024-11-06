import React from "react";
import Grid from "@mui/material/Grid2";
import UnitsBoard from "../_subcomponents/UnitsBoard";
import LeaderBaseBoard from "../../_sharedcomponents/LeaderBaseBoard/LeaderBaseBoard";
import { BoardProps } from "@/app/_components/Gameboard/GameboardTypes";

const Board: React.FC<BoardProps> = ({
	sidebarOpen,
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
				<UnitsBoard
					sidebarOpen={sidebarOpen}
				/>
			</Grid>
			<Grid container size={2}>
				<LeaderBaseBoard />
			</Grid>
			<Grid container size={5} sx={rightColumnStyle}>
				<UnitsBoard
					sidebarOpen={sidebarOpen}
				/>
			</Grid>
		</Grid>
	);
};

export default Board;
