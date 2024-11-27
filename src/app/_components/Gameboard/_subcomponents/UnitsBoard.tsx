import React from "react";
import { Box, Grid2 as Grid } from "@mui/material";
import GameCard from "../../_sharedcomponents/Cards/GameCard/GameCard";
import { CardData } from "../../_sharedcomponents/Cards/CardTypes";
import { UnitsBoardProps } from "@/app/_components/Gameboard/GameboardTypes";
import { useGame } from "@/app/_contexts/Game.context";

const UnitsBoard: React.FC<UnitsBoardProps> = ({
	sidebarOpen,
	arena
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

	//------------------------CONTEXT------------------------//
	const { gameState, connectedPlayer, getOpponent } = useGame();

	const playerUnits = gameState?.players[connectedPlayer].cardPiles[arena];
	const opponentUnits = gameState?.players[getOpponent(connectedPlayer)].cardPiles[arena];

	return (
		<Box sx={mainBoxStyle}>
			<Grid container direction="column" sx={containerStyle}>
				{/* Opponent's Ground Units */}
				<Grid sx={opponentGridStyle}>
					{opponentUnits.map((card: CardData) => (
						<Box key={card.id} sx={{ flex: "0 0 auto" }}>
							<GameCard card={card} />
						</Box>
					))}
				</Grid>

				{/* Player's Ground Units */}
				<Grid sx={playerGridStyle}>
					{playerUnits.map((card: CardData) => (
						<Box key={card.id} sx={{ flex: "0 0 auto" }}>
							<GameCard card={card} />
						</Box>
					))}
				</Grid>
			</Grid>
		</Box>
	);
};

export default UnitsBoard;
