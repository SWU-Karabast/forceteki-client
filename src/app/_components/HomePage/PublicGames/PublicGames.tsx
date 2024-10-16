import React from "react";
import { Box, Card, CardContent, Typography, Divider } from "@mui/material";
import PublicGame from "../_subcomponents/PublicGame/PublicGame";

const PublicGames: React.FC = () => {
	return (
		<Card
			sx={{
				fontFamily: "var(--font-barlow), sans-serif",
				width: { xs: "90vw", sm: "70vw", md: "40vw", lg: "25vw" },
				p: "2em",
				borderRadius: "1.5vw",
				backgroundColor: "rgba(0, 0, 0, 0.9)",
				mb: 4,
			}}
		>
			<CardContent
				sx={{
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
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
					Premier
				</Typography>

				<Divider
					sx={{
						backgroundColor: "#fff",
						mt: ".5vh",
						mb: "1vh",
					}}
				/>
				<PublicGame />
				<PublicGame />
				<PublicGame />
				<Typography
					sx={{
						mt: 1,
						fontFamily: "var(--font-barlow), sans-serif",
						fontWeight: "800",
						color: "#fff",
						fontSize: "1.5rem",
					}}
				>
					Request-Undo Premier
				</Typography>

				<Divider
					sx={{
						backgroundColor: "#fff",
						mt: ".5vh",
						mb: "1vh",
					}}
				/>

				<PublicGame />
				<Box
					sx={{
						mt: 1,
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
						124
					</Typography>
				</Box>
				<Divider
					sx={{
						backgroundColor: "#fff",
						mt: ".5vh",
						mb: "1vh",
					}}
				/>
			</CardContent>
		</Card>
	);
};

export default PublicGames;
