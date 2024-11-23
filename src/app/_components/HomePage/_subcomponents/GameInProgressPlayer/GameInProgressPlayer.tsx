import { Box } from "@mui/material";
import Hexagon from "../Hexagon/Hexagon";
import { GameInProgressPlayerProps } from "../../HomePageTypes";

const GameInProgressPlayer: React.FC<GameInProgressPlayerProps> = ({
	playerImage,
	hexagonColors,
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

	const hexagonsContainerStyle = {
		display: "flex",
		flexDirection: "column",
		justifyContent: "center",
		alignItems: "center",
		ml: ".3vw",
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
