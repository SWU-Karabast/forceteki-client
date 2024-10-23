import React from "react";
import {
	Box,
	TextField,
	IconButton,
	InputAdornment,
	Divider,
	Typography,
} from "@mui/material";
import { Send } from "@mui/icons-material";

const Chat: React.FC<ChatProps> = ({
	chatHistory,
	chatMessage,
	playerRoll = null,
	opponentRoll = null,
	setChatMessage,
	handleChatSubmit,
}) => {
	// Determine who goes first based on the higher roll
	const determineFirstPlayer = () => {
		if (playerRoll !== null && opponentRoll !== null) {
			if (playerRoll > opponentRoll) {
				return "Player";
			} else if (opponentRoll > playerRoll) {
				return "Opponent";
			} else {
				return "It's a tie. Roll again.";
			}
		}
		return null;
	};

	//------------------------STYLES------------------------//

	const chatContainerStyle = {
		mt: 2,
		backgroundColor: "#28282800",
	};

	const titleStyle = {
		fontWeight: "bold",
		color: "#fff",
	};

	const dividerStyle = {
		backgroundColor: "#fff",
		mt: ".5vh",
		mb: "1vh",
	};

	const chatBoxStyle = {
		p: "10px",
		borderRadius: "4px",
		minHeight: "100px",
		overflowY: "auto",
		backgroundColor: "#28282800",
	};

	const messageTextStyle = {
		color: "#fff",
	};

	const inputContainerStyle = {
		display: "flex",
		alignItems: "center",
		backgroundColor: "#28282800",
		p: "10px",
		mt: 2,
	};

	const textFieldStyle = {
		backgroundColor: "#28282800",
		color: "#fff",
		borderRadius: "4px",
		flexGrow: 1,
		input: { color: "#fff" },
		"& .MuiOutlinedInput-root": {
			// base border style
			"& fieldset": {
				borderColor: "#fff",
			},
		},
		"& .MuiOutlinedInput-root.Mui-focused": {
			//when container is focused
			"& fieldset": {
				borderColor: "#fff",
			},
		},
	};

	//------------------------RETURN------------------------//

	return (
		<>
			<Box sx={chatContainerStyle}>
				<Typography sx={titleStyle}>Chat</Typography>
				<Divider sx={dividerStyle} />
				<Box sx={chatBoxStyle}>
					{chatHistory.length > 0 ? (
						chatHistory.map((message, index) => (
							<Typography key={index} sx={messageTextStyle}>
								{message}
							</Typography>
						))
					) : (
						<Box>
							{playerRoll !== null && opponentRoll !== null ? (
								<>
									<Typography sx={messageTextStyle}>
										Player rolled {playerRoll} and Opponent rolled{" "}
										{opponentRoll}.
									</Typography>
									<Typography sx={messageTextStyle}>
										{determineFirstPlayer() === "It's a tie. Roll again."
											? "It's a tie. Roll again."
											: `${determineFirstPlayer()} chooses who goes first.`}
									</Typography>
								</>
							) : (
								<>
									<Typography sx={messageTextStyle}>
										Player 1 has connected.
									</Typography>
									<Typography sx={messageTextStyle}>
										Player 2 has connected.
									</Typography>
								</>
							)}
						</Box>
					)}
				</Box>
			</Box>

			<Box sx={inputContainerStyle}>
				<TextField
					variant="outlined"
					placeholder="Chat"
					value={chatMessage}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						setChatMessage(e.target.value)
					}
					onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
						if (e.key === "Enter") {
							handleChatSubmit();
						}
					}}
					sx={textFieldStyle}
					slotProps={{
						input: {
							endAdornment: (
								<InputAdornment position="end">
									<IconButton onClick={handleChatSubmit}>
										<Send sx={{ color: "#fff" }} />
									</IconButton>
								</InputAdornment>
							),
						},
					}}
				/>
			</Box>
		</>
	);
};

export default Chat;
