import React from "react";
import { Card, CardActionArea, CardContent, Typography } from "@mui/material";

const FaceCard: React.FC<FaceCardProps> = ({
	selected = false,
	handleSelect,
	disabled = false,
	name = "Unnamed Card",
	unitType,
	path,
}) => {
	const isLobbyView = path === "/lobby";

	return (
		<Card
			sx={{
				border: selected ? "2px solid blue" : "1px solid gray",
				opacity: disabled ? 0.8 : 1,
				width: path === "/lobby" ? "10vh" : "8vh",
				height: path === "/lobby" ? "10vh" : "8vh",
				textAlign: "center",
				color: "white",
				textWrap: "wrap",

				backgroundColor: "#282828E6",
				"&:hover": {
					backgroundColor: disabled ? "#000000CC" : "#708090CC",
				},
				cursor: disabled ? "not-allowed" : "pointer",
			}}
			onClick={() => {
				if (!disabled && handleSelect) {
					handleSelect();
				}
			}}
		>
			<CardActionArea>
				<CardContent>
					<Typography
						variant="h6"
						sx={{
							fontFamily: "var(--font-barlow), sans-serif",
							fontSize: isLobbyView ? "1.6em" : "1.3em",
						}}
					>
						{name}
					</Typography>
				</CardContent>
			</CardActionArea>
		</Card>
	);
};

export default FaceCard;
