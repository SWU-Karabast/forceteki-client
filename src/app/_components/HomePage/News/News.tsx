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
				className={"container" + ' ' + "blue-bg"}
				sx={{
					width: { xs: "90vw", sm: "70vw", md: "40vw", lg: "30vw" },
					mb: 1,
					overflow: "visible",
				}}
			>
				<CardContent>
					<p><b>Karabast is an open-source, fan-made platform.</b></p>
					<p>It is an educational tool only, meant to facilitate researching decks and strategies that is supportive of in-person play. As such, direct competition through the form of automated tournaments or rankings will not be added.</p>
					<p>This tool is free to use and is published non-commercially. Payment is not required to access any functionality.</p>
				</CardContent>
			</Card>

			{/* Bottom Card: Scrollable and displays NewsItem */}
			<Card
				className={"container" + ' ' + "black-bg"}
				ref={containerRef}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
				sx={{
					flexGrow: 1,
					width: { xs: "90vw", sm: "70vw", md: "40vw", lg: "30vw" },
					overflowY: "auto",
					mt: 2,
				}}
			>
				{/* Sticky Title */}
				<h2>News</h2>

				{articles.map((article, index) => (
					<NewsItem article={article} key={index} />
				))}
			</Card>
		</Box>
	);
};

export default NewsColumn;
