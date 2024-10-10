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
	return (
		<Box sx={{ position: "relative", display: "inline-block" }}>
			{/* Show title above the card if in lobby view */}
			{isLobbyView && (
				<Typography
					variant="subtitle1"
					sx={{
						fontFamily: "var(--font-barlow), sans-serif",
						fontWeight: "800",

						textAlign: "Left",
						marginBottom: "4px",
						color: "white",
					}}
				>
					{title}
				</Typography>
			)}

			<Card
				sx={{
					fontFamily: "var(--font-barlow), sans-serif",
					fontWeight: "400",
					border: selected ? "2px solid blue" : "1px solid gray",
					width: isLobbyView ? "14.5vw" : "12vw",
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
				}}
				onClick={() => {
					if (handleSelect) {
						handleSelect();
					}
				}}
			>
				<CardActionArea sx={{ height: "100%" }}>
					<CardContent>
						<Typography variant="h6">Leader Card</Typography>
					</CardContent>
				</CardActionArea>

				{/* Show title inside a red box at the bottom if not in lobby view */}
				{!isLobbyView && (
					<Box
						sx={{
							position: "absolute",
							bottom: "10px",
							left: "50%",
							transform: "translateX(-50%)",
							backgroundColor: "red",
							padding: "4px 8px",
							borderRadius: "4px",
						}}
					>
						<Typography variant="body2" sx={{ color: "white" }}>
							{title}
						</Typography>
					</Box>
				)}
			</Card>
		</Box>
	);
};

export default LeaderCard;
