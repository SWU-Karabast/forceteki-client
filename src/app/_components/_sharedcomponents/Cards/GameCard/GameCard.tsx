import React from "react";
import {
	Card as MuiCard,
	CardContent,
	Typography,
	Box,
} from "@mui/material";
import Image from "next/image";
import { IGameCardProps, ICardData, IServerCardData } from "@/app/_components/_sharedcomponents/Cards/CardTypes";
import { useGame } from "@/app/_contexts/Game.context";
import { s3CardImageURL } from "@/app/_utils/s3Utils";

// Type guard to check if the card is ICardData
const isICardData = (card: ICardData | IServerCardData): card is ICardData => {
	return (card as ICardData).uuid !== undefined;
};

const GameCard: React.FC<IGameCardProps> = ({
	card,
	size = "standard",
	location = "gameBoard",
	pile,
	options,
}) => {
	// const isLobbyView = path === "/lobby";
	const isLobbyView = false;
	const isFaceUp = true;
	// Determine whether card is ICardData or IServerCardData
	const cardData = isICardData(card) ? card : card.card;
	const cardCounter = !isICardData(card) ? card.count : 0;
	const { sendGameMessage, connectedDeck, setConnectedDeck } = useGame();
	const cardBorderColor = (card: ICardData) => {
		if (card.selected) return "yellow";
		if (card.selectable) return "limegreen";
		if (card.exhausted) return "gray";
		return "";
	}

	// handle deck movement
	const handleSwitch = () => {
		const updatedDeck = {...connectedDeck};
		const deckList = updatedDeck.deckCards || [];
		const sideboardList = updatedDeck.sideboard || [];

		// Helper function to move the card between lists
		const moveCard = (sourceList: any[], targetList: any[]) => {
			const cardIndex = sourceList.findIndex((c: any) => c.card.id === cardData.id);

			if (cardIndex !== -1) {
				// Decrement one copy from the source card
				sourceList[cardIndex].count -= 1;

				// If count drops to zero, remove the card entirely from source
				if (sourceList[cardIndex].count === 0) {
					sourceList.splice(cardIndex, 1);
				}

				// Now handle the target list
				const existingCardIndex = targetList.findIndex((c: any) => c.card.id === cardData.id);

				if (existingCardIndex !== -1) {
					// If the card already exists in the target, just increment its count
					targetList[existingCardIndex].count += 1;
				} else {
					// If the card doesn't exist in the target, add it with count = 1
					targetList.push({ count: 1, card: { ...cardData } });
				}
			}
		};
		// Check if the card is in the deck or sideboard
		if (pile === 'Deck') {
			// Move from deck to sideboard
			moveCard(deckList, sideboardList);
		} else {
			// Move from sideboard to deck
			moveCard(sideboardList, deckList);
		}

		// Update the connectedDeck state
		setConnectedDeck(updatedDeck);
	}


	const styles = {
		cardStyles: {
			borderRadius: ".38em",
			height: size === "standard" ? "10rem" : "8rem",
			width: size === "standard" ? "7.18rem" : "8rem",
		},
		cardStylesLobby: {
			borderRadius: ".38em",
			height: "18vh",
			width: "6.7vw",
			minWidth: "101px",
			minHeight: "151px",
			overflow: "hidden",
			cursor: "pointer",
			backgroundColor: "transparent",
		},
		cardContentStyle: {
			width: "100%",
			height: "100%",
			position: "relative",
			textAlign: "center",
			whiteSpace: "normal",
			backgroundColor: "transparent",
			backgroundImage: `url(${s3CardImageURL(cardData)})`,
			backgroundSize: size === "standard" ? "contain" : "cover",
			backgroundPosition: size === "standard" ? "center" : "top",
			backgroundRepeat: "no-repeat",
		},
		imageStyle: {
			width: "2.5rem",
			height: "auto",
		},
		typographyStyle: {
			color: "black",
			fontWeight: "400",
			fontSize: "1.3em",
			margin: 0,
		},
		iconLayer:{
			position: "absolute",
			width: "100%",
			display: "flex",
			height: "20%",
			bottom: "0px",
			backgroundPosition: "center",
			backgroundSize: "contain",
			backgroundRepeat: "no-repeat",
			backgroundImage: `url(/counterIcon.svg)`,
			alignItems: "center",
			justifyContent: "center",

		},
		numberStyle:{
			fontSize: "1.5vw",
			fontWeight: "700",
		}
	}
	return (
		<MuiCard sx={location === 'lobby' ? styles.cardStylesLobby: styles.cardStyles }
			 onClick={location === 'lobby' ? handleSwitch : () => {
				 console.log("Hello world")
				 if (cardData.selectable) {
					 sendGameMessage(["cardClicked", cardData.uuid]);
				 }
			 }}
		>
			{isFaceUp ? (
				<CardContent sx={styles.cardContentStyle}>
					<Box sx={{ display: 'flex', flexDirection: 'column', height: "100%"}}>
					</Box>
					{options?.includes("counter") && (
						<Box sx={styles.iconLayer}>
							<Typography sx={styles.numberStyle}>{cardCounter}</Typography>
						</Box>
					)}
				</CardContent>
			) : (
				<CardContent sx={styles.cardContentStyle}>
					<Image
						src="/card-back.png"
						alt="Deck Image"
						width={28}
						height={38}
						placeholder="empty"
						style={styles.imageStyle}
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
