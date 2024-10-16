import React from "react";
import { Card, CardActionArea, CardContent, Typography } from "@mui/material";

// BaseCard Component
const BaseCard: React.FC<BaseCardProps> = ({
	selected = false,
	handleSelect,
	isLobbyView,
}) => {
	return (
		<Card
			sx={{
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
			}}
			onClick={() => {
				if (handleSelect) {
					handleSelect();
				}
			}}
		>
			<CardActionArea>
				<CardContent>
					<Typography variant="h6">Base Card</Typography>
				</CardContent>
			</CardActionArea>
		</Card>
	);
};

export default BaseCard;
