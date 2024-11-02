import React from "react";
import Grid from "@mui/material/Grid2";
import LeaderBaseCard from "../../Cards/LeaderBaseCard/LeaderBaseCard";
import { LeaderBaseProps } from "../LeaderBaseBoardTypes";

const LeaderBase: React.FC<LeaderBaseProps> = ({
	participant,
	isLobbyView = false,
	title,
}) => {
	// Adjusted styles
	const containerStyle = {
		justifyContent:
			participant === "opponent" && isLobbyView
				? "flex-end"
				: participant === "player" && isLobbyView
				? "flex-start"
				: participant === "player"
				? "flex-end"
				: "flex-start",
		alignItems: "center",
		gap: ".5em",
		height: "94%",
		pt: isLobbyView ? 0 : "3.5em",
		pb:
			participant === "player" && isLobbyView
				? 0
				: participant === "player"
				? "4vh"
				: 0,
	};

	return (
		<Grid container direction="column" sx={containerStyle}>
			{isLobbyView ? (
				<>
					<LeaderBaseCard
						variant="leader"
						isLobbyView={isLobbyView}
						title={title}
					/>
					<LeaderBaseCard variant="base" isLobbyView={isLobbyView} />
				</>
			) : participant === "player" ? (
				<>
					<LeaderBaseCard variant="base" isLobbyView={isLobbyView} />
					<LeaderBaseCard
						variant="leader"
						isLobbyView={isLobbyView}
						title={title}
					/>
				</>
			) : (
				<>
					<LeaderBaseCard
						variant="leader"
						isLobbyView={isLobbyView}
						title={title}
					/>
					<LeaderBaseCard variant="base" isLobbyView={isLobbyView} />
				</>
			)}
		</Grid>
	);
};

export default LeaderBase;
