import React from "react";
import {
	Card,
	CardActionArea,
	CardContent,
	Typography,
	Box,
} from "@mui/material";
import { LeaderBaseCardProps } from "../CardTypes";
import { CardData } from "../CardTypes";
import { useGame } from "@/app/_contexts/Game.context";


const LeaderBaseCard: React.FC<LeaderBaseCardProps> = ({
	variant,
	isLobbyView = false,
	title,
	card
}) => {
	const cardBorderColor = (card: CardData) => {
		if (!card) return "";
		if (card.selected) return "yellow";
		if (card.selectable) return "green";
		if (card.exhausted) return "gray";
		return "black";
	};

	const cardStyle = {
		backgroundColor: cardBorderColor(card),
		width: isLobbyView ? "18vw" : "12vw",
		height: isLobbyView ? "18vh" : "11vh",
		textAlign: "center",
		color: "white",
		display: "flex",
		backdropFilter: "blur(20px)",
		"&:hover": {
			backgroundColor: "#708090E6",
		},
		cursor: "pointer",
		m: "0em",
		position: "relative", // Needed for positioning the red box
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

	const { sendMessage } = useGame();

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
							sendMessage(["cardClicked", card.uuid]);
						}
					}}
				>
					<CardActionArea>
						<CardContent>
							<Box sx={{ display: "flex", justifyContent: "end" }}>
								<Typography variant="body1" sx={damageStyle}>{card.damage}</Typography>
							</Box>
							<Typography variant="body1" sx={typographyStyle}>
								{card.name}
							</Typography>
						</CardContent>
					</CardActionArea>

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
