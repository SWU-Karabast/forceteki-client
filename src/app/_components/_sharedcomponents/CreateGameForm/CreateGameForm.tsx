import React, { useState, FormEvent, ChangeEvent } from "react";
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
	Link,
} from "@mui/material";
import StyledTextField from "../_styledcomponents/StyledTextField/StyledTextField";
import { usePathname } from "next/navigation";

interface CreateGameFormProps {
	format?: string | null;
	setFormat?: (format: string) => void;
}

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

	const mainCardStyle = {
		borderRadius: "1.5em",
		backgroundColor: "#000000E6",
		backdropFilter: "blur(20px)",
		width: { xs: "90vw", sm: "70vw", md: "40vw", lg: "30vw" },
		p: "2em",
		mb: "2em",
	};

	const formControlStyle = {
		mb: "1.5rem",
	};

	const labelTextStyle = {
		mb: ".5em",
	};

	const labelTextStyleSecondary = {
		color: "#aaaaaa",
		display: "inline",
	};

	const checkboxStyle = {
		color: "#fff",
		"&.Mui-checked": {
			color: "#fff",
		},
	};

	const checkboxAndRadioGroupTextStyle = {
		color: "#fff",
		fontSize: "1em",
	};

	const submitButtonStyle = {
		display: "block",
		ml: "auto",
		mr: "auto",
	};

	const instructionsCardStyle = {
		width: { xs: "90vw", sm: "70vw", md: "40vw", lg: "30vw" },
		borderRadius: "1.5em",
		backgroundColor: "#18325199",
		boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
		p: "2em",
		mb: "2em",
	};

	return (
		<Box sx={{ height: "80vh" }}>
			{/* Primary Card - Create/Choose Deck Form */}
			<Card sx={mainCardStyle}>
				<CardContent>
					<Typography variant="h2">
						{isCreateGamePath ? "Choose Your Deck" : "Create New Game"}
					</Typography>
					<form onSubmit={handleCreateGameSubmit}>
						{/* Favourite Decks Input */}
						<FormControl fullWidth sx={formControlStyle}>
							<Typography variant="body1" sx={labelTextStyle}>Favourite Decks</Typography>
							<StyledTextField
								select
								value={favouriteDeck}
								onChange={(e: ChangeEvent<HTMLInputElement>) =>
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
						<FormControl fullWidth sx={{ mb: 0 }}>
							<Typography variant="body1" sx={labelTextStyle}>
									<Link href="https://www.swudb.com/" target="_blank" sx={{ color: 'lightblue' }}>
									SWUDB
									</Link>{' '}
									or{' '}
									<Link href="https://www.sw-unlimited-db.com/" target="_blank" sx={{ color: 'lightblue' }}>
									SW-Unlimited-DB
									</Link>{' '}
									Deck Link{' '}
								<Typography variant="body1" sx={labelTextStyleSecondary}>
									(use the URL or 'Deck Link' button)
								</Typography>
							</Typography>
							<StyledTextField
								type="url"
								value={deckLink}
								onChange={(e: ChangeEvent<HTMLInputElement>) =>
									setDeckLink(e.target.value)
								}
								required
							/>
						</FormControl>

						{/* Save Deck To Favourites Checkbox */}
						<FormControlLabel
							sx={{ mb: "1rem" }}
							control={
								<Checkbox
									sx={checkboxStyle}
									checked={saveDeck}
									onChange={(
										e: ChangeEvent<HTMLInputElement>,
										checked: boolean
									) => setSaveDeck(checked)}
								/>
							}
							label={
								<Typography sx={checkboxAndRadioGroupTextStyle}>
									Save to Favorite Decks
								</Typography>
							}
						/>

						{/* Additional Fields for Non-Creategame Path */}
						{!isCreateGamePath && (
							<>
								{/* Game Name Input */}
								<FormControl fullWidth sx={formControlStyle}>
									<Typography variant="body1" sx={labelTextStyle}>
										Game Name
									</Typography>
									<StyledTextField
										type="text"
										value={gameName}
										onChange={(e: ChangeEvent<HTMLInputElement>) =>
											setGameName(e.target.value)
										}
										placeholder="Game #"
									/>
								</FormControl>

								{/* Format Selection */}
								<FormControl fullWidth sx={formControlStyle}>
									<Typography variant="body1" sx={labelTextStyle}>Format</Typography>
									<StyledTextField
										select
										value={format}
										onChange={(e: ChangeEvent<HTMLInputElement>) =>
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
								<FormControl component="fieldset" sx={formControlStyle}>
									<RadioGroup
										row
										value={privacy}
										onChange={(
											e: ChangeEvent<HTMLInputElement>,
											value: string
										) => setPrivacy(value)}
									>
										<FormControlLabel
											value="Public"
											control={<Radio sx={checkboxStyle} />}
											label={
												<Typography sx={checkboxAndRadioGroupTextStyle}>
													Public
												</Typography>
											}
										/>
										<FormControlLabel
											value="Private"
											control={<Radio sx={checkboxStyle} />}
											label={
												<Typography sx={checkboxAndRadioGroupTextStyle}>
													Private
												</Typography>
											}
										/>
									</RadioGroup>
								</FormControl>
							</>
						)}

						{/* Submit Button */}
						<Button type="submit" variant="contained" sx={submitButtonStyle}>
							Create Game
						</Button>
					</form>
				</CardContent>
			</Card>

			{/* Secondary Card - Instructions (Only for /creategame path) */}
			{isCreateGamePath && (
				<Card sx={instructionsCardStyle}>
					<CardContent>
						<Typography variant="h3">
							Instructions
						</Typography>
						<Typography variant="body1">
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
