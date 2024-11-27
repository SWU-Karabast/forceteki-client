import { Box } from "@mui/material";
import { GameInProgressPlayerProps } from "../../HomePageTypes";

const GameInProgressPlayer: React.FC<GameInProgressPlayerProps> = ({
	playerImage,
}) => {
	//------------------------STYLES------------------------//

	const imageContainerStyle = {
		borderRadius: "5px",
		height: "3.5rem",
		width: "5rem",
		backgroundImage: `url(/${playerImage})`,
		backgroundSize: "cover",
		display: "flex",
	};

	const boxStyle = {
		display: "flex",
	};

	return (
		<Box sx={boxStyle}>
			<Box sx={imageContainerStyle} />
		</Box>
	);
};

export default GameInProgressPlayer;
