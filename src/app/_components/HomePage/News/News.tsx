import React, { useEffect } from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { useDragScroll } from "@/app/_utils/useDragScroll";
import NewsItem from "../_subcomponents/NewsItem/NewsItem";
import { articles } from "@/app/_constants/mockData";

const NewsColumn: React.FC = () => {
	const {
		containerRef,
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
		handleTouchStart,
		handleTouchMove,
		handleTouchEnd,
	} = useDragScroll("vertical");

	return (
		<Box
			sx={{
				height: "80vh",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				mr: 3,
			}}
		>
			{/* Top Card: Fixed size */}
			<Card
				sx={{
					width: { xs: "90vw", sm: "70vw", md: "40vw", lg: "30vw" },
					borderRadius: "1.5vw",
					backgroundColor: "#18325199",
					backdropFilter: "blur(20px)",
					mb: 1,
					p: "1.5em",
					height: "30vh",
				}}
			>
				<CardContent>
					<Typography
						variant="h6"
						sx={{
							color: "#fff",
							mb: 2,
							fontWeight: "600",
							fontFamily: "var(--font-barlow), sans-serif",
						}}
					>
						Karabast is an open-source, fan-made platform.
					</Typography>
					<Typography
						variant="body1"
						sx={{
							color: "#fff",
							textAlign: "left",
							mb: 2,
							fontSize: "1rem",
							fontFamily: "var(--font-barlow), sans-serif",
							fontWeight: "400",
						}}
					>
						This tool is free to use and is published non-commercially. Payment
						is not required to access any functionality.
					</Typography>
				</CardContent>
			</Card>

			{/* Bottom Card: Scrollable and displays NewsItem */}
			<Card
				ref={containerRef}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
				sx={{
					flexGrow: 1,
					fontFamily: "var(--font-barlow), sans-serif",
					width: { xs: "90vw", sm: "70vw", md: "40vw", lg: "30vw" },
					borderRadius: "1.5vw",
					overflowY: "auto",
					backgroundColor: "#000000E6",
					backdropFilter: "blur(20px)",
					mt: 2,
					p: "2em",
					clipPath: "inset(0 0 0 0 round 1.5vw)", // Clips the scrollbar within the border-radius
					"::-webkit-scrollbar": {
						width: "0.2vw",
					},
					"::-webkit-scrollbar-thumb": {
						backgroundColor: "#D3D3D3B3",
						borderRadius: "1vw",
					},
					"::-webkit-scrollbar-button": {
						display: "none",
					},
					transition: "scrollbar-color 0.3s ease-in-out",
				}}
			>
				{/* Sticky Title */}
				<Typography
					variant="h4"
					sx={{
						position: "sticky",
						top: 0,
						zIndex: 1,
						fontFamily: "var(--font-barlow), sans-serif",
						color: "#fff",
						mb: 3,
						fontWeight: "800",
					}}
				>
					News
				</Typography>

				{articles.map((article, index) => (
					<NewsItem article={article} key={index} />
				))}
			</Card>
		</Box>
	);
};

export default NewsColumn;
