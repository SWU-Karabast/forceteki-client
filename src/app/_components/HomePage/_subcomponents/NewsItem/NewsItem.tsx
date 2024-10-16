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
					<Typography
						sx={{
							fontFamily: "var(--font-barlow), sans-serif",
							fontWeight: "800",
							color: "#fff",
							fontSize: "1.5rem",
						}}
					>
						{article.title}
					</Typography>
					<Typography
						sx={{
							fontFamily: "var(--font-barlow), sans-serif",
							fontWeight: "400",
							color: "#fff",
							fontSize: "1.5rem",
						}}
					>
						{article.date}
					</Typography>
				</Box>
				<Divider
					sx={{
						backgroundColor: "#fff",
						mt: ".5vh",
						mb: "1vh",
					}}
				/>
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
					{article.content}
				</Typography>
			</CardContent>
			<CardMedia
				component="img"
				height="auto"
				image={article.image}
				alt={article.imageAlt}
				sx={{ borderRadius: ".5vw" }}
			/>
		</>
	);
};

export default NewsItem;
