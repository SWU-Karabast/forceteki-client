import React from "react";
import { Card, Box, Typography } from "@mui/material";
import CardArea from "../../_sharedcomponents/CardArea/CardArea";
import { useDragScroll } from "@/app/_utils/useDragScroll";
import {useGame} from "@/app/_contexts/Game.context";

const Deck: React.FC = () => {
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
	//------------------------STYLES------------------------//
	const cardStyle = {
		borderRadius: "1.1em",
		height: "90vh",
		width: "100%",
		display: "flex",
		flexDirection: "column",
		backgroundColor: "#00000080",
		backdropFilter: "blur(30px)",
		overflow: "hidden",
		'@media (max-height: 759px)': {
			height: '84vh',
		},
		'@media (max-height: 1000px)': {
			maxHeight: '85.5vh',
		},
	};

	const headerBoxStyle = {
		display: "flex",
		height: "100px",
		width: "100%",
		justifyContent: "space-between",
		position: "sticky",
		top: "0",
		zIndex: 1,
		pt: ".2em",
	};

	const titleTextStyle = {
		fontSize: "2em",
		fontWeight: "bold",
		color: "white",
		ml: ".6em",
	};

	const deckSizeTextStyle = {
		fontSize: "2em",
		fontWeight: "400",
		color: "white",
		mr: ".6em",
	};
	const scrollableBoxStyle = {
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
	};
	const { connectedDeck } = useGame();
	const newDeck = connectedDeck?.deckCards ?? [];

	return (
		<Box sx={{width:'100%'}}>
			<Card sx={cardStyle}>
				<Box sx={headerBoxStyle}>
					<Typography sx={titleTextStyle}>Your Deck</Typography>
					<Typography sx={deckSizeTextStyle}>
						0/{connectedDeck?.deckCards.length}
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
					sx={scrollableBoxStyle}
				>
					<CardArea cards={newDeck} />
				</Box>
			</Card>
		</Box>
	);
};

export default Deck;
