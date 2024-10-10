import React, { useEffect, useRef } from "react";
import {
	Card,
	Box,
	Typography,
	CardContent,
	CardActions,
	Button,
	FilledInput,
} from "@mui/material";
import Chat from "@/app/_components/Chat/Chat";

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
				paddingTop: "1vh",
				marginTop: "4vh",
				padding: "1.5vw",
				backgroundColor: "rgba(0, 0, 0, 0.9)",
				overflow: "hidden",
			}}
		>
			<Card sx={{ height: "15vh", background: "#18325199" }}>
				<CardContent
					sx={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						textAlign: "center",
					}}
				>
					{/* Left-aligned "Set Up" */}
					<Typography
						sx={{
							fontSize: "1.67vw",
							fontWeight: "bold",
							color: "white",
							alignSelf: "flex-start",
							marginLeft: "1vw",
							marginTop: "1vh",
						}}
					>
						Set Up
					</Typography>

					{/* Centered initiative message */}
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
						<Button variant="contained" onClick={handleRollInitiative}>
							Roll Initiative
						</Button>
					)}
					{!isRolling &&
						hasRolled.current &&
						participant.initiative === false && (
							<Button variant="contained">Start Game</Button>
						)}
					{!isRolling &&
						hasRolled.current &&
						participant.initiative === true && (
							<Box display="flex" gap={2}>
								<Button
									variant="contained"
									sx={{ flex: 1 }}
									onClick={() => {
										/* Add logic for going first */
									}}
								>
									Go First
								</Button>
								<Button
									variant="contained"
									sx={{ flex: 1 }}
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

			<Card
				sx={{
					height: "15vh",
					background: "#18325199",
					marginTop: "3vh",
					padding: "1.5vw",
					paddingBottom: "2vh",
					backgroundColor: "rgba(0, 0, 0, 0.9)",
				}}
			>
				<CardContent>
					<Typography variant="h6" sx={{ color: "white" }}>
						Game Link
					</Typography>
					<FilledInput
						fullWidth
						sx={{ color: "#fff", backgroundColor: "#fff2" }}
						placeholder="https://properlink.com"
					/>
					<Button variant="contained" sx={{ marginTop: "1vh" }}>
						Copy Link
					</Button>
				</CardContent>
			</Card>

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
