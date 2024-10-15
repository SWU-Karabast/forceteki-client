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
				backgroundColor: "rgba(0, 0, 0, 0.9)",
				"&:hover": {
					backgroundColor: "rgba(112, 128, 144, 0.9)",
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
