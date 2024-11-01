import React from "react";
import { Card, CardContent, Box, Typography } from "@mui/material";
import Image from "next/image";
import { ResourcesProps } from "@/app/_components/Gameboard/GameboardTypes";

const Resources: React.FC<ResourcesProps> = ({
	availableResources,
	totalResources,
	activePlayer,
	handleModalToggle,
}) => {
	//------------------------STYLES------------------------//

	const cardStyle = {
		backgroundColor: "#282828E6",
		width: "9.52vw",
		height: "9vh",
		display: "flex",
		borderRadius: "5px",
		justifyContent: "center",
		alignItems: "center",
		transition: "background-color 0.3s ease",
		"&:hover": {
			background:
				activePlayer === "player"
					? "linear-gradient(to top, white, transparent)"
					: null,
		},
	};

	const boxStyle = {
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		flexDirection: "row",
		gap: "1vw",
		height: "4.47vh",
	};

	const imageStyle = {
		width: "2.50vw",
		height: `calc(2.50vw * 1.357)`, // this was the image ratio in the figma images
	};

	const availableAndTotalResourcesTextStyle = {
		fontFamily: "var(--font-barlow), sans-serif",
		fontWeight: "800",
		fontSize: "3.2em",
		color: "white",
	};

	return (
		<Card
			sx={cardStyle}
			onClick={() => {
				if (activePlayer === "player" && handleModalToggle) {
					handleModalToggle();
				}
			}}
		>
			<CardContent sx={{ display: "flex" }}>
				<Box sx={boxStyle}>
					<Image
						src="/resource-icon.png"
						alt="Resource Icon"
						width={28}
						height={38}
						style={imageStyle}
					/>
					<Typography sx={availableAndTotalResourcesTextStyle}>
						{availableResources}/{totalResources}
					</Typography>
				</Box>
			</CardContent>
		</Card>
	);
};

export default Resources;
