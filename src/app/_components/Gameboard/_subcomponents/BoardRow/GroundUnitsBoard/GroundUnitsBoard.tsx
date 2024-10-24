import React from "react";
import { Box, Grid2 as Grid } from "@mui/material";
import GameCard from "../../../../_sharedcomponents/Cards/GameCard/GameCard";

const GroundUnitsBoard: React.FC<GroundUnitsBoardProps> = ({
	sidebarOpen,
	playedGroundCards,
}) => {
	//------------------------STYLES------------------------//
	const mainBoxStyle = {
		borderRadius: "20px",
		height: "60vh",
		width: sidebarOpen ? "32vw" : "36vw",
		ml: ".3vw",
		p: "1vh",
		backgroundImage: "url(/ground-board.png)",
		backgroundPositionX: "45%",
		backgroundPositionY: sidebarOpen ? "80%" : "90%",
		backgroundSize: "200%",
	};

	const containerStyle = {
		height: "100%",
	};

	const opponentGridStyle = {
		flexGrow: 1,
		display: "flex",
		justifyContent: "flex-start",
		alignItems: "flex-start",
		gap: "0.5vw",
		flexWrap: "nowrap",
		overflowX: "auto",
	};

	const playerGridStyle = {
		flexGrow: 1,
		display: "flex",
		justifyContent: "flex-start",
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
					{playedGroundCards.opponent.map((card) => (
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
					{playedGroundCards.player.map((card) => (
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

export default GroundUnitsBoard;
