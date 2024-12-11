import React from "react";
import {
	Card,
	CardActionArea,
	CardContent,
	Typography,
	Box,
} from "@mui/material";
import { ILeaderBaseCardProps } from "../CardTypes";
import { ICardData } from "../CardTypes";
import { useGame } from "@/app/_contexts/Game.context";
import { s3CardImageURL } from "@/app/_utils/s3Utils";


const LeaderBaseCard: React.FC<ILeaderBaseCardProps> = ({
	variant,
	isLobbyView = false,
	title,
	card
}) => {
	const cardBorderColor = (card: ICardData) => {
		if (!card) return "";
		if (card.selected) return "yellow";
		if (card.selectable) return "limegreen";
		if (card.exhausted) return "gray";
		return "black";
	};

	const cardStyle = {
		backgroundColor: "black",
		backgroundImage: `url(${s3CardImageURL(card)})`,
		backgroundSize: "contain",
		backgroundPosition: "center",
		width: "10rem",
		height: "7.18rem",
		textAlign: "center",
		color: "white",
		display: "flex",
		cursor: "pointer",
		m: "0em",
		position: "relative", // Needed for positioning the red box
		border: `2px solid ${cardBorderColor(card)}`,
	};

	const typographyStyle = {
		fontFamily: "var(--font-barlow), sans-serif",
		fontWeight: "400",
		fontSize: "1.6em",
	};

	const damageStyle = {
		fontWeight: "600",
		fontSize: "2em",
		color: "hotpink",
	};

	const titleTypographyStyle = {
		fontFamily: "var(--font-barlow), sans-serif",
		fontWeight: "600",
		fontSize: "1.5em",
		marginBottom: isLobbyView ? 0 : "0.5em",
		textAlign: "left",
		color: "white",
	};

	//the title of the deck i believe
	const redBoxStyle = {
		position: "absolute",
		bottom: "10px",
		left: "50%",
		transform: "translateX(-50%)",
		backgroundColor: "red",
		borderRadius: "4px",
		p: "4px 8px",
	};

	const redBoxTypographyStyle = {
		color: "white",
		fontFamily: "var(--font-barlow), sans-serif",
		fontWeight: "600",
		fontSize: "1em",
	};

	const { sendGameMessage } = useGame();

	return (
		<Box>
			{/* Show title above the card if in lobby view and variant is leader */}
			{variant === "leader" && isLobbyView && title && (
				<Typography variant="subtitle1" sx={titleTypographyStyle}>
					{title}
				</Typography>
			)}

			{isLobbyView ? (
				<Card></Card>
			) : (
				<Card
					sx={cardStyle}
					onClick={() => {
						if (card.selectable) {
							sendGameMessage(["cardClicked", card.uuid]);
						}
					}}
				>
					<CardContent>
						<Box sx={{ display: "flex", justifyContent: "end" }}>
							<Typography variant="body1" sx={damageStyle}>{card.damage}</Typography>
						</Box>
					</CardContent>

					{/* Show title inside a red box at the bottom if not in lobby view and variant is leader */}
					{variant === "leader" && !isLobbyView && title && (
						<Box sx={redBoxStyle}>
							<Typography variant="body2" sx={redBoxTypographyStyle}>
								{title}
							</Typography>
						</Box>
					)}
				</Card>
			)}

			
		</Box>
	);
};

export default LeaderBaseCard;
