import React from "react";
import { Card, CardContent, Typography } from "@mui/material";

const NewsColumn: React.FC = () => {
	return (
		<>
			{/* Primary Card - Create/Choose Deck Form */}
			<Card
				sx={{
					fontFamily: "var(--font-barlow), sans-serif",
					width: { xs: "90vw", sm: "70vw", md: "40vw", lg: "25vw" },
					padding: "2em",
					mt: 12,
					borderRadius: "1.5vw",
					backgroundColor: "rgba(0, 0, 0, 0.9)",
					mb: 4, // Margin bottom adjusted based on path
				}}
			>
				<CardContent>
					<Typography
						variant="h4"
						sx={{
							fontFamily: "var(--font-barlow), sans-serif",
							color: "#fff",
							mb: 3,
							fontWeight: "800",
						}}
					>
						Choose Your Deck
					</Typography>
				</CardContent>
			</Card>

			{/* Secondary Card - Instructions (Only for /creategame path) */}
			<Card
				sx={{
					width: { xs: "90vw", sm: "70vw", md: "40vw", lg: "25vw" },
					padding: "2em",
					borderRadius: "1.5vw",
					backgroundColor: "#18325199",
					boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
					mb: 4, // Add margin bottom for spacing
				}}
			>
				<CardContent>
					<Typography
						variant="h5"
						sx={{
							color: "#fff",
							mb: 2,
							fontWeight: "600",
							fontFamily: "var(--font-barlow), sans-serif",
						}}
					>
						Instructions
					</Typography>
					<Typography
						variant="body1"
						sx={{
							color: "#fff",
							textAlign: "left",
							mb: 2,
							fontSize: "1rem",
							fontFamily: "var(--font-barlow), sans-serif",
							fontWeight: "400",
						}}
					>
						Choose a deck, then click &apos;Create&apos; to be taken to the game
						lobby.
						<br />
						<br />
						Once in the lobby, the player who wins the dice roll chooses who
						goes first. Then the host can start the game.
						<br />
						<br />
						Have Fun!
					</Typography>
				</CardContent>
			</Card>
		</>
	);
};

export default NewsColumn;
