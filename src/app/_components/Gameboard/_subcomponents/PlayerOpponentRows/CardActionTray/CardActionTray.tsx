import React, { useState, useEffect } from "react";
import { Grid2 as Grid, Box, Button, Typography } from "@mui/material";
import FaceCard from "../../../../Cards/FaceCard/FaceCard";
import BackCard from "../../../../Cards/BackCard/BackCard";
import { useDragScroll } from "@/app/utils/useDragScroll";

enum ActionMode {
	None,
	ResourceSelection,
	PlayCard,
}

const CardActionTray: React.FC<CardActionTrayProps> = ({
	activePlayer = "player",
	availableCards = [],
	onSelectCard = () => {},
	resourceSelection = false,
	setResourceSelection = () => {},
	availableResources = 0,
	totalResources = 0,
	handlePlayCard = () => {},
}) => {
	const {
		containerRef,
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
		handleTouchStart,
		handleTouchMove,
		handleTouchEnd,
		isDragging,
		isScrolling,
	} = useDragScroll("horizontal");

	const [actionMode, setActionMode] = useState<ActionMode>(ActionMode.None);

	useEffect(() => {
		if (resourceSelection) {
			setActionMode(ActionMode.ResourceSelection);
		} else if (actionMode === ActionMode.ResourceSelection) {
			setActionMode(ActionMode.None);
		}
	}, [resourceSelection, actionMode]);

	const handleCardClick = (card: FaceCardProps) => {
		if (activePlayer !== "player") return;
		switch (actionMode) {
			case ActionMode.ResourceSelection:
				onSelectCard?.(card);
				break;
			case ActionMode.PlayCard:
				handlePlayCard?.(card);
				setActionMode(ActionMode.None);
				break;
			default:
				break;
		}
	};

	const togglePlayCardMode = () => {
		if (availableResources > 0) {
			setActionMode((prevMode) =>
				prevMode === ActionMode.PlayCard ? ActionMode.None : ActionMode.PlayCard
			);
		}
	};

	const isPlayCardButtonDisabled = (): boolean => {
		return actionMode !== ActionMode.PlayCard && availableResources === 0;
	};

	const isCardDisabled = (): boolean => {
		if (actionMode === ActionMode.ResourceSelection) {
			return availableResources >= totalResources;
		}
		if (actionMode === ActionMode.PlayCard) {
			return availableResources === 0;
		}
		return false;
	};

	return (
		<>
			<Grid
				container
				justifyContent="center"
				alignItems="center"
				sx={{
					position: "relative",
					width: "100%",
					overflowX: "auto",
					whiteSpace: "nowrap",
					padding: "10px 0",
					cursor: isDragging ? "grabbing" : "grab",
					userSelect: "none",
					scrollbarWidth: "thin",
					scrollbarColor: isScrolling
						? "#c4bfbf60 transparent"
						: "transparent transparent",
					transition: "scrollbar-color 0.3s ease-in-out",
				}}
				ref={containerRef}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseUp}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
			>
				<Box
					sx={{
						display: "inline-flex",
						gap: "10px",
					}}
				>
					{availableCards.map((card: FaceCardProps) => (
						<Box key={card.id} sx={{ flex: "0 0 auto" }}>
							{activePlayer === "player" ? (
								<FaceCard
									id={card.id}
									name={card.name}
									selected={card.selected}
									handleSelect={() => handleCardClick(card)}
									disabled={isCardDisabled()}
								/>
							) : (
								<BackCard />
							)}
						</Box>
					))}
				</Box>
			</Grid>

			{activePlayer === "player" && (
				<Grid
					container
					justifyContent="center"
					alignItems="center"
					spacing={2}
					sx={{ marginTop: "1vh" }}
				>
					<Typography variant="h6" sx={{ color: "white" }}>
						Choose an Action:
					</Typography>
					<Button variant="contained">Pass [Space]</Button>
					<Button variant="contained">Claim Initiative</Button>
					<Button
						variant="contained"
						sx={{ backgroundColor: resourceSelection ? "red" : "green" }}
						onClick={
							setResourceSelection
								? () => setResourceSelection(!resourceSelection)
								: undefined
						}
						disabled={resourceSelection && availableResources >= totalResources}
					>
						{resourceSelection
							? "Stop Resource Selection"
							: "Start Resource Selection"}
					</Button>
					<Button
						variant="contained"
						sx={{
							backgroundColor:
								actionMode === ActionMode.PlayCard ? "gold" : "green",
							color: actionMode === ActionMode.PlayCard ? "black" : "white",
						}}
						onClick={togglePlayCardMode}
						disabled={isPlayCardButtonDisabled()}
					>
						{actionMode === ActionMode.PlayCard
							? "Cancel Play Card"
							: "Play a Card"}
					</Button>
				</Grid>
			)}
		</>
	);
};

export default CardActionTray;
