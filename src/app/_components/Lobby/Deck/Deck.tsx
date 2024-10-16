import React from "react";
import { Card, Box, Typography } from "@mui/material";
import CardArea from "../../_sharedcomponents/CardArea/CardArea";
import { useDragScroll } from "@/app/_utils/useDragScroll";

const Deck: React.FC<DeckProps> = ({ activePlayer }) => {
	// Use the custom hook with horizontal or vertical scrolling as required
	const {
		containerRef,
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
		handleTouchStart,
		handleTouchMove,
		handleTouchEnd,
	} = useDragScroll("vertical");

	const { deckSize } = activePlayer;

	return (
		<Card
			sx={{
				height: "90vh",
				width: "100%",
				display: "flex",
				flexDirection: "column",
				pt: "1vh",
				mt: "4vh",
				borderRadius: "1.11vw",
				backgroundColor: "#000000E6",
				backdropFilter: "blur(20px)",
				overflow: "hidden",
			}}
		>
			<Box
				sx={{
					mb: "0",
					ml: "0",
					mr: "0",
					height: "10vh",
					width: "100%",
					position: "sticky",
					top: "0",
					zIndex: 1,
					display: "flex",
					justifyContent: "space-between",
				}}
			>
				<Typography
					sx={{
						fontSize: "1.67vw",
						fontWeight: "bold",
						color: "white",
						ml: "1vw",
					}}
				>
					Your Deck
				</Typography>
				<Typography
					sx={{
						fontSize: "1.67vw",
						fontWeight: "400",
						color: "white",
						mr: "1vw",
					}}
				>
					{deckSize}/{deckSize}
				</Typography>
			</Box>
			<Box
				ref={containerRef}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
				sx={{
					paddingX: "4vw",
					flexGrow: 1,
					overflowY: "auto",
					"::-webkit-scrollbar": {
						width: "0.2vw",
					},
					"::-webkit-scrollbar-thumb": {
						backgroundColor: "#D3D3D3B3",
						borderRadius: "1vw",
					},
					"::-webkit-scrollbar-button": {
						display: "none",
					},
					transition: "scrollbar-color 0.3s ease-in-out",
				}}
			>
				<CardArea cards={activePlayer.fullDeck} />
			</Box>
		</Card>
	);
};

export default Deck;
