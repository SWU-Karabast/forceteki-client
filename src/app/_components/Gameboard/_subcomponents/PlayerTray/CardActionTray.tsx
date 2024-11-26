import { Grid2 as Grid, Button, Typography, Box } from "@mui/material";

import { useGame } from "@/app/_contexts/Game.context";

const CardActionTray: React.FC = () => {
	//------------------------STYLES------------------------//

	const actionContainerStyle = {
		mt: "1vh",
	};

	const { sendGameMessage, gameState, connectedPlayer } = useGame();
	const playerState = gameState.players[connectedPlayer];

	return (
		<>
			<Grid
				container
				justifyContent="center"
				alignItems="center"
				spacing={2}
				sx={actionContainerStyle}
			>
				<Typography variant="h6" sx={{ color: "white" }}>
					{playerState.menuTitle}
				</Typography>
				<Box>
					{playerState.buttons.map((button: ButtonsProps) => (
						<PromptButton
							key={button.arg}
							button={button}
							sendGameMessage={sendGameMessage}
						/>
					))}
				</Box>
			</Grid>
		</>
	);
};

interface PromptButtonProps {
	button: ButtonsProps
	sendGameMessage: (args: [string, string, string]) => void;
}

interface ButtonsProps {
	command: string;
	arg: string;
	text: string;
	uuid: string;
}

const PromptButton: React.FC<PromptButtonProps> = ({ button, sendGameMessage }) => {
	return (
		<Button
			variant="contained"
			onClick={() => sendGameMessage([button.command, button.arg, button.uuid])}
		>
			{button.text}
		</Button>
	);
};

export default CardActionTray;
