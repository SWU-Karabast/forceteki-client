import React from "react";
import { Box, Typography } from "@mui/material";
import { s3ImageURL } from "@/app/_utils/s3Assets";

const KarabastBanner: React.FC = () => {
	//------------------------STYLES------------------------//

	const bannerContainerStyle = {
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
	};

	const textBoxStyle = {
		position: "relative",
		flex: "0 0 auto",
		width: "20%",
		zIndex: 10,
		mb: "7em",
		ml: "1em",
	};

	const headingTextStyle = {
		fontFamily: "var(--font-barlow), sans-serif",
		fontWeight: "400",
		fontSize: "6em",
	};

	const subheadingTextStyle = {
		fontFamily: "var(--font-barlow), sans-serif",
		fontSize: "1.3em",
		ml: ".6em",
	};

	const imagesContainerStyle = {
		display: "flex",
		flex: 1,
		height: "100%",
		backgroundColor: "transparent",
		position: "relative",
	};

	const leiaImageStyle = {
		flex: 1,
		backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.1) 80%, rgba(0,0,0,0.9) 95%, rgba(0,0,0,1) 100%), url(${s3ImageURL("ui/leia-banner.webp")})`,
		backgroundSize: "180%",
		backgroundPositionX: "28%",
		backgroundPositionY: "9%",
		clipPath: "polygon(20.5% 0, 100% 0, 79.5% 100%, 0% 100%)",
		mr: "-9%",
		height: "100%",
	};

	const bobaImageStyle = {
		flex: 1,
		backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.1) 80%, rgba(0,0,0,0.9) 95%, rgba(0,0,0,1) 100%), url(${s3ImageURL("ui/boba-banner.webp")})`,
		backgroundSize: "150%",
		backgroundPositionY: "4%",
		backgroundPositionX: "40%",
		clipPath: "polygon(20.5% 0, 100% 0, 79.5% 100%, 0% 100%)",
		mr: "-9%",
		height: "100%",
	};

	const kyloImageStyle = {
		flex: 1,
		backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.1) 80%, rgba(0,0,0,0.9) 95%, rgba(0,0,0,1) 100%), url(${s3ImageURL("ui/kylo-banner.webp")})`,
		backgroundSize: "150%",
		backgroundPositionY: "4%",
		backgroundPositionX: "40%",
		clipPath: "polygon(20.5% 0, 100% 0, 79.5% 100%, 0% 100%)",
		mr: "-3%",
		height: "100%",
	};

	console.log(s3ImageURL("ui/leia-banner.webp"));

	return (
		<Box sx={bannerContainerStyle}>
			<Box sx={textBoxStyle}>
				<Typography variant="h1" sx={headingTextStyle}>
					KARABAST
				</Typography>
				<Typography variant="h2" sx={subheadingTextStyle}>
					The Fan-Made, Open-Source
				</Typography>
				<Typography variant="h2" sx={subheadingTextStyle}>
					Star Wars Unlimited Simulator
				</Typography>
			</Box>

			<Box sx={imagesContainerStyle}>
				<Box sx={leiaImageStyle} />
				<Box sx={bobaImageStyle} />
				<Box sx={kyloImageStyle} />
			</Box>
		</Box>
	);
};

export default KarabastBanner;
