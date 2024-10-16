import React from "react";
import { Box, Divider, Typography } from "@mui/material";
import PublicMatch from "../PublicMatch/PublicMatch";
import { playerMatches } from "@/app/_constants/mockData";

const GamesInProgress: React.FC = () => {
	const randomGamesInProgress = Math.floor(Math.random() * 1000);

	return (
		<>
			<Box
				sx={{
					mt: 1,
					position: "sticky",
					top: 0,
					zIndex: 1,
					display: "flex",
					justifyContent: "space-between",
					alignItems: "flex-end",
					alignContent: "center",
				}}
			>
				<Typography
					sx={{
						fontFamily: "var(--font-barlow), sans-serif",
						fontWeight: "800",
						color: "#fff",
						fontSize: "1.5rem",
					}}
				>
					Games in Progress
				</Typography>
				<Typography
					sx={{
						fontFamily: "var(--font-barlow), sans-serif",
						fontWeight: "400",
						color: "#fff",
						fontSize: "1.5rem",
					}}
				>
					{randomGamesInProgress}
				</Typography>
			</Box>
			<Divider
				sx={{
					backgroundColor: "#fff",
					mt: ".5vh",
					mb: "1vh",
				}}
			/>
			<Box
				sx={{
					mb: 1,
					pr: 1,
					maxHeight: "35vh",
					overflowY: "auto",
					"::-webkit-scrollbar": {
						width: "0.2vw",
					},
					"::-webkit-scrollbar-thumb": {
						backgroundColor: "#D3D3D3B3",
						borderRadius: "1vw",
					},
					"::-webkit-scrollbar-button": {
						display: "none",
					},
					transition: "scrollbar-color 0.3s ease-in-out",
				}}
			>
				{playerMatches.map((match, index) => (
					<PublicMatch key={index} match={match} />
				))}
			</Box>
		</>
	);
};

export default GamesInProgress;
