import React from "react";
import Grid from "@mui/material/Grid2";
import Resources from "../_subcomponents/PlayerOpponentRows/Resources/Resources";
import DeckDiscard from "../_subcomponents/PlayerOpponentRows/DeckDiscard/DeckDiscard";
import CardActionTray from "../_subcomponents/PlayerOpponentRows/CardActionTray/CardActionTray";

const PlayerCardTray: React.FC<PlayerCardTrayProps> = ({
	participant,
	handleModalToggle,
	availableCards,
	onSelectCard,
	resourceSelection,
	setResourceSelection,
	availableResources,
	totalResources,
	handlePlayCard,
	selectedResourceCards,
	handleBasicPromptToggle
}) => {
	//---------------Styles------------------- //
	const leftColumnStyle = {
		display: "flex",
		alignItems: "center",
		justifyContent: "flex-start",
		pl: "2em",
		pt: "2em",
	};

	const centerColumnStyle = {
		height: "100%",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
	};

	const rightColumnStyle = {
		display: "flex",
		alignItems: "center",
		justifyContent: "flex-end",
		pr: "2em",
		pt: "2em",
	};

	return (
		<Grid container sx={{ height: "20.82%" }}>
			<Grid size={3} sx={leftColumnStyle}>
				<Resources
					availableResources={availableResources}
					totalResources={totalResources}
					activePlayer={participant.type}
					handleModalToggle={handleModalToggle}
				/>
			</Grid>
			<Grid size={6} sx={centerColumnStyle}>
				<CardActionTray
					activePlayer={participant.type}
					availableCards={availableCards}
					onSelectCard={onSelectCard}
					resourceSelection={resourceSelection}
					setResourceSelection={setResourceSelection}
					handlePlayCard={handlePlayCard}
					selectedResourceCards={selectedResourceCards}
					availableResources={availableResources}
					totalResources={totalResources}
					handleBasicPromptToggle={handleBasicPromptToggle}
				/>
			</Grid>
			<Grid size={3} sx={rightColumnStyle}>
				<DeckDiscard deckSize={participant.deckSize} />
			</Grid>
		</Grid>
	);
};

export default PlayerCardTray;
