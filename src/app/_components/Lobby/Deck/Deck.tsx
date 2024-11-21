import React from "react";
import { Card, Box, Typography } from "@mui/material";
import CardArea from "../../_sharedcomponents/CardArea/CardArea";
import { useDragScroll } from "@/app/_utils/useDragScroll";


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
		mt: "2.6em",
		backgroundColor: "#000000E6",
		backdropFilter: "blur(20px)",
		overflow: "hidden",
	};

	const headerBoxStyle = {
		display: "flex",
		height: "10vh",
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
		px: "5em",
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

	return (
		<Card sx={cardStyle}>
			<Box sx={headerBoxStyle}>
				<Typography sx={titleTextStyle}>Your Deck</Typography>
				<Typography sx={deckSizeTextStyle}>
					0/0
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
				<CardArea cards={[]} />
			</Box>
		</Card>
	);
};

export default Deck;
