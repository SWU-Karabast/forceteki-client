// ResourcesOverlay.tsx

import React from "react";
import {
	Modal,
	Card,
	CardContent,
	Typography,
	Box,
	IconButton,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import CardArea from "../../../../_sharedcomponents/CardArea/CardArea";
import { IResourcesOverlayProps } from "@/app/_components/Gameboard/GameboardTypes";
import { useGame } from "@/app/_contexts/Game.context";

const ResourcesOverlay: React.FC<IResourcesOverlayProps> = ({
	isModalOpen,
	handleModalToggle,
}) => {

	const { gameState, connectedPlayer } = useGame();

	return (
		<Modal
			open={isModalOpen}
			onClose={handleModalToggle}
			sx={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				backgroundColor: "#00000080",
			}}
		>
			<Card
				sx={{
					position: "relative",
					width: "80%",
					height: "60%",
					p: 2,
					backgroundColor: "#000000B3",
					textAlign: "center",
				}}
			>
				<CardContent>
					<Typography variant="h6" color="#fff">
						Your Resources
					</Typography>
					<Typography variant="caption" color="#fff">
						Your Resources
					</Typography>

					<CardArea cards={gameState.players[connectedPlayer].cardPiles["resources"]} />
				</CardContent>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						position: "absolute",
						top: 0,
						right: 0,
					}}
				>
					<IconButton onClick={handleModalToggle}>
						<Close sx={{ color: "#fff" }} />
					</IconButton>
				</Box>
			</Card>
		</Modal>
	);
};

export default ResourcesOverlay;
