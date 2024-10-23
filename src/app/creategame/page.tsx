"use client";

import React from "react";
import { Box } from "@mui/material";
import KarabastBanner from "../_components/_sharedcomponents/Banner/Banner";
import CreateGameForm from "../_components/_sharedcomponents/CreateGameForm/CreateGameForm";

const CreateGame: React.FC = () => {
	//------------------------STYLES------------------------//

	const containerStyle = {
		position: "relative",
		height: "100vh",
		overflow: "hidden",
		display: "flex",
		flexDirection: "column",
	};

	const formContainerStyle = {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		pt: "12em",
	};

	return (
		<Box sx={containerStyle}>
			<KarabastBanner />
			<Box sx={formContainerStyle}>
				<CreateGameForm />
			</Box>
		</Box>
	);
};

export default CreateGame;
