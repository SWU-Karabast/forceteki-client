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

	//------------------------STYLES------------------------//

	const cardStyle = {
		backgroundColor: "#282828E6",
		border: selected ? "2px solid blue" : "1px solid gray",
		opacity: disabled ? 0.8 : 1,
		width: path === "/lobby" ? "10vh" : "8vh",
		height: path === "/lobby" ? "10vh" : "8vh",
		textAlign: "center",
		textWrap: "wrap",
		color: "white",
		"&:hover": {
			backgroundColor: disabled ? "#000000CC" : "#708090CC",
		},
		cursor: disabled ? "not-allowed" : "pointer",
	};

	const typographyStyle = {
		fontFamily: "var(--font-barlow), sans-serif",
		fontWeight: "400",
		fontSize: isLobbyView ? "2em" : "1.6em",
	};

	return (
		<Card
			sx={cardStyle}
			onClick={() => {
				if (!disabled && handleSelect) {
					handleSelect();
				}
			}}
		>
			<CardActionArea>
				<CardContent>
					<Typography variant="body1" sx={typographyStyle}>
						{name}
					</Typography>
				</CardContent>
			</CardActionArea>
		</Card>
	);
};

export default FaceCard;
