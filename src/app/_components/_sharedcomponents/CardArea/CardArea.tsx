import React from "react";
import { Box } from "@mui/material";
import GameCard from "../Cards/GameCard/GameCard";
import { ICardAreaProps } from "@/app/_components/Gameboard/GameboardTypes";

const CardArea: React.FC<ICardAreaProps> = ({ cards, pile }) => {
	//------------------------STYLES------------------------//
	const mainContainerStyle = {
		display: "flex",
		flexWrap: "wrap",
		gap: "1em",
		p: "1em",
		justifyContent: "center",
		textWrap: "wrap",
	};
	return (
		<Box sx={mainContainerStyle}>
			{cards.map((card) => (
				<GameCard
					key={card.uuid}
					card={card}
					options={['counter']}
					location={'lobby'}
					pile={pile}
				/>
			))}
		</Box>
	);
};

export default CardArea;
