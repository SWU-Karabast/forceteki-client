import React from "react";
import { Card, Box, Typography } from "@mui/material";
import CardArea from "../../CardArea/CardArea";
import { useDragScroll } from "@/app/utils/useDragScroll";

const SetUp: React.FC<DeckProps> = ({ activePlayer }) => {
	// Use the custom hook with horizontal or vertical scrolling as required
	const {
		containerRef,
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
		handleTouchStart,
		handleTouchMove,
		handleTouchEnd,
		isScrolling,
	} = useDragScroll("vertical");

	const { deckSize } = activePlayer;

	return (
		<Card
			sx={{
				borderRadius: "1.11vw",
				borderColor: "rgba(255, 255, 255, 0.0)",
				height: "90vh",
				width: "100%",
				display: "flex",
				flexDirection: "column",
				paddingTop: "1vh",

				marginTop: "4vh",
				backgroundColor: "rgba(40, 40, 40, 0.9)",
				overflow: "hidden", // Ensure content respects the rounded corners
			}}
		>
			<Box
				sx={{
					marginBottom: "0",
					marginLeft: "0",
					marginRight: "0",
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
						marginLeft: "1vw",
					}}
				>
					Your Deck
				</Typography>
				<Typography
					sx={{
						fontSize: "1.67vw",
						fontWeight: "400",
						color: "white",
						marginRight: "1vw",
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
						backgroundColor: isScrolling
							? "rgba(211, 211, 211, 0.7)"
							: "rgba(211, 211, 211, 0.0)",
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

export default SetUp;
