import React from "react";
import { Box, Grid2 as Grid } from "@mui/material";
import GameCard from "../../../../_sharedcomponents/Cards/GameCard/GameCard";
import { SpaceUnitsBoardProps } from "@/app/_components/Gameboard/GameboardTypes";

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

	return (
		<Box sx={mainBoxStyle}>
			<Grid container direction="column" sx={containerStyle}>
				{/* Opponent's Ground Units */}
				<Grid sx={opponentGridStyle}>
					{playedSpaceCards.opponent.map((card) => (
						<GameCard
							key={card.id}
							name={card.name}
							unitType={card.unitType}
							selected={card.selected}
							handleSelect={card.handleSelect}
							disabled
							isFaceUp={true}
						/>
					))}
				</Grid>

				{/* Player's Ground Units */}
				<Grid sx={playerGridStyle}>
					{playedSpaceCards.player.map((card) => (
						<GameCard
							key={card.id}
							name={card.name}
							unitType={card.unitType}
							selected={card.selected}
							handleSelect={card.handleSelect}
							disabled
							isFaceUp={true}
						/>
					))}
				</Grid>
			</Grid>
		</Box>
	);
};

export default SpaceUnitsBoard;
