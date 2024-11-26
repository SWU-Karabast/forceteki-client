"use client";
import React, { useState } from "react";
import { Grid2 as Grid } from "@mui/material";
import KarabastBanner from "./_components/_sharedcomponents/Banner/Banner";
import PublicGames from "./_components/HomePage/PublicGames/PublicGames";
import CreateGameForm from "./_components/_sharedcomponents/CreateGameForm/CreateGameForm";
import NewsColumn from "./_components/HomePage/News/News";

const Home: React.FC = () => {
	const [format, setFormat] = useState("Premier");

	//------------------------STYLES------------------------//

	const gridContainerStyle = {
		position: "relative",
		height: "100vh",
		overflow: "hidden",
	};

	const columnStyle = {
		justifyContent: "center",
		alignContent: "center",
		padding: "1rem",
		mt: "17vh",
		height: "83vh",
	};

	return (
		<Grid container sx={gridContainerStyle}>
			{/* Banner positioned absolutely */}
			<KarabastBanner />
			<Grid container size={4} sx={columnStyle}>
				<PublicGames format={format} />
			</Grid>
			<Grid container size={4} sx={columnStyle}>
				<CreateGameForm format={format} setFormat={setFormat} />
			</Grid>
			<Grid container size={4} sx={columnStyle}>
				<NewsColumn />
			</Grid>
		</Grid>
	);
};

export default Home;
