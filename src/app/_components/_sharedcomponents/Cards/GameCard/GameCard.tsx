import React from "react";
import {
	Card as MuiCard,
	CardContent,
	CardActionArea,
	Typography,
	Box,
} from "@mui/material";
import Image from "next/image";
import { IGameCardProps, ICardData } from "@/app/_components/_sharedcomponents/Cards/CardTypes";
import { useGame } from "@/app/_contexts/Game.context";
import { s3CardImageURL } from "@/app/_utils/s3Utils";

const GameCard: React.FC<IGameCardProps> = ({
	card,
	size = "standard",
}) => {
	// const isLobbyView = path === "/lobby";
	const isLobbyView = false;
	const isFaceUp = true

	const { sendGameMessage } = useGame();

	const cardBorderColor = (card: ICardData) => {
		if (card.selected) return "yellow";
		if (card.selectable) return "limegreen";
		if (card.exhausted) return "gray";
		return "";
	}

	const styles = {
		cardStyles: {
			borderRadius: ".38em",
			height: size === "standard" ? "10rem" : "8rem",
			width: size === "standard" ? "7.18rem" : "8rem",
		},
		cardContentStyle: {
			width: "100%",
			height: "100%",
			position: "relative",
			padding: ".5em",
			textAlign: "center",
			whiteSpace: "normal",
			backgroundColor: "black",
			backgroundImage: `url(${s3CardImageURL(card)})`,
			backgroundSize: size === "standard" ? "contain" : "cover",
			backgroundPosition: size === "standard" ? "center" : "top",
			backgroundRepeat: "no-repeat",
			border: `2px solid ${cardBorderColor(card)}`,
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
		<MuiCard sx={styles.cardStyles}
			onClick={() => {
				if (card.selectable) {
					sendGameMessage(["cardClicked", card.uuid]);
				}
			}}
		>
			{isFaceUp ? (
				<CardContent sx={styles.cardContentStyle}>
					<Box sx={{ display: 'flex', flexDirection: 'column', height: "100%"}}>
						
					</Box>
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
