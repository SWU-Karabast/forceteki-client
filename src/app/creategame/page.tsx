"use client";

import React from "react";
import { Box } from "@mui/material";
import KarabastBanner from "../_components/_sharedcomponents/Banner/Banner";
import CreateGameForm from "../_components/_sharedcomponents/CreateGameForm/CreateGameForm";

const CreateGame: React.FC = () => {
	return (
		<Box
			sx={{
				position: "relative",
				height: "100vh",
				overflow: "hidden",
				display: "flex",
				flexDirection: "column",
			}}
		>
			{/* Banner positioned absolutely */}
			<KarabastBanner />

			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					pt: "16vh",
				}}
			>
				{/* Primary Card - Create Game Form */}
				<CreateGameForm />
			</Box>
		</Box>
	);
};

export default CreateGame;
