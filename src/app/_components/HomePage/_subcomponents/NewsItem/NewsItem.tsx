import React from "react";
import {
	CardContent,
	CardMedia,
	Divider,
	Typography,
	Box,
} from "@mui/material";
import { NewsItemProps } from "../../HomePageTypes";

const NewsItem: React.FC<NewsItemProps> = ({ article }) => {
	//------------------------STYLES------------------------//

	const boxStyle = {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "flex-end",
		mt: 1,
	};

	const titleTextStyle = {
		fontFamily: "var(--font-barlow), sans-serif",
		fontWeight: "600",
		color: "#fff",
		fontSize: "1.5em",
	};

	const dateTextStyle = {
		fontFamily: "var(--font-barlow), sans-serif",
		fontWeight: "400",
		color: "#fff",
		fontSize: "1.5em",
	};

	const dividerStyle = {
		backgroundColor: "#fff",
		mt: ".5vh",
		mb: "1vh",
	};

	const contentTextStyle = {
		color: "#fff",
		textAlign: "left",
		mb: 2,
		fontSize: "1em",
		fontFamily: "var(--font-barlow), sans-serif",
		fontWeight: "400",
	};

	const newsImageStyle = {
		borderRadius: ".5vw",
	};

	return (
		<>
			<CardContent>
				<Box sx={boxStyle}>
					<Typography sx={titleTextStyle}>{article.title}</Typography>
					<Typography sx={dateTextStyle}>{article.date}</Typography>
				</Box>
				<Divider sx={dividerStyle} />
				<Typography variant="body1" sx={contentTextStyle}>
					{article.content}
				</Typography>
			</CardContent>
			<CardMedia
				component="img"
				height="auto"
				image={article.image}
				alt={article.imageAlt}
				sx={newsImageStyle}
			/>
		</>
	);
};

export default NewsItem;
