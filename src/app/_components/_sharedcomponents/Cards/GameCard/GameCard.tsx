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
import { wrap } from "module";
import { text } from "stream/consumers";

const GameCard: React.FC<GameCardProps> = ({
	card,
	size = "standard",
}) => {
	// const isLobbyView = path === "/lobby";
	const isLobbyView = false;
	const isFaceUp = true

	const { sendGameMessage } = useGame();

	const cardBorderColor = (card: CardData) => {
		if (card.selected) return "yellow";
		if (card.selectable) return "green";
		if (card.exhausted) return "gray";
		return "";
	}

	const styles = {
		cardWrapper: {
			height: size === "standard" ? "9.36rem" : "8rem",
			width: size === "standard" ? "6rem" : "8rem",
		},
		cardContentStyle: {
			width: "100%",
			height: "100%",
			position: "relative",
			padding: ".5em",
			textAlign: "center",
			whiteSpace: "normal",
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
				<CardActionArea sx={styles.cardWrapper}>
					<CardContent sx={styles.cardContentStyle}>
						<Box sx={{ display: 'flex', flexDirection: 'column', height: "100%"}}>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', flex: 1}}>
								<Typography variant="body1" component="span" sx={{...styles.typographyStyle, color: 'goldenrod'}}>
									{card.cost}
								</Typography>
								<Typography variant="body1" component="span" sx={{...styles.typographyStyle, color: 'hotpink'}}>
									{card.damage}
								</Typography>
							</Box>
							<Typography variant="body1" component="span" sx={styles.typographyStyle}>
								{card.name}
							</Typography>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: "flex-end", flex: 1}}>
								<Typography variant="body1" component="span" sx={{...styles.typographyStyle, color: 'red'}}>
									{card.power}
								</Typography>
								<Typography variant="body1" component="span" sx={{...styles.typographyStyle, color: 'blue'}}>
									{card.hp}
								</Typography>
							</Box>
						</Box>
					</CardContent>
				</CardActionArea>
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
