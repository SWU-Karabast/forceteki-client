"use client";
import React from "react";
import { Paper, Grid2 as Grid } from "@mui/material";
import KarabastBanner from "./_components/_sharedcomponents/Banner/Banner";
import CreateGameForm from "./_components/_sharedcomponents/CreateGameForm/CreateGameForm";

const Home: React.FC = () => {
	return (
		<Grid
			container
			sx={{
				position: "relative", // To contain the absolutely positioned banner
				height: "100vh",
				overflow: "hidden", // Prevents overflow
			}}
		>
			{/* Banner positioned absolutely */}
			<KarabastBanner />

			{/* Main Content */}
			<Grid
				container
				size={4}
				sx={{
					justifyContent: "center",
					alignContent: "center",
				}}
			>
				<Paper sx={{ backgroundColor: "tomato" }}> hello</Paper>
			</Grid>
			<Grid
				container
				size={4}
				sx={{ justifyContent: "center", alignContent: "center" }}
			>
				<CreateGameForm />
			</Grid>
			<Grid
				container
				size={4}
				sx={{
					justifyContent: "center",
					alignContent: "center",
				}}
			>
				<Paper sx={{ backgroundColor: "tomato" }}>hello</Paper>
			</Grid>
		</Grid>
	);
};

export default Home;
