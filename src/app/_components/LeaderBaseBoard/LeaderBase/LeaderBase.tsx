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
				flexGrow: 1,
				justifyContent: participant === "player" ? "flex-end" : "flex-start",
				alignItems: "center",
				gap: isLobbyView ? "1vh" : "0.5vh",
				height: "100%",
				paddingTop: isLobbyView ? "0vh" : "4vh", // No padding in lobby, 4vh outside
				paddingBottom:
					participant === "player" && isLobbyView
						? "0vh" // no padding in lobby
						: participant === "player"
						? "4vh" //padding for player side
						: "0vh", //no padding for opponent side
			}}
		>
			{isLobbyView ? (
				<>
					<LeaderCard isLobbyView={isLobbyView} title={title} />
					<BaseCard isLobbyView={isLobbyView} />
				</>
			) : participant === "player" ? (
				<>
					<BaseCard isLobbyView={isLobbyView} />
					<LeaderCard isLobbyView={isLobbyView} title={title} />
				</>
			) : (
				<>
					<LeaderCard isLobbyView={isLobbyView} title={title} />
					<BaseCard isLobbyView={isLobbyView} />
				</>
			)}
		</Grid>
	);
};

export default LeaderBase;
