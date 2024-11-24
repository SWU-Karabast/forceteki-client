"use client";
import React, { useState } from "react";
import Grid from "@mui/material/Grid2";
import { Typography } from "@mui/material";
import KarabastBanner from "./_components/_sharedcomponents/Banner/Banner";
import PublicGames from "./_components/HomePage/PublicGames/PublicGames";
import CreateGameForm from "./_components/_sharedcomponents/CreateGameForm/CreateGameForm";
import NewsColumn from "./_components/HomePage/News/News";
import { Height } from "@mui/icons-material";

const Home: React.FC = () => {
	const [format, setFormat] = useState("Premier");

	const gridContainerStyle = {
		position: "relative",
		overflow: "hidden",
	};

	const columnContainerStyle = {
		height: "100vh",
	};

	const columnStyle = {
		justifyContent: "center",
		padding: "1rem",
		pb: "3rem",
		height: "calc(100% - 11rem)",
		alignSelf: "end",
	};

	const disclaimerStyle = {
		padding: "1rem",
		width: "100%",
		textAlign: "center",
		position: "absolute",
		bottom: 0,
		fontSize: "0.75rem",
	};

	return (
		<Grid container sx={gridContainerStyle}>

			<KarabastBanner />

			<Grid container size={12} sx={columnContainerStyle}>
				<Grid size={4} sx={columnStyle}>
				<PublicGames format={format} />
				</Grid>
				<Grid size={4} sx={columnStyle}>
				<CreateGameForm format={format} setFormat={setFormat} />
				</Grid>
				<Grid size={4} sx={columnStyle}>
				<NewsColumn />
				</Grid>
			</Grid>

			<Grid size={12}>
				<Typography variant="body1" sx={disclaimerStyle}>
				Karabast is in no way affiliated with Disney or Fantasy Flight Games.
				Star Wars characters, cards, logos, and art are property of Disney
				and/or Fantasy Flight Games.
				</Typography>
			</Grid>
		</Grid>
  );
};

export default Home;