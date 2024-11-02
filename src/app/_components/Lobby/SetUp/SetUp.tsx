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
import { SetUpProps } from "../LobbyTypes";

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

	//------------------------STYLES------------------------//

	const mainCardStyle = {
		borderRadius: "1.1em",
		height: "auto",
		width: "100%",
		display: "flex",
		flexDirection: "column",
		mt: "2.6em",
		p: "1.8em",
		backgroundColor: "#000000E6",
		backdropFilter: "blur(20px)",
		overflow: "hidden",
	};

	const initiativeCardStyle = {
		height: "15vh",
		background: "#18325199",
		display: "flex",
		flexDirection: "column",
		justifyContent: "center",
	};

	const initiativeMessageStyle = {
		fontSize: "1.5em",
		fontWeight: "400",
		color: "white",
		textAlign: "center",
		width: "100%",
	};

	const buttonsContainerStyle = {
		display: "flex",
		justifyContent: "center",
		width: "100%",
	};

	const buttonStyle = {
		backgroundColor: "#292929",
	};

	const setUpTextStyle = {
		fontSize: "1.5em",
		fontWeight: "800",
		color: "white",
		alignSelf: "flex-start",
		mt: "1.3em",
	};

	return (
		<Card sx={mainCardStyle}>
			<Card sx={initiativeCardStyle}>
				<CardContent>
					{hasRolled.current && getInitiativeMessage() && (
						<Typography sx={initiativeMessageStyle}>
							{getInitiativeMessage()}
						</Typography>
					)}
				</CardContent>
				<CardActions sx={buttonsContainerStyle}>
					{!isRolling && !hasRolled.current && (
						<Button
							variant="contained"
							sx={buttonStyle}
							onClick={handleRollInitiative}
						>
							Roll Initiative
						</Button>
					)}
					{!isRolling &&
						hasRolled.current &&
						participant.initiative === false && (
							<Button variant="contained" sx={buttonStyle}>
								Start Game
							</Button>
						)}
					{!isRolling &&
						hasRolled.current &&
						participant.initiative === true && (
							<Box display="flex" gap={2}>
								<Button
									variant="contained"
									sx={buttonStyle}
									onClick={() => {
										/* Add logic for going first */
									}}
								>
									Go First
								</Button>
								<Button
									variant="contained"
									sx={buttonStyle}
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
			<Typography sx={setUpTextStyle}>Set Up</Typography>
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
