// ResourcesOverlay.tsx

import React from "react";
import {
	Modal,
	Card,
	CardContent,
	Typography,
	Box,
	IconButton,
	Button,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { useGame } from "@/app/_contexts/Game.context";
import { BasicPromptProps } from "@/app/_components/Gameboard/GameboardTypes";

const BasicPrompt: React.FC<BasicPromptProps> = ({
	isBasicPromptOpen,
	handleBasicPromptToggle,
}) => {
	const { connectedPlayer, gameState, sendMessage } = useGame();
	if (!gameState) {
		return null;
	}

	const playerState = gameState.players[connectedPlayer];

	return (
		<Modal
			open={isBasicPromptOpen}
			onClose={handleBasicPromptToggle}
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
						{playerState.menuTitle || "No Prompt"}
					</Typography>
					<Typography variant="caption" color="#fff">
						{playerState.promptTitle || ""}
					</Typography>
					<Box>
						{playerState.buttons.map((button: ButtonsProps) => (
							<PromptButton
								key={button.arg}
								button={button}
								sendMessage={sendMessage}
							/>
						))}
					</Box>
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
					<IconButton onClick={handleBasicPromptToggle}>
						<Close sx={{ color: "#fff" }} />
					</IconButton>
				</Box>
			</Card>
		</Modal>
	);
};

interface PromptButtonProps {
	button: ButtonsProps
	sendMessage: (args: [string, string, string]) => void;
}

interface ButtonsProps {
	command: string;
	arg: string;
	text: string;
	uuid: string;
}

const PromptButton: React.FC<PromptButtonProps> = ({ button, sendMessage }) => {
	return (
		<Button
			variant="contained"
			onClick={() => sendMessage([button.command, button.arg, button.uuid])}
		>
			{button.text}
		</Button>
	);
};

export default BasicPrompt;
