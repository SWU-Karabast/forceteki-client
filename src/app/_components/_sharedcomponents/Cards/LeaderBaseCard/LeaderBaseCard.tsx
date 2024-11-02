import React from "react";
import {
	Card,
	CardActionArea,
	CardContent,
	Typography,
	Box,
} from "@mui/material";
import { LeaderBaseCardProps } from "../CardTypes";

const LeaderBaseCard: React.FC<LeaderBaseCardProps> = ({
	variant,
	selected = false,
	isLobbyView = false,
	handleSelect,
	title,
}) => {
	const cardStyle = {
		border: selected ? "2px solid blue" : "1px solid gray",
		width: isLobbyView ? "18vw" : "12vw",
		height: isLobbyView ? "18vh" : "11vh",
		textAlign: "center",
		color: "white",
		display: "flex",
		backgroundColor: "#000000E6",
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

	return (
		<Box>
			{/* Show title above the card if in lobby view and variant is leader */}
			{variant === "leader" && isLobbyView && title && (
				<Typography variant="subtitle1" sx={titleTypographyStyle}>
					{title}
				</Typography>
			)}

			<Card
				sx={cardStyle}
				onClick={() => {
					if (handleSelect) {
						handleSelect();
					}
				}}
			>
				<CardActionArea>
					<CardContent>
						<Typography variant="body1" sx={typographyStyle}>
							{variant === "leader" ? "Leader Card" : "Base Card"}
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
		</Box>
	);
};

export default LeaderBaseCard;
