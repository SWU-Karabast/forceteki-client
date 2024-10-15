import React from "react";
import { Box, Typography } from "@mui/material";

const KarabastBanner: React.FC = () => {
	return (
		<Box
			sx={{
				position: "absolute",
				height: "30vh",
				width: "100%",
				backgroundColor: "transparent",
				color: "#fff",
				display: "flex",
				alignItems: "center",
				padding: "0 2%",
				zIndex: -1,
				overflow: "hidden",
			}}
		>
			<Box
				sx={{
					position: "relative",
					flex: "0 0 auto",
					width: "20%",
					zIndex: 10,
					marginBottom: "10vh",
					marginLeft: "1%",
				}}
			>
				<Typography
					variant="h3"
					sx={{
						fontFamily: "var(--font-barlow), sans-serif",
						fontWeight: "400",
						fontSize: "8vh",
					}}
				>
					KARABAST
				</Typography>
				<Typography
					variant="h6"
					sx={{
						fontFamily: "var(--font-barlow), sans-serif",
						marginLeft: ".6vw",
					}}
				>
					The Fan-Made, Open-Source
				</Typography>
				<Typography
					variant="h6"
					sx={{
						fontFamily: "var(--font-barlow), sans-serif",
						marginLeft: ".6vw",
					}}
				>
					Star Wars Unlimited Simulator
				</Typography>
			</Box>

			<Box
				sx={{
					display: "flex",
					flex: 1,
					height: "100%",
					backgroundColor: "transparent",
					position: "relative",
				}}
			>
				<Box
					sx={{
						flex: 1,
						backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.1) 80%, rgba(0,0,0,0.9) 95%, rgba(0,0,0,1) 100%), url('/leia.png')`,
						backgroundSize: "180%",
						backgroundPositionX: "28%",
						backgroundPositionY: "9%",
						clipPath: "polygon(20.5% 0, 100% 0, 79.5% 100%, 0% 100%)",
						marginRight: "-9%",
						height: "100%",
					}}
				/>
				<Box
					sx={{
						flex: 1,
						backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.1) 80%, rgba(0,0,0,0.9) 95%, rgba(0,0,0,1) 100%), url('/boba.png')`,
						backgroundSize: "150%",
						backgroundPositionY: "4%",
						backgroundPositionX: "40%",
						clipPath: "polygon(20.5% 0, 100% 0, 79.5% 100%, 0% 100%)",
						marginRight: "-9%",
						height: "100%",
					}}
				/>
				<Box
					sx={{
						flex: 1,
						backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.1) 80%, rgba(0,0,0,0.9) 95%, rgba(0,0,0,1) 100%), url('/kylo.png')`,
						backgroundSize: "150%",
						backgroundPositionY: "4%",
						backgroundPositionX: "40%",
						clipPath: "polygon(20.5% 0, 100% 0, 79.5% 100%, 0% 100%)",
						marginRight: "-3%",
						height: "100%",
					}}
				/>
			</Box>
		</Box>
	);
};

export default KarabastBanner;
