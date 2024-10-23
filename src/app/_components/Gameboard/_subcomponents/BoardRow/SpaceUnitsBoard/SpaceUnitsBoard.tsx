import React from "react";
import { Box, Grid2 as Grid } from "@mui/material";
import FaceCard from "../../../../_sharedcomponents/Cards/FaceCard/FaceCard";

const SpaceUnitsBoard: React.FC<SpaceUnitsBoardProps> = ({
	sidebarOpen,
	playedSpaceCards,
}) => {
	//------------------------STYLES------------------------//

	const mainBoxStyle = {
		borderRadius: "20px",
		height: "60vh",
		width: sidebarOpen ? "32vw" : "36vw",
		mr: ".3vw",
		p: "1vh",
		backgroundImage: "url(/space-board.jpeg)",
		backgroundPositionX: "50%",
		backgroundSize: sidebarOpen ? "200%" : "180%",
	};

	const containerStyle = {
		height: "100%",
	};

	const opponentGridStyle = {
		flexGrow: 1,
		display: "flex",
		justifyContent: "flex-end",
		alignItems: "flex-start",
		gap: "0.5vw",
		flexWrap: "nowrap",
		overflowX: "auto",
	};

	const playerGridStyle = {
		flexGrow: 1,
		display: "flex",
		justifyContent: "flex-end",
		alignItems: "flex-end",
		gap: "0.5vw",
		flexWrap: "nowrap",
		overflowX: "auto",
	};

	//------------------------RETURN------------------------//

	return (
		<Box sx={mainBoxStyle}>
			<Grid container direction="column" sx={containerStyle}>
				{/* Opponent's Space Units */}
				<Grid sx={opponentGridStyle}>
					{playedSpaceCards.opponent.map((card) => (
						<FaceCard
							key={card.id}
							name={card.name}
							unitType={card.unitType}
							selected={card.selected}
							handleSelect={card.handleSelect}
							disabled
						/>
					))}
				</Grid>

				{/* Player's Space Units */}
				<Grid sx={playerGridStyle}>
					{playedSpaceCards.player.map((card) => (
						<FaceCard
							key={card.id}
							name={card.name}
							unitType={card.unitType}
							selected={card.selected}
							handleSelect={card.handleSelect}
							disabled
						/>
					))}
				</Grid>
			</Grid>
		</Box>
	);
};

export default SpaceUnitsBoard;
