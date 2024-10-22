import React from "react";
import {
	CardContent,
	CardMedia,
	Divider,
	Typography,
	Box,
} from "@mui/material";

const NewsItem: React.FC<NewsItemProps> = ({ article }) => {
	return (
		<>
			<CardContent>
				<Box
					sx={{
						mt: 1,
						display: "flex",
						justifyContent: "space-between",
						alignItems: "flex-end",
					}}
				>
					<h3>{article.title}</h3>
					<h3 className="light">{article.date}</h3>
				</Box>
				<hr></hr>
				<p>{article.content}</p>
			</CardContent>
			<CardMedia
				component="img"
				image={article.image}
				alt={article.imageAlt}
				sx={{ borderRadius: ".5vw" ,
				mt: "1.25rem",
				mb: "2rem",
				}}
				
			/>
		</>
	);
};

export default NewsItem;
