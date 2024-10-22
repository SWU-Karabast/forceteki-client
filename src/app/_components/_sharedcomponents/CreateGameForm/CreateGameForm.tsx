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

const CreateGameForm: React.FC<CreateGameFormProps> = ({
	format,
	setFormat,
}) => {
	const pathname = usePathname();
	const isCreateGamePath = pathname === "/creategame";

	// Common State
	const [favouriteDeck, setFavouriteDeck] =
		useState<string>("Vader Green Ramp");
	const [deckLink, setDeckLink] = useState<string>("");
	const [saveDeck, setSaveDeck] = useState<boolean>(false);

	// Additional State for Non-Creategame Path
	const [gameName, setGameName] = useState<string>("");
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
		<Box sx={{ height: "80vh" }}>
			{/* Primary Card - Create/Choose Deck Form */}
			<Card
				className={"container" + ' ' + "black-bg" + ' ' + "create-game"}
				sx={{
					width: { xs: "90vw", sm: "70vw", md: "40vw", lg: "30vw" },
					mb: 4,
				}}
			>
				<CardContent>
					<h2>
						{isCreateGamePath ? "Choose Your Deck" : "Create New Game"}
					</h2>
					<form onSubmit={handleCreateGameSubmit}>
						{/* Favourite Decks Input */}
						<FormControl 
						fullWidth sx={{ mb: 1 }}>
							<p>Favorite Decks</p>
							<StyledTextField
								select
								value={favouriteDeck}
								className="input"
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
						<p><a href="https://www.swudb.com/" target="_blank">SWUDB</a> or <a href="https://www.sw-unlimited-db.com/" target="_blank">SW-Unlimited-DB</a> Deck Link <span className="secondary">(use the url or 'Deck Link' button)</span></p>
							<StyledTextField
								type="url"
								className="input"
								value={deckLink}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									setDeckLink(e.target.value)
								}
								required
							/>
						</FormControl>

						{/* Save to Favorite Decks Checkbox */}
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
								<p>Save to Favorite Decks</p>
							}
							sx={{
								mt: "-1rem", 
								mb: "1rem" }}
						/>

						{/* Additional Fields for Non-Creategame Path */}
						{!isCreateGamePath && (
							<>
								{/* Game Name Input */}
								<FormControl fullWidth sx={{ mb: 1 }}>
									<p>Game Name {" "}<span className="secondary">(optional)</span></p>
									<StyledTextField
										type="text"
										className="input"
										value={gameName}
										onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
											setGameName(e.target.value)
										}
										placeholder="Enter Game Name"
									/>
								</FormControl>

								{/* Format Selection */}
								<FormControl fullWidth sx={{ mb: 3 }}>
									<p>Format</p>
									<StyledTextField
										select
										className="input"
										value={format}
										onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
											setFormat ? setFormat(e.target.value) : null
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
								<FormControl component="fieldset" sx={{ mt: "-2rem", mb: 3 }}>
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
							className="button"
							sx={{
								width: "10vw",
								height: "3.5em",
								display: "block",
								ml: "auto",
								mr: "auto",
								mb: "1rem",
							}}
						>
							Create Game
						</Button>
					</form>
				</CardContent>
			</Card>

			{/* Secondary Card - Instructions (Only for /creategame path) */}
			{isCreateGamePath && (
				<Card
					sx={{
						width: { xs: "90vw", sm: "70vw", md: "40vw", lg: "30vw" },
						p: "2em",
						borderRadius: "1.5vw",
						backgroundColor: "#18325199",
						boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
						mb: 4,
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
