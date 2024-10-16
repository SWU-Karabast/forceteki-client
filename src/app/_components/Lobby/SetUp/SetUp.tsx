import React, { useEffect, useRef } from "react";
import {
	Card,
	Box,
	Typography,
	CardContent,
	CardActions,
	Button,
} from "@mui/material";
import Chat from "@/app/_components/_sharedcomponents/Chat/Chat";
import GameLinkCard from "../_subcomponents/GameLinkCard/GameLinkCard";

const SetUp: React.FC<SetUpProps> = ({
	participant,
	chatHistory,
	chatMessage,
	playerRoll,
	opponentRoll,
	isRolling,
	isRollSame,
	setChatMessage,
	handleChatSubmit,
	handleRollInitiative,
}) => {
	const getInitiativeMessage = () => {
		if (isRolling) {
			return "Rolling initiative...";
		}
		if (isRollSame) {
			return "Initiative tied, rolling initiative again";
		}
		if (participant.initiative === true) {
			return "You won the initiative choice.";
		}
		if (participant.initiative === false) {
			return "Start the game when ready.";
		}
		return "";
	};

	const hasRolled = useRef(false);

	useEffect(() => {
		if (!hasRolled.current) {
			handleRollInitiative();
			hasRolled.current = true;
		}
	}, [handleRollInitiative]);

	return (
		<Card
			sx={{
				borderRadius: "1.11vw",
				height: "auto",
				width: "100%",
				display: "flex",
				flexDirection: "column",
				pt: "1vh",
				mt: "4vh",
				p: "1.5vw",
				backgroundColor: "#000000E6",
				backdropFilter: "blur(20px)",
				overflow: "hidden",
			}}
		>
			<Card
				sx={{
					height: "15vh",
					background: "#18325199",
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					alignItems: "center",
					textAlign: "center",
				}}
			>
				<CardContent>
					{hasRolled.current && getInitiativeMessage() && (
						<Typography
							sx={{
								fontSize: "1vw",
								fontWeight: "400",
								color: "white",
								textAlign: "center",
								width: "100%",
							}}
						>
							{getInitiativeMessage()}
						</Typography>
					)}
				</CardContent>
				<CardActions
					sx={{
						display: "flex",
						justifyContent: "center",
						width: "100%",
					}}
				>
					{!isRolling && !hasRolled.current && (
						<Button
							variant="contained"
							sx={{ backgroundColor: "#292929" }}
							onClick={handleRollInitiative}
						>
							Roll Initiative
						</Button>
					)}
					{!isRolling &&
						hasRolled.current &&
						participant.initiative === false && (
							<Button variant="contained" sx={{ backgroundColor: "#292929" }}>
								Start Game
							</Button>
						)}
					{!isRolling &&
						hasRolled.current &&
						participant.initiative === true && (
							<Box display="flex" gap={2}>
								<Button
									variant="contained"
									sx={{ backgroundColor: "#292929" }}
									onClick={() => {
										/* Add logic for going first */
									}}
								>
									Go First
								</Button>
								<Button
									variant="contained"
									sx={{ backgroundColor: "#292929" }}
									onClick={() => {
										/* Add logic for going second */
									}}
								>
									Go Second
								</Button>
							</Box>
						)}
				</CardActions>
			</Card>
			<Typography
				sx={{
					fontSize: "1.2vw",
					fontWeight: "bold",
					color: "white",
					alignSelf: "flex-start",
					mt: "3vh",
				}}
			>
				Set Up
			</Typography>
			<GameLinkCard />

			<Chat
				chatHistory={chatHistory}
				chatMessage={chatMessage}
				setChatMessage={setChatMessage}
				handleChatSubmit={handleChatSubmit}
				playerRoll={playerRoll}
				opponentRoll={opponentRoll}
			/>
		</Card>
	);
};

export default SetUp;
