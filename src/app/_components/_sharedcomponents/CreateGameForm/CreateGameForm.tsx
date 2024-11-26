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
import { usePathname, useRouter } from "next/navigation";

interface CreateGameFormProps {
	format?: string | null;
	setFormat?: (format: string) => void;
}

interface DeckMetadata {
	name: string;
	author: string;
}

interface DeckCard {
	id: string;
	count: number;
}

interface DeckData {
	metadata: DeckMetadata;
	leader: DeckCard;
	secondleader: DeckCard | null;
	base: DeckCard;
	deck: DeckCard[];
	sideboard: DeckCard[];
}

const deckOptions: string[] = [
	"Order66",
	"ThisIsTheWay",
];

const formatOptions: string[] = ["Premier", "Twin Suns", "Draft", "Sealed"];

const createGameFormStyles = {
	mainCard: {
		borderRadius: "1.5em",
		backgroundColor: "#000000E6",
		backdropFilter: "blur(20px)",
		fontFamily: "var(--font-barlow), sans-serif",
		width: { xs: "90vw", sm: "70vw", md: "40vw", lg: "30vw" },
		p: "2em",
		mb: "2em",
	},
	formControl: {
		mb: ".5em",
	},
	labelText: {
		fontFamily: "var(--font-barlow), sans-serif",
		fontSize: "1.3em",
		color: "#fff",
		mb: ".5em",
	},
	checkbox: {
		color: "#fff",
		"&.Mui-checked": {
			color: "#fff",
		},
	},
	checkboxAndRadioGroupText: {
		color: "#fff",
		fontSize: "1em",
	},
	submitButton: {
		display: "block",
		ml: "auto",
		mr: "auto",
	},
	instructionsCard: {
		width: { xs: "90vw", sm: "70vw", md: "40vw", lg: "30vw" },
		borderRadius: "1.5em",
		backgroundColor: "#18325199",
		boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
		p: "2em",
		mb: "2em",
	},
	instructionsHeading: {
		fontFamily: "var(--font-barlow), sans-serif",
		fontWeight: "600",
		fontSize: "1.8em",
		color: "#fff",
		mb: ".8em",
	},
	instructionsText: {
		fontFamily: "var(--font-barlow), sans-serif",
		fontWeight: "400",
		fontSize: "1em",
		textAlign: "left",
		color: "#fff",
		mb: ".2em",
	},
};

const CreateGameForm: React.FC<CreateGameFormProps> = ({
	format,
	setFormat,
}) => {
	const pathname = usePathname();
	const router = useRouter();
	const isCreateGamePath = pathname === "/creategame";

	// Common State
	const [favouriteDeck, setFavouriteDeck] =
		useState<string>("Order66");
	const [deckLink, setDeckLink] = useState<string>("");
	const [saveDeck, setSaveDeck] = useState<boolean>(false);
	const [deckData, setDeckData] = useState<DeckData | null>(null);

	// Additional State for Non-Creategame Path
	const [gameName, setGameName] = useState<string>("");
	const [privacy, setPrivacy] = useState<string>("Public");

	const fetchDeckData = async (deckLink: string) => {
		try {
			const response = await fetch(
				`/api/swudbdeck?deckLink=${encodeURIComponent(deckLink)}`
			);

			if (!response.ok) {
				throw new Error(`Failed to fetch deck: ${response.statusText}`);
			}

			const data: DeckData = await response.json();
			setDeckData(data);
		} catch (error) {
			if (error instanceof Error) {
				console.error("Error fetching deck:", error.message);
			} else {
				console.error("Unexpected error:", error);
			}
		}
	};

	// Handle Create Game Submission
	const handleCreateGameSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		console.log("Favourite Deck:", favouriteDeck);
		console.log("SWUDB Deck Link:", deckLink);
		console.log("beginning fetch for deck link");
		fetchDeckData(deckLink);
		console.log("fetch complete, deck data:", deckData);
		console.log("Save Deck To Favourites:", saveDeck);

		try {
			const payload = {
				user: favouriteDeck
			};
			const response = await fetch("http://localhost:9500/api/create-lobby",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(payload),
				}
			);

			if (!response.ok) {
				throw new Error("Failed to create game");
			}

			router.push("/lobby");
	
		} catch (error) {
			console.error(error);
		}

	};

	//------------------------STYLES------------------------//

	return (
		<Box sx={{ height: "80vh" }}>
			{/* Primary Card - Create/Choose Deck Form */}
			<Card sx={createGameFormStyles.mainCard}>
				<CardContent>
					<Typography variant="h2">
						{isCreateGamePath ? "Choose Your Deck" : "Create New Game"}
					</Typography>
					<form onSubmit={handleCreateGameSubmit}>
						{/* Favourite Decks Input */}
						<FormControl fullWidth sx={createGameFormStyles.formControl}>
							<Typography sx={createGameFormStyles.labelText}>
								Favourite Decks
							</Typography>
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
						<FormControl fullWidth sx={createGameFormStyles.formControl}>
							<Typography sx={createGameFormStyles.labelText}>
								SWUDB Deck Link
								<Typography component="span" sx={{ fontSize: "0.7em" }}>
									(use the url or &apos;Deck Link&apos; button)
								</Typography>
							</Typography>
							<StyledTextField
								type="url"
								value={deckLink}
								onChange={(e: ChangeEvent<HTMLInputElement>) =>
									setDeckLink(e.target.value)
								}
							/>
						</FormControl>

						{/* Save Deck To Favourites Checkbox */}
						<FormControlLabel
							control={
								<Checkbox
									sx={createGameFormStyles.checkbox}
									checked={saveDeck}
									onChange={(
										e: ChangeEvent<HTMLInputElement>,
										checked: boolean
									) => setSaveDeck(checked)}
								/>
							}
							label={
								<Typography sx={createGameFormStyles.checkboxAndRadioGroupText}>
									Save Deck To Favourites
								</Typography>
							}
							sx={{ mb: isCreateGamePath ? 1 : 3 }}
						/>

						{/* Additional Fields for Non-Creategame Path */}
						{!isCreateGamePath && (
							<>
								{/* Game Name Input */}
								<FormControl fullWidth sx={createGameFormStyles.formControl}>
									<Typography sx={createGameFormStyles.labelText}>
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
									<Typography sx={createGameFormStyles.labelText}>
										Format
									</Typography>
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
											control={<Radio sx={createGameFormStyles.checkbox} />}
											label={
												<Typography
													sx={createGameFormStyles.checkboxAndRadioGroupText}
												>
													Public
												</Typography>
											}
										/>
										<FormControlLabel
											value="Private"
											control={<Radio sx={createGameFormStyles.checkbox} />}
											label={
												<Typography
													sx={createGameFormStyles.checkboxAndRadioGroupText}
												>
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
							sx={createGameFormStyles.submitButton}
						>
							Create Game
						</Button>
					</form>
				</CardContent>
			</Card>
		</Box>
	);
};

export default CreateGameForm;
