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
import { usePathname, useRouter } from "next/navigation";
import {updateIdsWithMapping, mapIdToInternalName, transformDeckWithCardData} from "@/app/_utils/s3Utils";
import { useUser } from "@/app/_contexts/User.context";

interface ICreateGameFormProps {
	format?: string | null;
	setFormat?: (format: string) => void;
}

interface IDeckMetadata {
	name: string;
	author: string;
}

interface IDeckCard {
	id: string;
	count: number;
}

interface IDeckData {
	metadata: IDeckMetadata;
	leader: IDeckCard;
	secondleader: IDeckCard | null;
	base: IDeckCard;
	deck: IDeckCard[];
	sideboard: IDeckCard[];
}

const deckOptions: string[] = [
	"Order66",
	"ThisIsTheWay",
];

const formatOptions: string[] = ["Premier", "Twin Suns", "Draft", "Sealed"];

const CreateGameForm: React.FC<ICreateGameFormProps> = ({
	format,
	setFormat,
}) => {
	const pathname = usePathname();
	const router = useRouter();
	const isCreateGamePath = pathname === "/creategame";
	const user = useUser();
	console.log("User:", user);

	// Common State
	const [favouriteDeck, setFavouriteDeck] = useState<string>("");
	const [deckLink, setDeckLink] = useState<string>("");
	const [saveDeck, setSaveDeck] = useState<boolean>(false);
	//let [deckData, setDeckData] = useState<DeckData | null>(null); Because of Async this won't set in the correct timeframe

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

			const data: IDeckData = await response.json();

			// Fetch setToId mapping from the s3bucket endpoint
			const setCodeMapping = await fetch("/api/s3bucket?jsonFile=_setCodeMap.json"); // Adjust to your actual endpoint if different
			if (!setCodeMapping.ok) {
				throw new Error("Failed to fetch card mapping");
			}

			const jsonData = await setCodeMapping.json();
			const deckWithIds = updateIdsWithMapping(data, jsonData);

			// Fetch codeToInternalname mapping
			const codeInternalnameMapping = await fetch("/api/s3bucket?jsonFile=_cardMap.json"); // Adjust to your actual endpoint if different
			if (!codeInternalnameMapping.ok) {
				throw new Error("Failed to fetch card mapping");
			}

			const codeInternalnameJson = await codeInternalnameMapping.json();
			const deckWithInternalNames = mapIdToInternalName(codeInternalnameJson, deckWithIds)

			// Fetch internalNameToCardMapping
			const finalDeckForm = await transformDeckWithCardData(deckWithInternalNames);
			return finalDeckForm
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
		const deckData = await fetchDeckData(deckLink);
		console.log("fetch complete, deck data:", deckData);
		console.log("Save Deck To Favourites:", saveDeck);
		try {
			const payload = {
				...user,
				deck: deckData
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

	const formControlStyle = {
		mb: "1.5rem",
	};

	const labelTextStyle = {
		mb: ".5em",
		color: "white",
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
			<Card variant="black">
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
							<Box sx={labelTextStyle}>
									<Link href="https://www.swudb.com/" target="_blank" sx={{ color: 'lightblue' }}>
									SWUDB
									</Link>{' '}
									or{' '}
									<Link href="https://www.sw-unlimited-db.com/" target="_blank" sx={{ color: 'lightblue' }}>
									SW-Unlimited-DB
									</Link>{' '}
									Deck Link{' '}
								<Typography variant="body1" sx={labelTextStyleSecondary}>
									(use the URL or &apos;Deck Link&apos; button)
								</Typography>
							</Box>
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
