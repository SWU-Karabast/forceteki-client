import { Box, Paper } from "@mui/material";
import Hexagon from "../Hexagon/Hexagon";

const GameInProgressPlayer: React.FC<GameInProgressPlayerProps> = ({
	playerImage,
	hexagonColors,
}) => {
	//------------------------STYLES------------------------//

	const imageContainerStyle = {
		border: "1px solid #454545",
		borderRadius: "5px",
		height: "6vh",
		width: "5vw",
		ml: ".3vw",
		p: "1vh",
		backgroundImage: `url(/${playerImage})`,
		backgroundPositionX: "55%",
		backgroundPositionY: "10%",
		backgroundSize: "200%",
		display: "flex",
		alignItems: "center",
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
			<Box sx={hexagonsContainerStyle}>
				<Hexagon backgroundColor={hexagonColors[0]} />
				<Hexagon backgroundColor={hexagonColors[1]} />
				<Hexagon backgroundColor={hexagonColors[2]} />
			</Box>
		</Box>
	);
};

export default GameInProgressPlayer;
