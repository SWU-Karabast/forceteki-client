import React from "react";
import { Card, CardContent, Box, Typography } from "@mui/material";
import Image from "next/image";
import { s3TokenImageURL } from "@/app/_utils/s3Utils";
import { IResourcesProps } from "@/app/_components/Gameboard/GameboardTypes";
import { useGame } from "@/app/_contexts/Game.context";

const Resources: React.FC<IResourcesProps> = ({
	trayPlayer,
	handleModalToggle,
}) => {
	//------------------------STYLES------------------------//

	const cardStyle = {
		width: "auto",
		background: "transparent",
		display: "flex",
		borderRadius: "5px",
		justifyContent: "center",
		alignItems: "center",
		transition: "background-color 0.3s ease",
		border: "1px solid #FFFFFF55",
		padding: "1em",
		overflow: "visible",
		"&:hover": {
			background:
				trayPlayer === "player"
					? "linear-gradient(to top, white, transparent)"
					: null,
		},
	};

	const imageStyle = {
		width: "1.6em",
		marginRight: "10px",
	}

	const boxStyle = {
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		flexDirection: "row",
	};

	const availableAndTotalResourcesTextStyle = {
		fontWeight: "800",
		fontSize: "2.2em",
		color: "white",
	};

	const { gameState } = useGame();

	const availableResources = gameState.players[trayPlayer].availableResources;
	const totalResources = gameState.players[trayPlayer].cardPiles.resources.length;

	return (
		<Card
			sx={cardStyle}
			onClick={() => {
				if (trayPlayer === "player" && handleModalToggle) {
					handleModalToggle();
				}
			}}
		>
			<CardContent sx={{ display: "flex" }}>
				<Box sx={boxStyle}>
					<Image
						src={s3TokenImageURL("resource-icon")}
						alt="Resource Icon"
						style={imageStyle}
						layout="intrinsic"
						height={72}
						width={54}
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
