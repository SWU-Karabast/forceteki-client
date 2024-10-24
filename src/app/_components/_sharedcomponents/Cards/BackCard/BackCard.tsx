import React from "react";
import { Card, CardContent, Box, Typography } from "@mui/material";
import Image from "next/image";

const BackCard: React.FC<BackCardProps> = ({ deckSize }) => {
	//------------------------STYLES------------------------//

	const cardStyle = {
		backgroundColor: "#282828E6",
		width: "9vh",
		height: "9vh",
		display: "flex",
		borderRadius: "5px",
		justifyContent: "center",
		alignItems: "center",
		position: "relative",
	};

	const cardContentStyle = {
		width: "100%",
		height: "100%",
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		textAlign: "center",
		position: "relative",
	};

	const imageStyle = {
		width: "11.29vh",
		height: "auto",
	};

	const circularBackgroundStyle = {
		width: "5.5vh",
		height: "5.5vh",
		backgroundColor: "#141414E6",
		borderRadius: "50%",
		position: "absolute",
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
	};

	const deckSizeTextStyle = {
		fontFamily: "var(--font-barlow), sans-serif",
		fontWeight: "800",
		fontSize: "2em",
		color: "white",
		position: "absolute",
	};

	return (
		<Card sx={cardStyle}>
			<CardContent sx={cardContentStyle}>
				<Image
					src="/card-back.png"
					alt="Deck Image"
					width={28} // images using the next/image component must have a width and height even if it's not the final display size, this is because next/image needs to know the size of the image before it's loaded to do the optimization
					height={38}
					placeholder="empty"
					style={imageStyle}
				/>

				{deckSize && deckSize > 0 && (
					<>
						{/* Circular background */}
						<Box sx={circularBackgroundStyle}></Box>

						{/* Deck Size Number */}
						<Typography variant="body2" sx={deckSizeTextStyle}>
							{deckSize}
						</Typography>
					</>
				)}
			</CardContent>
		</Card>
	);
};

export default BackCard;
