import React from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import NewsItem from "../_subcomponents/NewsItem/NewsItem";
import { articles } from "@/app/_constants/mockData";

const NewsColumn: React.FC = () => {;

	//------------------------STYLES------------------------//
	const styles = {
		newsBox: {
			display: "flex",
			flexDirection: "column",
			height: "50vh",
		},
		newsList: {
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
			overflow: "scroll"
		},
		boxStyle: {
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
		},
	};

	return (
		<Box sx={styles.boxStyle}>
			<Card variant="blue" sx={{mb: "1rem"}}>
				<CardContent>
					<Typography variant="bodyBold">Karabast is an open-source, fan-made platform.</Typography>
					<Typography variant="body1">It is an educational tool only, meant to facilitate researching decks and strategies that is supportive of in-person play. As such, direct competition through the form of automated tournaments or rankings will not be added.</Typography>
					<Typography variant="body1">This tool is free to use and is published non-commercially. Payment is not required to access any functionality.</Typography>
				</CardContent>
			</Card>

			{/* Bottom Card: Scrollable and displays NewsItem */}
			<Card variant="black" sx={styles.newsBox}>
				<Box>
					<Typography variant="h3">
						News
					</Typography>
				</Box>
				<Box sx={styles.newsList}>
					{articles.map((article, index) => (
						<NewsItem article={article} key={index} />
					))}
				</Box>
			</Card>
		</Box>
	);
};

export default NewsColumn;
