import React from "react";
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

	//------------------------STYLES------------------------//

	const boxStyle = {
		height: "80vh",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		mr: "1.8em",
	};

	const topCardStyle = {
		borderRadius: "1.5vw",
		backgroundColor: "#18325199",
		backdropFilter: "blur(20px)",
	};

	const bottomCardStyle = {
		flexGrow: 1,
		width: { xs: "90vw", sm: "70vw", md: "40vw", lg: "30vw" },
		borderRadius: "1.5em",
		backgroundColor: "#000000E6",
		backdropFilter: "blur(20px)",
		mt: "1em",
		p: "2em",
	};

	const stickyTitleBoxStyle = {
		backgroundColor: "#000000",
	};

	return (
		<Box sx={boxStyle}>
			<Card sx={topCardStyle}>
				<CardContent>
					<Typography variant="bodyBold">Karabast is an open-source, fan-made platform.</Typography>
					<Typography variant="body1">It is an educational tool only, meant to facilitate researching decks and strategies that is supportive of in-person play. As such, direct competition through the form of automated tournaments or rankings will not be added.</Typography>
					<Typography variant="body1">This tool is free to use and is published non-commercially. Payment is not required to access any functionality.</Typography>
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
				sx={bottomCardStyle}
			>
				<Box sx={stickyTitleBoxStyle}>
					<Typography variant="h3">
						News
					</Typography>
				</Box>
				{articles.map((article, index) => (
					<NewsItem article={article} key={index} />
				))}
			</Card>
		</Box>
	);
};

export default NewsColumn;
