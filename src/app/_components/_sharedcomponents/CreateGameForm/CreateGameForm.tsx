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

	//------------------------STYLES------------------------//

	const mainCardStyle = {
		borderRadius: "1.5em",
		backgroundColor: "#000000E6",
		backdropFilter: "blur(20px)",
		fontFamily: "var(--font-barlow), sans-serif",
		width: { xs: "90vw", sm: "70vw", md: "40vw", lg: "30vw" },
		p: "2em",
		mb: "2em",
	};

	const headingStyle = {
		fontFamily: "var(--font-barlow), sans-serif",
		fontWeight: "800",
		fontSize: "2em",
		color: "#fff",
		mb: ".5em",
	};

	const formControlStyle = {
		mb: ".5em",
	};

	const labelTextStyle = {
		fontFamily: "var(--font-barlow), sans-serif",
		fontSize: "1.3em",
		color: "#fff",
		mb: ".5em",
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
		width: "10em",
		height: "3em",
		borderRadius: "0.5em",
		backgroundColor: "#292929",
		fontFamily: "var(--font-barlow), sans-serif",
		fontSize: "1.2em",
		ml: "auto",
		mr: "auto",
		mb: ".8em",
		"&:hover": {
			backgroundColor: "#3a3a3a",
		},
	};

	const instructionsCardStyle = {
		width: { xs: "90vw", sm: "70vw", md: "40vw", lg: "30vw" },
		borderRadius: "1.5em",
		backgroundColor: "#18325199",
		boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
		p: "2em",
		mb: "2em",
	};

	const instructionsHeadingStyle = {
		fontFamily: "var(--font-barlow), sans-serif",
		fontWeight: "600",
		fontSize: "1.8em",
		color: "#fff",
		mb: ".8em",
	};

	const instructionsTextStyle = {
		fontFamily: "var(--font-barlow), sans-serif",
		fontWeight: "400",
		fontSize: "1em",
		textAlign: "left",
		color: "#fff",
		mb: ".2em",
	};

	return (
		<Box sx={{ height: "80vh" }}>
			{/* Primary Card - Create/Choose Deck Form */}
			<Card sx={mainCardStyle}>
				<CardContent>
					<Typography variant="h3" sx={headingStyle}>
						{isCreateGamePath ? "Choose Your Deck" : "Create New Game"}
					</Typography>
					<form onSubmit={handleCreateGameSubmit}>
						{/* Favourite Decks Input */}
						<FormControl fullWidth sx={formControlStyle}>
							<Typography sx={labelTextStyle}>Favourite Decks</Typography>
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
						<FormControl fullWidth sx={formControlStyle}>
							<Typography sx={labelTextStyle}>
								SWUDB Deck Link
								<Typography component="span" sx={{ fontSize: "0.7em" }}>
									{" "}
									(use the url or &apos;Deck Link&apos; button)
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
									Save Deck To Favourites
								</Typography>
							}
							sx={{ mb: isCreateGamePath ? 1 : 3 }}
						/>

						{/* Additional Fields for Non-Creategame Path */}
						{!isCreateGamePath && (
							<>
								{/* Game Name Input */}
								<FormControl fullWidth sx={formControlStyle}>
									<Typography sx={labelTextStyle}>
										Game Name{" "}
										<Typography component="span" sx={{ fontSize: "0.8rem" }}>
											(optional)
										</Typography>
									</Typography>
									<StyledTextField
										type="text"
										value={gameName}
										onChange={(e: ChangeEvent<HTMLInputElement>) =>
											setGameName(e.target.value)
										}
										placeholder="Enter Game Name"
									/>
								</FormControl>

								{/* Format Selection */}
								<FormControl fullWidth sx={{ mb: "1em" }}>
									<Typography sx={labelTextStyle}>Format</Typography>
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
								<FormControl component="fieldset" sx={{ mb: ".8em" }}>
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
							Create
						</Button>
					</form>
				</CardContent>
			</Card>

			{/* Secondary Card - Instructions (Only for /creategame path) */}
			{isCreateGamePath && (
				<Card sx={instructionsCardStyle}>
					<CardContent>
						<Typography variant="h3" sx={instructionsHeadingStyle}>
							Instructions
						</Typography>
						<Typography variant="body1" sx={instructionsTextStyle}>
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
