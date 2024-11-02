import React from "react";
import { Box } from "@mui/material";
import GameCard from "../Cards/GameCard/GameCard";
import { CardAreaProps } from "@/app/_components/Gameboard/GameboardTypes";

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
				<GameCard
					path={"/lobby"}
					key={card.id}
					name={card.name}
					selected={false}
					handleSelect={() => {}}
					disabled={true}
					isFaceUp={true}
				/>
			))}
		</Box>
	);
};

export default CardArea;
