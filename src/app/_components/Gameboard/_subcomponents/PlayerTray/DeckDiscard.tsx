import React from "react";
import { Card, CardContent, Box, Typography } from "@mui/material";
// import GameCard from "../../../_sharedcomponents/Cards/GameCard/GameCard";
import { DeckDiscardProps } from "@/app/_components/Gameboard/GameboardTypes";

const DeckDiscard: React.FC<DeckDiscardProps> = () => {
	//------------------------STYLES------------------------//
	const containerStyle = {
		display: "flex",
		flexDirection: "row",
		gap: "1vw",
		justifyContent: "center",
		alignItems: "center",
	};

	const discardCardStyle = {
		backgroundColor: "#282828E6",
		width: "9vh",
		height: "9vh",
	};

	const cardContentStyle = {
		height: "100%",
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		textAlign: "center",
	};

	const discardTextStyle = {
		fontFamily: "var(--font-barlow), sans-serif",
		fontWeight: "800",
		fontSize: "1.2em",
		color: "white",
	};

	return (
		<Box sx={containerStyle}>
			<Card sx={discardCardStyle}>
				<CardContent sx={cardContentStyle}>
					<Typography sx={discardTextStyle}>Discard</Typography>
				</CardContent>
			</Card>
			{/* <GameCard deckSize={deckSize} isFaceUp={false} /> */}
		</Box>
	);
};

export default DeckDiscard;
