import React from "react";
import { Card, CardActionArea, CardContent, Typography } from "@mui/material";

// BaseCard Component
const BaseCard: React.FC<BaseCardProps> = ({
	selected = false,
	handleSelect,
	isLobbyView,
}) => {
	//------------------------STYLES------------------------//

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
	};

	const typographyStyle = {
		fontFamily: "var(--font-barlow), sans-serif",
		fontWeight: "400",
		fontSize: "1.6em",
	};

	return (
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
						Base Card
					</Typography>
				</CardContent>
			</CardActionArea>
		</Card>
	);
};

export default BaseCard;
