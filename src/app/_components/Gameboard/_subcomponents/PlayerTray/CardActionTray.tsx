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
					{playerState.promptState.menuTitle}
				</Typography>
				<Box>
					{playerState.promptState.buttons.map((button: IButtonsProps) => (
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

interface IPromptButtonProps {
	button: IButtonsProps
	sendGameMessage: (args: [string, string, string]) => void;
}

interface IButtonsProps {
	command: string;
	arg: string;
	text: string;
	uuid: string;
}

const PromptButton: React.FC<IPromptButtonProps> = ({ button, sendGameMessage }) => {
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
