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

	return (
		<>
			<Box sx={{ mt: 2, backgroundColor: "#28282800" }}>
				<Typography sx={{ fontWeight: "bold", color: "#fff" }}>Chat</Typography>
				<Divider
					sx={{
						backgroundColor: "#fff",
						mt: ".5vh",
						mb: "1vh",
					}}
				/>
				<Box
					sx={{
						p: "10px",
						borderRadius: "4px",
						minHeight: "100px",
						overflowY: "auto",
						backgroundColor: "#28282800",
					}}
				>
					{chatHistory.length > 0 ? (
						chatHistory.map((message, index) => (
							<Typography key={index} sx={{ color: "#fff" }}>
								{message}
							</Typography>
						))
					) : (
						<Box>
							{playerRoll !== null && opponentRoll !== null ? (
								<>
									<Typography sx={{ color: "#fff" }}>
										Player rolled {playerRoll} and Opponent rolled{" "}
										{opponentRoll}.
									</Typography>
									<Typography sx={{ color: "#fff" }}>
										{determineFirstPlayer() === "It's a tie. Roll again."
											? "It's a tie. Roll again."
											: `${determineFirstPlayer()} chooses who goes first.`}
									</Typography>
								</>
							) : (
								<>
									<Typography sx={{ color: "#fff" }}>
										Player 1 has connected.
									</Typography>
									<Typography sx={{ color: "#fff" }}>
										Player 2 has connected.
									</Typography>
								</>
							)}
						</Box>
					)}
				</Box>
			</Box>

			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					backgroundColor: "#28282800",
					p: "10px",
					mt: 2,
				}}
			>
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
					sx={{
						backgroundColor: "#28282800",
						color: "#fff",
						borderRadius: "4px",
						flexGrow: 1,
						input: { color: "#fff" },
						"& .MuiOutlinedInput-root": {
							"& fieldset": {
								borderColor: "#fff",
							},
						},
					}}
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
