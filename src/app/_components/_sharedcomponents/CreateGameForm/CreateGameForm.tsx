import React, { useState, FormEvent } from "react";
import {
	Box,
	Button,
	Card,
	CardContent,
	Checkbox,
	FormControl,
	FormControlLabel,
	MenuItem,
	Typography,
	Radio,
	RadioGroup,
} from "@mui/material";
import StyledTextField from "../_styledcomponents/StyledTextField/StyledTextField";
import { usePathname } from "next/navigation";

const deckOptions: string[] = [
	"Vader Green Ramp",
	"Obi-Wan Blue Control",
	"Darth Red Aggro",
	"Leia White Midrange",
];

const formatOptions: string[] = ["Premier", "Twin Suns", "Draft", "Sealed"];

const CreateGameForm: React.FC = () => {
	const pathname = usePathname();
	const isCreateGamePath = pathname === "/creategame";

	// Common State
	const [favouriteDeck, setFavouriteDeck] =
		useState<string>("Vader Green Ramp");
	const [deckLink, setDeckLink] = useState<string>("");
	const [saveDeck, setSaveDeck] = useState<boolean>(false);

	// Additional State for Non-Creategame Path
	const [gameName, setGameName] = useState<string>("");
	const [format, setFormat] = useState<string>("Premier");
	const [privacy, setPrivacy] = useState<string>("Public");

	// Handle Create Game Submission
	const handleCreateGameSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		console.log("Favourite Deck:", favouriteDeck);
		console.log("SWUDB Deck Link:", deckLink);
		console.log("Save Deck To Favourites:", saveDeck);

		if (!isCreateGamePath) {
			console.log("Game Name:", gameName);
			console.log("Format:", format);
			console.log("Privacy:", privacy);
		}

		// TODO: Implement actual game creation logic here
	};

	return (
		<Box sx={{ height: "100%" }}>
			{/* Primary Card - Create/Choose Deck Form */}
			<Card
				sx={{
					fontFamily: "var(--font-barlow), sans-serif",
					width: { xs: "90vw", sm: "70vw", md: "40vw", lg: "25vw" },
					padding: "2em",
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
						{isCreateGamePath ? "Choose Your Deck" : "Create New Game"}
					</Typography>
					<form onSubmit={handleCreateGameSubmit}>
						{/* Favourite Decks Input */}
						<FormControl fullWidth sx={{ mb: 1 }}>
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
						<FormControl fullWidth sx={{ mb: 1 }}>
							<Typography
								sx={{
									fontFamily: "var(--font-barlow), sans-serif",
									color: "#fff",
									fontSize: "1.1rem",
									mb: 1,
								}}
							>
								SWUDB Deck Link
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
							sx={{ mb: isCreateGamePath ? 1 : 3 }}
						/>

						{/* Additional Fields for Non-Creategame Path */}
						{!isCreateGamePath && (
							<>
								{/* Game Name Input */}
								<FormControl fullWidth sx={{ mb: 1 }}>
									<Typography
										sx={{
											fontFamily: "var(--font-barlow), sans-serif",
											color: "#fff",
											fontSize: "1.1rem",
											mb: 1,
										}}
									>
										Game Name{" "}
										<Typography component="span" sx={{ fontSize: "0.8rem" }}>
											(optional)
										</Typography>
									</Typography>
									<StyledTextField
										type="text"
										value={gameName}
										onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
											setGameName(e.target.value)
										}
										placeholder="Enter Game Name"
									/>
								</FormControl>

								{/* Format Selection */}
								<FormControl fullWidth sx={{ mb: 3 }}>
									<Typography
										sx={{
											fontFamily: "var(--font-barlow), sans-serif",
											color: "#fff",
											fontSize: "1.1rem",
											mb: 1,
										}}
									>
										Format
									</Typography>
									<StyledTextField
										select
										value={format}
										onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
											setFormat(e.target.value)
										}
										required
									>
										{formatOptions.map((fmt) => (
											<MenuItem key={fmt} value={fmt}>
												{fmt}
											</MenuItem>
										))}
									</StyledTextField>
								</FormControl>

								{/* Privacy Selection */}
								<FormControl component="fieldset" sx={{ mb: 3 }}>
									<RadioGroup
										row
										value={privacy}
										onChange={(e) => setPrivacy(e.target.value)}
									>
										<FormControlLabel
											value="Public"
											control={
												<Radio
													sx={{
														color: "#fff",
														"&.Mui-checked": {
															color: "#fff",
														},
													}}
												/>
											}
											label={
												<Typography sx={{ color: "#fff", fontSize: "1rem" }}>
													Public
												</Typography>
											}
										/>
										<FormControlLabel
											value="Private"
											control={
												<Radio
													sx={{
														color: "#fff",
														"&.Mui-checked": {
															color: "#fff",
														},
													}}
												/>
											}
											label={
												<Typography sx={{ color: "#fff", fontSize: "1rem" }}>
													Private
												</Typography>
											}
										/>
									</RadioGroup>
								</FormControl>
							</>
						)}

						{/* Submit Button */}
						<Button
							type="submit"
							variant="contained"
							sx={{
								fontFamily: "var(--font-barlow), sans-serif",
								width: "10vw",
								height: "3.5em",
								fontSize: "1.1rem",
								borderRadius: "0.5vw",
								backgroundColor: "#292929",
								display: "block",
								ml: "auto",
								mr: "auto",
								mb: 2,
								"&:hover": {
									backgroundColor: "#3a3a3a",
								},
							}}
						>
							Create
						</Button>
					</form>
				</CardContent>
			</Card>

			{/* Secondary Card - Instructions (Only for /creategame path) */}
			{isCreateGamePath && (
				<Card
					sx={{
						width: { xs: "90vw", sm: "70vw", md: "40vw", lg: "25vw" },
						p: "2em",
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
								fontWeight: "600",
								fontFamily: "var(--font-barlow), sans-serif",
								mb: 2,
							}}
						>
							Instructions
						</Typography>
						<Typography
							variant="body1"
							sx={{
								color: "#fff",
								textAlign: "left",
								fontSize: "1rem",
								fontFamily: "var(--font-barlow), sans-serif",
								fontWeight: "400",
								mb: 2,
							}}
						>
							Choose a deck, then click &apos;Create&apos; to be taken to the
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
			)}
		</Box>
	);
};

export default CreateGameForm;
