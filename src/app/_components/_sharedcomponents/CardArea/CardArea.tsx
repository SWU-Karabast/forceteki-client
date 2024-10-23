import React from "react";
import { Box } from "@mui/material";
import FaceCard from "../Cards/FaceCard/FaceCard";

const CardArea: React.FC<CardAreaProps> = ({ cards }) => {
	//------------------------STYLES------------------------//
	const mainContainerStyle = {
		display: "flex",
		flexWrap: "wrap",
		gap: "3em",
		p: "1em",
		justifyContent: "center",
		textWrap: "wrap",
	};

	return (
		<Box sx={mainContainerStyle}>
			{cards.map((card) => (
				<FaceCard
					path={"/lobby"}
					key={card.id}
					name={card.name}
					selected={false} // Selection logic can be added if needed
					handleSelect={() => {}} // No action yet, cause no selection logic yet
					disabled={true}
				/>
			))}
		</Box>
	);
};

export default CardArea;
