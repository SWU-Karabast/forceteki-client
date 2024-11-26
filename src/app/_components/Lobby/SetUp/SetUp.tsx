import {
	Card,
	Typography,
	CardActions,
	Button
} from "@mui/material";
import Chat from "@/app/_components/_sharedcomponents/Chat/Chat";
import GameLinkCard from "../_subcomponents/GameLinkCard/GameLinkCard";
import { useGame } from "@/app/_contexts/Game.context";
import { SetUpProps } from "../LobbyTypes";
import { useRouter } from "next/navigation"

const SetUp: React.FC<SetUpProps> = ({
	chatHistory,
	chatMessage,
	setChatMessage,
	handleChatSubmit,
}) => {

	const { sendMessage } = useGame();
	const router = useRouter();


	const handleStartGame = () => {
		sendMessage("startGame");
		router.push("/GameBoard");
	}

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
		mt: "1.3em",
	};

	return (
		<Card sx={mainCardStyle}>
			<Card sx={initiativeCardStyle}>
				<CardActions sx={buttonsContainerStyle}>
					<Button variant="contained" onClick={()=>handleStartGame()}>Start Game</Button>
				</CardActions>
			</Card>
			<Typography sx={setUpTextStyle}>Set Up</Typography>
			<GameLinkCard />

			<Chat
				chatHistory={chatHistory}
				chatMessage={chatMessage}
				setChatMessage={setChatMessage}
				handleChatSubmit={handleChatSubmit}
			/>
		</Card>
	);
};

export default SetUp;
