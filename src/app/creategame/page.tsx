"use client";

import React, { useState, FormEvent } from "react";
import {
	Box,
	Button,
	Card,
	CardContent,
	Checkbox,
	FormControl,
	FormControlLabel,
	Typography,
	MenuItem,
} from "@mui/material";
import KarabastBanner from "../_components/Banner/Banner";
import StyledTextField from "../_components/Auth/_subcomponents/StyledTextField/StyledTextField";

// Define the deck options
const deckOptions: string[] = [
	"Vader Green Ramp",
	"Obi-Wan Blue Control",
	"Darth Red Aggro",
	"Leia White Midrange",
];

const CreateGame: React.FC = () => {
	// State Hooks
	const [favouriteDeck, setFavouriteDeck] =
		useState<string>("Vader Green Ramp");
	const [deckLink, setDeckLink] = useState<string>("");
	const [saveDeck, setSaveDeck] = useState<boolean>(false);

	// Handle Create Game Submission
	const handleCreateGameSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		console.log("Favourite Deck:", favouriteDeck);
		console.log("SWUDB Deck Link:", deckLink);
		console.log("Save Deck To Favourites:", saveDeck);

		// TODO: Implement actual game creation logic here
	};

	return (
		<Box
			sx={{
				position: "relative",
				height: "100vh",
				overflow: "hidden",
				display: "flex",
				flexDirection: "column",
			}}
		>
			{/* Banner positioned absolutely */}
			<KarabastBanner />

			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					paddingTop: "10vh",
				}}
			>
				{/* Primary Card - Create Game Form */}
				<Card
					sx={{
						fontFamily: "var(--font-barlow), sans-serif",
						width: { xs: "90vw", sm: "70vw", md: "40vw", lg: "25vw" },
						padding: "2.5em",
						borderRadius: "1.5vw",
						backgroundColor: "rgba(0, 0, 0, 0.9)",
						mb: 4,
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
							Create Game
						</Typography>
						<form onSubmit={handleCreateGameSubmit}>
							{/* Favourite Decks Input */}
							<FormControl fullWidth sx={{ mb: 3 }}>
								<Typography
									sx={{
										fontFamily: "var(--font-barlow), sans-serif",
										color: "#fff",
										fontSize: "1.1rem",
										mb: 1,
									}}
								>
									Favourite Decks
								</Typography>
								<StyledTextField
									select
									value={favouriteDeck}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										setFavouriteDeck(e.target.value)
									}
									placeholder="Vader Green Ramp"
									required
								>
									{deckOptions.map((deck) => (
										<MenuItem key={deck} value={deck}>
											{deck}
										</MenuItem>
									))}
								</StyledTextField>
							</FormControl>

							{/* SWUDB Deck Link Input */}
							<FormControl fullWidth sx={{ mb: 3 }}>
								<Typography
									sx={{
										fontFamily: "var(--font-barlow), sans-serif",
										color: "#fff",
										fontSize: "1.1rem",
										mb: 1,
									}}
								>
									SWUDB Deck Link{" "}
									<Typography component="span" sx={{ fontSize: "0.8rem" }}>
										(use the url or &apos;Deck Link&apos; button)
									</Typography>
								</Typography>
								<StyledTextField
									type="url"
									value={deckLink}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										setDeckLink(e.target.value)
									}
									required
								/>
							</FormControl>

							{/* Save Deck To Favourites Checkbox */}
							<FormControlLabel
								control={
									<Checkbox
										sx={{
											color: "#fff",
											"&.Mui-checked": {
												color: "#fff",
											},
										}}
										checked={saveDeck}
										onChange={(e) => setSaveDeck(e.target.checked)}
									/>
								}
								label={
									<Typography sx={{ color: "#fff", fontSize: "1rem" }}>
										Save Deck To Favourites
									</Typography>
								}
								sx={{ mb: 3 }}
							/>

							{/* Submit Button */}
							<Button
								type="submit"
								variant="contained"
								sx={{
									fontFamily: "var(--font-barlow), sans-serif",
									mb: 2,
									width: "10vw",
									height: "3.5em",
									fontSize: "1.1rem",
									borderRadius: "0.5vw",
									backgroundColor: "#292929",
									display: "block",
									marginLeft: "auto",
									marginRight: "auto",
								}}
							>
								Create
							</Button>
						</form>
					</CardContent>
				</Card>

				{/* Secondary Card - Instructions */}
				<Card
					sx={{
						width: { xs: "90vw", sm: "70vw", md: "40vw", lg: "25vw" },
						padding: "2em",
						borderRadius: "1.5vw",
						backgroundColor: "#18325199",
						boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
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
							Choose a deck, then click &apos;Join Game&apos; to be taken to the
							game lobby.
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
			</Box>
		</Box>
	);
};

export default CreateGame;
