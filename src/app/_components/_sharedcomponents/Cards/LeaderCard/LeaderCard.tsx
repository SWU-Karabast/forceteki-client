import React from "react";
import {
	Card,
	CardActionArea,
	CardContent,
	Typography,
	Box,
} from "@mui/material";

const LeaderCard: React.FC<LeaderCardProps> = ({
	selected = false,
	handleSelect,
	isLobbyView,
	title,
}) => {
	//------------------------STYLES------------------------//

	const boxStyle = {
		position: "relative",
		display: "inline-block",
	};

	const titleTypographyStyle = {
		fontFamily: "var(--font-barlow), sans-serif",
		fontWeight: "800",
		textAlign: "Left",
		color: "white",
		mb: "4px",
	};

	const cardStyle = {
		fontFamily: "var(--font-barlow), sans-serif",
		fontWeight: "400",
		border: selected ? "2px solid blue" : "1px solid gray",
		width: isLobbyView ? "18vw" : "12vw",
		height: isLobbyView ? "18vh" : "11vh",
		textAlign: "center",
		color: "white",
		display: "flex",
		backgroundColor: "rgba(0, 0, 0, 0.8)",
		position: "relative",
		"&:hover": {
			backgroundColor: "rgba(112, 128, 144, 0.8)",
		},
		cursor: "pointer",
	};

	const cardActionAreaStyle = {
		height: "100%",
	};

	const redBoxStyle = {
		position: "absolute",
		bottom: "10px",
		left: "50%",
		transform: "translateX(-50%)",
		backgroundColor: "red",
		p: "4px 8px",
		borderRadius: "4px",
	};

	const redBoxTypographyStyle = {
		color: "white",
	};

	const typographyStyle = {
		fontFamily: "var(--font-barlow), sans-serif",
		fontWeight: "400",
		fontSize: "1.6em",
	};

	return (
		<Box sx={boxStyle}>
			{/* Show title above the card if in lobby view */}
			{isLobbyView && (
				<Typography variant="subtitle1" sx={titleTypographyStyle}>
					{title}
				</Typography>
			)}

			<Card sx={cardStyle} onClick={handleSelect}>
				<CardActionArea sx={cardActionAreaStyle}>
					<CardContent>
						<Typography variant="body1" sx={typographyStyle}>
							Leader Card
						</Typography>
					</CardContent>
				</CardActionArea>

				{/* Show title inside a red box at the bottom if not in lobby view */}
				{!isLobbyView && (
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

export default LeaderCard;
