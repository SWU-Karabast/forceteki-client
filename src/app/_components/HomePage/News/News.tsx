import React, { useEffect } from "react";
import {
	Box,
	Card,
	CardContent,
	CardMedia,
	Divider,
	Typography,
} from "@mui/material";
import { useDragScroll } from "@/app/_utils/useDragScroll";

const article = {
	title: "The Dead Speak!",
	content:
		"The galaxy has heard a mysterious broadcast, a threat of revenge in the sinister voice of the late Emperor Palpatine. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis rhoncus commodo lacus, at laoreet nisl ornare sit amet. Pellentesque sit amet viverra nunc.",
	date: "05/15",
	image: "/newsboba.png",
	imageAlt: "Placeholder image",
};

const NewsColumn: React.FC = () => {
	const [articleTitle, setArticleTitle] = React.useState<string>("");
	const [articleContent, setArticleContent] = React.useState<string>("");
	const [articleDate, setArticleDate] = React.useState<string>("");
	const [articleImage, setArticleImage] = React.useState<string>("");
	const [articleImageAlt, setArticleImageAlt] = React.useState<string>("");

	useEffect(() => {
		// Fetch news article here
		setArticleTitle(article.title);
		setArticleContent(article.content);
		setArticleDate(article.date);
		setArticleImage(article.image);
		setArticleImageAlt(article.imageAlt);
	}, []);

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
		<Box sx={{ height: "100%" }}>
			{/* Top Card: Fixed size */}
			<Card
				sx={{
					width: { xs: "90vw", sm: "70vw", md: "40vw", lg: "25vw" },
					padding: "1.5em",
					borderRadius: "1.5vw",
					backgroundColor: "#18325199",
					boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
					mb: 1,
					// Ensure this card will never grow more than it needs
					height: "auto",
					maxHeight: "fit-content",
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
						It is an educational tool, meant to facilitate deck research and
						strategies supportive of in-person play. Direct competition through
						the form of automated tournaments or rankings will not be added.
						<br />
						<br />
						This tool is free to use and is published non-commercially. Payment
						is not required to access any functionality.
					</Typography>
				</CardContent>
			</Card>

			{/* Bottom Card: Scrollable if content is larger */}
			<Card
				ref={containerRef}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
				sx={{
					flexGrow: 1, // Allow it to take remaining space
					fontFamily: "var(--font-barlow), sans-serif",
					width: { xs: "90vw", sm: "70vw", md: "40vw", lg: "25vw" },
					padding: "1.5em",
					borderRadius: "1.5vw",
					overflowY: "auto", // Enable vertical scrolling
					backgroundColor: "rgba(0, 0, 0, 0.9)",
					mt: 2,
					mb: 4,
					maxHeight: "50vh",
					"::-webkit-scrollbar": {
						width: "0.2vw",
					},
					"::-webkit-scrollbar-thumb": {
						backgroundColor: "rgba(211, 211, 211, 0.7)",
						borderRadius: "1vw",
					},
					"::-webkit-scrollbar-button": {
						display: "none",
					},
					transition: "scrollbar-color 0.3s ease-in-out",
				}}
			>
				<CardContent>
					<Typography
						variant="h4"
						sx={{
							fontFamily: "var(--font-barlow), sans-serif",
							color: "#fff",
							mb: 3,
							fontWeight: "800",
						}}
					>
						News
					</Typography>
					<Box sx={{ display: "flex", justifyContent: "space-between" }}>
						<Typography
							style={{
								fontFamily: "var(--font-barlow), sans-serif",
								fontWeight: "800",
								color: "#fff",
								fontSize: "1.5rem",
							}}
						>
							{articleTitle}
						</Typography>
						<Typography
							style={{
								fontFamily: "var(--font-barlow), sans-serif",
								fontWeight: "400",
								color: "#fff",
							}}
						>
							{articleDate}
						</Typography>
					</Box>
					<Divider
						sx={{
							backgroundColor: "#fff",
							marginTop: ".5vh",
							marginBottom: "1vh",
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
						{articleContent}
					</Typography>
				</CardContent>
				<CardMedia
					component="img"
					height="auto"
					image={articleImage}
					alt={articleImageAlt}
					sx={{ borderRadius: ".5vw" }}
				/>
			</Card>
		</Box>
	);
};

export default NewsColumn;
