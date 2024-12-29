import React from "react";
import {
	Card,
	CardContent,
	Typography,
	TextField,
	Button,
	Box, CardActions,
} from "@mui/material";
import { useGame } from "@/app/_contexts/Game.context";
import { useRouter, useSearchParams } from "next/navigation"
import {ILobbyUserProps, ISetUpProps} from "@/app/_components/Lobby/LobbyTypes";

const SetUpCard: React.FC<ISetUpProps> = ({
  readyStatus,
  owner,
}) => {

	const { sendMessage, lobbyState, connectedPlayer, sendLobbyMessage, gameState } = useGame();
	const opponentUser = lobbyState ? lobbyState.users.find((u: ILobbyUserProps) => u.id !== connectedPlayer) : null;
	// Extract the player from the URL query params
	const router = useRouter();

	//------------------------Additional functions------------------------//
	const handleStartGame = async () => {
		sendMessage("startGame");
		router.push("/GameBoard");
	};

	//------------------------STYLES------------------------//
	const setUpCard = {
		paddingLeft: "20px",
		paddingRight: "20px",
	}
	const readyImg = {
		width: "15px",
		height: "15px",
		backgroundImage: `url(${readyStatus ? '/ready.png' : '/notReady.png'})`,
		backgroundSize: "contain",
		backgroundRepeat: "no-repeat",
		marginTop:"7px",
		marginRight:"5px"
	}

	const cardStyle = {
		height: "fit-content",
		background: "#18325199",
		pb: "4vh",
		backgroundColor: "#000000E6",
		backdropFilter: "blur(20px)",
	};

	const textFieldStyle = {
		backgroundColor: "#fff2",
		"& .MuiInputBase-input": {
			color: "#fff",
		},
		"& .MuiInputBase-input::placeholder": {
			color: "#fff",
		},
	};

	const boxStyle = {
		display: "flex",
		justifyContent: "flex-end",
		mt: "1em",
	};

	const buttonStyle = {
		backgroundColor: "#292929",
		minWidth: "9rem",
	};

	const initiativeCardStyle = {
		height: "15vh",
		minHeight: "8.5rem",
		background: "#18325199",
		display: "flex",
		paddingLeft: "30px",
		paddingRight: "30px",
		flexDirection: "column",
		justifyContent: "center",
	};

	const buttonsContainerStyle = {
		display: "flex",
		justifyContent: "center",
		width: "100%",
	};

	const setUpTextStyle = {
		fontSize: "1.5em",
		fontWeight: "800",
		color: "white",
		alignSelf: "flex-start",
	};

	return (
		<Card sx={initiativeCardStyle}>
			<Typography variant="h3" sx={setUpTextStyle}>
				Set Up
			</Typography>
			{!opponentUser ? (
				// If opponent is null, show "Waiting for an opponent" UI
				<CardContent sx={setUpCard}>
					<Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
						<Typography variant="h6" sx={{ marginTop: "6px" }}>
							Waiting for an opponent to join
						</Typography>
					</Box>
					<Box sx={boxStyle}>
						<TextField fullWidth sx={textFieldStyle} placeholder="https://properlink.com" />
						<Button variant="contained" sx={buttonStyle}>Copy Invite Link</Button>
					</Box>
				</CardContent>
			) : (
				// If opponent is not null
				<>
					{readyStatus && opponentUser.ready && owner ? (
						/* Both are ready */
						<>
							<Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
								<Box sx={readyImg} />
								<Typography variant="h6" sx={{ marginTop: "6px" }}>
									Both players are ready.
								</Typography>
							</Box>
							<CardActions sx={buttonsContainerStyle}>
								<Button variant="contained" onClick={() => handleStartGame()}>
									Start Game
								</Button>
								<Button
									variant="contained"
									onClick={() => sendLobbyMessage(["setReadyStatus", !readyStatus])}
								>
									{readyStatus ? "Unready" : "Ready"}
								</Button>
							</CardActions>
						</>
					) : (
						/* Not both ready — show toggle-ready button */
						<CardActions sx={buttonsContainerStyle}>
							<Box sx={readyImg} />
							<Button
								variant="contained"
								onClick={() => sendLobbyMessage(["setReadyStatus", !readyStatus])}
							>
								{readyStatus ? "Unready" : "Ready"}
							</Button>
						</CardActions>
					)}
				</>
			)}
		</Card>
	);
};

export default SetUpCard;
