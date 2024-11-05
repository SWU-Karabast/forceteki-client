import { Grid2 as Grid, Button, Typography } from "@mui/material";
import { CardActionTrayProps } from "@/app/_components/Gameboard/GameboardTypes";

const CardActionTray: React.FC<CardActionTrayProps> = ({
	trayPlayer = "player",
	handleBasicPromptToggle,
}) => {
	//------------------------STYLES------------------------//

	const actionContainerStyle = {
		mt: "1vh",
	};

	const actionButtonStyle = {
		backgroundColor: "green"
	};

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
					Choose an Action:
				</Typography>
				<Button variant="contained">Pass [Space]</Button>
				<Button variant="contained">Claim Initiative</Button>
				<Button
					variant="contained"
					sx={actionButtonStyle}
					onClick={handleBasicPromptToggle}
				>
					Open Prompt
				</Button>
			</Grid>
		</>
	);
};

export default CardActionTray;
