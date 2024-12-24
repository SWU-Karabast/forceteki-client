import React from "react";
import {
	Card as MuiCard,
	CardContent,
	Typography,
	Box,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
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
	onClick,
	subcards = [],
	variant,
	disabled = false,
}) => {
	// const isLobbyView = path === "/lobby";
	const isFaceUp = true;

	// Determine whether card is ICardData or IServerCardData
	const cardData = isICardData(card) ? card : card.card;
	const cardCounter = !isICardData(card) ? card.count : 0;
	const { sendGameMessage } = useGame();

	// default on click
	const defaultClickFunction = () => {
		if (cardData.selectable) {
			sendGameMessage(["cardClicked", cardData.uuid]);
		}
	};
	const handleClick = onClick ?? defaultClickFunction;
	const cardBorderColor = (card: ICardData) => {
		if (card.selected) return "yellow";
		if (card.selectable) return "limegreen";
		if (card.exhausted) return "gray";
		return "";
	}
	// helper function to get the correct aspects for the upgrade cards
	const cardUpgradebackground = (card: ICardData) => {
		if (!card.aspects){
			return null
		}

		// Check if Villainy or Heroism are the sole aspects
		if (card.aspects.includes("villainy") && card.aspects.length === 1) {
			return "upgrade-black.png";
		}
		if (card.aspects.includes("heroism") && card.aspects.length === 1) {
			return "upgrade-white.png";
		}
		// Check other aspects
		switch (true) {
			case card.aspects.includes("aggression"):
				return "upgrade-red.png";
			case card.aspects.includes("command"):
				return "upgrade-green.png";
			case card.aspects.includes("cunning"):
				return "upgrade-yellow.png";
			case card.aspects.includes("vigilance"):
				return "upgrade-blue.png";
			default:
				// Fallback for unexpected cases
				return "upgrade-black.png";
		}
	};

	// Filter subcards into Shields and other upgrades
	const shieldCards = subcards.filter((subcard) => subcard.name === 'Shield');
	const otherUpgradeCards = subcards.filter((subcard) => subcard.name !== 'Shield');
	console.log(shieldCards);
	console.log(otherUpgradeCards);
	// Styles
	const styles = {
		cardStyles: {
			borderRadius: ".38em",
			...(variant === "lobby"
					? {
						height: "13rem",
						width: "10rem",
						minWidth: "101px",
						minHeight: "151px",
						overflow: "hidden",
						cursor: "pointer",
						backgroundColor: "transparent",
					}
					: {
						// For "standard" or other sizes:
						height: size === "standard" ? "10rem" : "8rem",
						width: size === "standard" ? "7.18rem" : "8rem",
						border: `2px solid ${cardBorderColor(cardData)}`,
						/*...(cardData.exhausted &&{
							transform: 'rotate(4deg)',
							transition: 'transform 0.3s ease',
						})*/
					}
			),
		},

		cardContentStyle: {
			width: "100%",
			height: "100%",
			position: "relative",
			textAlign: "center",
			whiteSpace: "normal",
			backgroundColor: variant === "lobby" ? "transparent" : "black",
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

		counterIconLayer:{
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
		powerIconLayer:{
			position: "absolute",
			width: "2rem",
			display: "flex",
			height: "2.5rem",
			bottom: "0px",
			backgroundPosition: "left",
			backgroundSize: "contain",
			backgroundRepeat: "no-repeat",
			backgroundImage: `url(/attack_v2.png)`,
			alignItems: "center",
			justifyContent: "center",
		},
		healthIconLayer:{
			position: "absolute",
			width: "2rem",
			display: "flex",
			height: "2.5rem",
			bottom: "0px",
			right: "0px",
			backgroundPosition: "right",
			backgroundSize: "contain",
			backgroundRepeat: "no-repeat",
			backgroundImage: `url(/life_v2.png)`,
			alignItems: "center",
			justifyContent: "center",
		},
		damageIconLayer:{
			position: "absolute",
			width: "6.5rem",
			display: "flex",
			height: "2.5rem",
			bottom: "0px",
			right: "18px",
			background: "linear-gradient(90deg, rgba(255, 0, 0, 0) 47.44%, rgba(255, 0, 0, 0.911111) 75.61%, #FF0000 102.56%)",
			alignItems: "center",
			justifyContent: "center",
		},
		shieldIconLayer:{
			position: "relative",
			width: "2rem",
			display: "flex",
			height: "2.5rem",
			top:"0px",
			right: "0px",
			backgroundPosition: "right",
			backgroundSize: "contain",
			backgroundRepeat: "no-repeat",
			backgroundImage: `url(/ShieldToken.png)`,
			alignItems: "center",
			justifyContent: "center",
		},
		shieldContainerStyle: {
			position:"absolute",
			top:"0px",
			width: "100%",
			justifyContent: "right",
			alignItems: "center",
			columnGap: "4px"
		},
		upgradeIconLayer:{
			position: "relative",
			width: "100%",
			display: "flex",
			height: "1.7rem",
			bottom:"0px",
			right: "0px",
			backgroundPosition: "right",
			backgroundSize: "contain",
			backgroundRepeat: "no-repeat",
			alignItems: "center",
			justifyContent: "center",
		},
		damageNumberStyle:{
			fontSize: variant === 'lobby' ? "2rem" : "1.9rem",
			fontWeight: "700",
			position: "absolute",
			right:"16px",
		},
		numberStyle:{
			fontSize: variant === 'lobby' ? "2rem" : "1.9rem",
			fontWeight: "700",
		},
		upgradeNameStyle:{
			fontSize: "10px",
			marginTop: "3.3px",
			fontWeight: "800",
			color: "black"
		},
		sentinelStyle:{
			position: "absolute",
			width: "2rem",
			display: "flex",
			height: "2.5rem",
			top:"36px",
			right: "0px",
			backgroundPosition: "right",
			backgroundSize: "contain",
			backgroundRepeat: "no-repeat",
			backgroundImage: `url(/SentinelToken.png)`,
			alignItems: "center",
			justifyContent: "center",
		}
	}
	console.log(cardData);
	return (
		<>
		<MuiCard sx={styles.cardStyles}

			 onClick={disabled ? undefined : handleClick}
		>
			{isFaceUp ? (
				<CardContent sx={styles.cardContentStyle}>
					<Box sx={{ display: 'flex', flexDirection: 'column', height: "100%"}}>
					</Box>
					{variant === "lobby" ? (
						<Box sx={styles.counterIconLayer}>
							<Typography sx={styles.numberStyle}>{cardCounter}</Typography>
						</Box>
					) : variant === "gameboard" ? (
						<>
							<Grid direction="row" container sx={styles.shieldContainerStyle}>
								{shieldCards.map((shieldCard) => (
									<>
										<Box
											key={shieldCard.uuid}
											sx={styles.shieldIconLayer}
											>
										</Box>
									</>
								))}
							</Grid>
							<Box sx={styles.sentinelStyle}>

							</Box>
							<Box sx={styles.powerIconLayer}>
								<Typography sx={{...styles.numberStyle,marginRight:"2px"}}>{cardData.power}</Typography>
							</Box>
							{Number(cardData.damage) > 0 && (
								<Box sx={styles.damageIconLayer}>
									<Typography sx={styles.damageNumberStyle}>
										{cardData.damage}
									</Typography>
								</Box>
							)}
							<Box sx={styles.healthIconLayer}>
								<Typography sx={{...styles.numberStyle,marginLeft:"2px"}}>{cardData.hp}</Typography>
							</Box>
						</>
					) : null}
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
		{otherUpgradeCards.map((subcard, index) => (
			<Box
				key={subcard.uuid}
				sx={{...styles.upgradeIconLayer, backgroundImage: `url(${(cardUpgradebackground(subcard))})`,bottom: `${index * 3}px`}}
			>
				<Typography sx={styles.upgradeNameStyle}>{subcard.name}</Typography>
			</Box>
		))}
	</>
	);
};

export default GameCard;