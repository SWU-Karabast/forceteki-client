import React from "react";
import { Box } from "@mui/material";
import KarabastBanner from "./_components/Banner/Banner";

const Home: React.FC = () => {
	return (
		<Box
			sx={{
				position: "relative", // To contain the absolutely positioned banner
				height: "100vh",
				overflow: "hidden", // Prevents overflow
				display: "flex",
				flexDirection: "column",
			}}
		>
			{/* Banner positioned absolutely */}
			<KarabastBanner />

			{/* Main Content */}
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					paddingTop: "18vh",
				}}
			>
				{/* Primary Card - Login Form */}
			</Box>
		</Box>
	);
};

export default Home;
