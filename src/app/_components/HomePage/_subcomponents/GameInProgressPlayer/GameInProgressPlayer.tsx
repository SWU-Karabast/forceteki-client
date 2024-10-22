import { Box, Paper } from "@mui/material";

const GameInProgressPlayer: React.FC<GameInProgressPlayerProps> = ({
	playerImage,
}) => {
	return (
		<Box sx={{ display: "flex" }}>
			<Paper
				elevation={16}
				sx={{
					border: "1px solid #454545",
					borderRadius: "3px",
					height: "58px",
					width: "80px",
					ml: ".3vw",
					p: "1vh",
					backgroundImage: `url(/leaders/${playerImage})`,
					backgroundSize: "cover",
					display: "flex",
					alignItems: "center",
				}}
			/>
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					alignItems: "center",
					ml: ".3vw",
				}}
			>
			</Box>
		</Box>
	);
};

export default GameInProgressPlayer;
