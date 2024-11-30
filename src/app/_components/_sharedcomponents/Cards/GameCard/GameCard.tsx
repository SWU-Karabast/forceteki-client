import React from "react";
import {
	Card as MuiCard,
	CardContent,
	CardActionArea,
	Typography,
	Box,
} from "@mui/material";
import Image from "next/image";
import { GameCardProps, CardData } from "@/app/_components/_sharedcomponents/Cards/CardTypes";
import { useGame } from "@/app/_contexts/Game.context";

const GameCard: React.FC<GameCardProps> = ({
	card
}) => {
	// const isLobbyView = path === "/lobby";
	const isLobbyView = false;
	const isFaceUp = true

	// Base styles shared between face-up and face-down cards
	// const baseCardStyle = {
	// 	backgroundColor: "#282828E6",
	// 	display: "flex",
	// 	borderRadius: "5px",
	// 	justifyContent: "center",
	// 	alignItems: "center",
	// 	position: "relative",
	// };

	// Styles specific to face-up cards
	// const faceCardStyle = {
	// 	...baseCardStyle,
	// 	width: isLobbyView ? "10vh" : "8vh",
	// 	height: isLobbyView ? "10vh" : "8vh",
	// 	// border: selected ? "2px solid blue" : "1px solid gray",
	// 	// opacity: disabled ? 0.8 : 1,
	// 	textAlign: "center",
	// 	textWrap: "wrap",
	// 	color: "white",
	// 	// "&:hover": {
	// 	// 	backgroundColor: disabled ? "#000000CC" : "#708090CC",
	// 	// },
	// 	// cursor: disabled ? "not-allowed" : "pointer",
	// };

	// Styles specific to face-down cards
	// const backCardStyle = {
	// 	...baseCardStyle,
	// 	width: "9vh",
	// 	height: "9vh",
	// };

	const cardContentStyle = {
		width: "100%",
		height: "100%",
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		textAlign: "center" as const,
		position: "relative" as const,
	};

	const imageStyle = {
		width: "11.29vh",
		height: "auto",
	};

	// const circularBackgroundStyle = {
	// 	width: "5.5vh",
	// 	height: "5.5vh",
	// 	backgroundColor: "#141414E6",
	// 	borderRadius: "50%",
	// 	position: "absolute" as const,
	// 	display: "flex",
	// 	justifyContent: "center",
	// 	alignItems: "center",
	// };

	// const deckSizeTextStyle = {
	// 	fontFamily: "var(--font-barlow), sans-serif",
	// 	fontWeight: "800",
	// 	fontSize: "2em",
	// 	color: "white",
	// 	position: "absolute" as const,
	// };

	const typographyStyle = {
		color: "black",
		fontWeight: "400",
		fontSize: isLobbyView ? "2em" : "1.6em",
	};

	const { sendGameMessage } = useGame();

	const cardBorderColor = (card: CardData) => {
		if (card.selected) return "yellow";
		if (card.selectable) return "green";
		if (card.exhausted) return "gray";
		return "";
	}

	return (
		<MuiCard sx={{ backgroundColor: cardBorderColor(card) }}
			onClick={() => {
				if (card.selectable) {
					sendGameMessage(["cardClicked", card.uuid]);
				}
			}}
		>
			{isFaceUp ? (
				<CardActionArea>
					<CardContent>
						<Box sx={{ display: 'flex', flexDirection: 'column'}}>
							<Box sx={{ display: 'flex', justifyContent: 'space-between'}}>
								<Typography variant="body1" sx={{...typographyStyle, color: 'goldenrod'}}>
									{card.cost}
								</Typography>
								<Typography variant="body1" sx={{...typographyStyle, color: 'hotpink'}}>
									{card.damage}
								</Typography>
							</Box>
							<Typography variant="body1" sx={typographyStyle}>
								{card.name}
							</Typography>
							<Box sx={{ display: 'flex', justifyContent: 'space-between'}}>
								<Typography variant="body1" sx={{...typographyStyle, color: 'red'}}>
									{card.power}
								</Typography>
								<Typography variant="body1" sx={{...typographyStyle, color: 'blue'}}>
									{card.hp}
								</Typography>
							</Box>
						</Box>
					</CardContent>
				</CardActionArea>
			) : (
				<CardContent sx={cardContentStyle}>
					<Image
						src="/card-back.png"
						alt="Deck Image"
						width={28}
						height={38}
						placeholder="empty"
						style={imageStyle}
					/>
					{/* {deckSize && deckSize > 0 && (
						<>
							<Box sx={circularBackgroundStyle}></Box>
							<Typography variant="body2" sx={deckSizeTextStyle}>
								{deckSize}
							</Typography>
						</>
					)} */}
				</CardContent>
			)}
		</MuiCard>
	);
};

export default GameCard;
