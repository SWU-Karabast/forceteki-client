import React from "react";
import '../../../frontend.css';
import { Box } from "@mui/material";

const KarabastBanner: React.FC = () => {
	return (
		<Box
			sx={{
				position: "absolute",
				height: "26vh",
				width: "100%",
				backgroundColor: "transparent",
				color: "#fff",
				display: "flex",
				alignItems: "center",
				p: "0 2%",
				zIndex: -1,
				overflow: "hidden",
			}}
		>
			<Box
				className="home-header"
				sx={{
					position: "relative",
					flex: "0 0 auto",
					width: "40%",
					zIndex: 10,
					mb: "10vh",
					ml: "1%",
				}}
			>
				<h1 >KARABAST</h1>
				<p>The Fan-Made, Open-Source<br/>
				Star Wars Unlimited Simulator</p>
			</Box>

			<Box className="home-banner">
				<Box className="banner block-1"></Box>
				<Box className="banner block-2"></Box>
				<Box className="banner block-3"></Box>
				<Box className="banner block-4"></Box>
			</Box>
		</Box>
	);
};

export default KarabastBanner;
