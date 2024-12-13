import {
	Card,
	Typography,
	CardActions,
	Button,
	Box, Divider,
} from "@mui/material";
import Chat from "@/app/_components/_sharedcomponents/Chat/Chat";
import GameLinkCard from "../_subcomponents/GameLinkCard/GameLinkCard";
import { useGame } from "@/app/_contexts/Game.context";
import { ISetUpProps } from "../LobbyTypes";
import { useRouter, useSearchParams } from "next/navigation"
import React from "react";


const SetUp: React.FC<ISetUpProps> = ({
	chatHistory,
	chatMessage,
	setChatMessage,
	handleChatSubmit,
}) => {

	const { sendMessage } = useGame();
	const router = useRouter();
	const searchParams = useSearchParams();

	// Extract the player from the URL query params
	const player = searchParams.get("player");

	const handleStartGame = () => {
		sendMessage("startGame");
		if (player){
			router.push("/GameBoard?player=" + player);
		}else {
			router.push("/GameBoard");
		}
	}

	//------------------------STYLES------------------------//

	const mainCardStyle = {
		borderRadius: "1.1em",
		height: "100%",
		maxHeight: "72.5vh",
		width: "100%",
		display: "flex",
		flexDirection: "column",
		mt: "2.0em",
		p: "1.8em",
		backgroundColor: "#000000E6",
		backdropFilter: "blur(20px)",
		overflow: "hidden",
		'@media (max-height: 1000px)': {
			maxHeight: '67vh',
		},
	};

	const initiativeCardStyle = {
		height: "15vh",
		background: "#18325199",
		display: "flex",
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
	const lobbyTextStyle ={
		fontSize: "3.0em",
		fontWeight: "600",
		color: "white",
		alignSelf: "flex-start",
		mb: "0.3em",
	};
	const exitCard = {
		display: "flex",
		pr: "1.2em",
		pl: "1.2em",
		width: "100%",
		height: "6%",
		alignItems: "center",
		justifyContent: "space-between",
		cursor: "pointer",
	};
	const dividerStyle = {
		backgroundColor: "#fff",
		mt: ".5vh",
		mb: "0.5vh",
	};
	const boxContainer = {
		width: "100%",
		//maxHeight: "64vh", // this is for the small screen
		height: "100%",
	};
	const handleExit = () => {
		router.push("/");
	}
	return (
		<Box sx={boxContainer}>
			<Typography sx={lobbyTextStyle}>KARABAST</Typography>
			<Card sx={initiativeCardStyle}>
				<CardActions sx={buttonsContainerStyle}>
					<Button variant="contained" onClick={()=>handleStartGame()}>Start Game</Button>
				</CardActions>
			</Card>
			<Card sx={mainCardStyle}>
				<Typography sx={setUpTextStyle}>Set Up</Typography>
				<Chat
					chatHistory={chatHistory}
					chatMessage={chatMessage}
					setChatMessage={setChatMessage}
					handleChatSubmit={handleChatSubmit}
				/>
				<Divider sx={dividerStyle} />
				<Box sx={exitCard} onClick={() => handleExit()}>
					<Typography variant="h5">
						Exit Game Lobby
					</Typography>
					<Typography variant="h5">
						{'<'}
					</Typography>
				</Box>
			</Card>
		</Box>
	);
};

export default SetUp;
