// LeaderBase.tsx
import React from "react";
import Grid from "@mui/material/Grid2";
import LeaderCard from "../../Cards/LeaderCard/LeaderCard";
import BaseCard from "../../Cards/BaseCard/BaseCard";

const LeaderBase: React.FC<LeaderBaseProps> = ({
	participant,
	isLobbyView,
	title,
}) => {
	return (
		<Grid
			container
			direction="column"
			sx={{
				justifyContent:
					participant === "opponent" && isLobbyView
						? "flex-end" //flex-start for player side in lobby because in lobby it is on top rather than bottom
						: participant === "player" && isLobbyView
						? "flex-start" //flex-end for opponent side in lobby because in lobby it is on bottom rather than top
						: participant === "player"
						? "flex-end"
						: "flex-start",
				alignItems: "center",
				gap: isLobbyView ? "1vh" : "0.5vh",
				height: "94%",
				paddingTop: isLobbyView ? "0vh" : "4vh", // No padding in lobby, 4vh outside
				paddingBottom:
					participant === "player" && isLobbyView
						? "0vh" // no padding in lobby
						: participant === "player"
						? "4vh" //padding for player side
						: "0vh", //no padding for opponent side
			}}
		>
			{isLobbyView ? ( //leader card on top in lobby view for both player and opponent
				<>
					<LeaderCard isLobbyView={isLobbyView} title={title} />
					<BaseCard isLobbyView={isLobbyView} />
				</>
			) : participant === "player" ? ( // player side leader card on bottom in gameboard
				<>
					<BaseCard isLobbyView={isLobbyView} />
					<LeaderCard isLobbyView={isLobbyView} title={title} />
				</>
			) : (
				//opponent side leader card on bottom in gameboard
				<>
					<LeaderCard isLobbyView={isLobbyView} title={title} />
					<BaseCard isLobbyView={isLobbyView} />
				</>
			)}
		</Grid>
	);
};

export default LeaderBase;
