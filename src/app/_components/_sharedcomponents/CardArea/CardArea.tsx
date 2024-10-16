import React from "react";
import { Box } from "@mui/material";
import FaceCard from "../Cards/FaceCard/FaceCard";

const CardArea: React.FC<CardAreaProps> = ({ cards }) => {
	return (
		<Box
			sx={{
				display: "flex",
				flexWrap: "wrap",
				gap: 5,
				justifyContent: "center",
				textWrap: "wrap",
			}}
		>
			{cards.map((card) => (
				<FaceCard
					path={"/lobby"}
					key={card.id}
					name={card.name}
					selected={false} // Selection logic can be added if needed
					handleSelect={() => {}} // No action on select within ResourcesOverlay
					disabled={true}
				/>
			))}
		</Box>
	);
};

export default CardArea;
