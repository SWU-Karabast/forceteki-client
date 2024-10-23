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
		height: "25vh",
		width: { xs: "90vw", sm: "70vw", md: "40vw", lg: "30vw" },
		borderRadius: "1.5vw",
		backgroundColor: "#18325199",
		backdropFilter: "blur(20px)",
		display: "flex",
		flexDirection: "column",
		justifyContent: "center",
		p: "1.5em",
	};

	const topCardHeadingTypographyStyle = {
		fontFamily: "var(--font-barlow), sans-serif",
		fontSize: "1.8em",
		fontWeight: "600",
		color: "#fff",
		mb: ".8em",
	};

	const topCardContentTypographyStyle = {
		fontFamily: "var(--font-barlow), sans-serif",
		fontSize: "1.4em",
		fontWeight: "400",
		textAlign: "left",
		color: "#fff",
		mb: ".8em",
	};

	const bottomCardStyle = {
		flexGrow: 1,
		fontFamily: "var(--font-barlow), sans-serif",
		width: { xs: "90vw", sm: "70vw", md: "40vw", lg: "30vw" },
		borderRadius: "1.5em",
		overflowY: "auto",
		backgroundColor: "#000000E6",
		backdropFilter: "blur(20px)",
		mt: "1em",
		p: "2em",
		pt: 0, // so each article can hide behind the sticky title
		clipPath: "inset(0 0 0 0 round 1.5vw)",
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
	};

	const stickyTitleBoxStyle = {
		position: "sticky",
		top: 0,
		zIndex: 2,
		backgroundColor: "#000000",
		mb: ".8em",
	};

	const titleStyle = {
		fontFamily: "var(--font-barlow), sans-serif",
		fontWeight: "8		00",
		color: "#fff",
	};

	//------------------------RETURN------------------------//

	return (
		<Box sx={boxStyle}>
			{/* Top Card: Fixed size */}
			<Card sx={topCardStyle}>
				<CardContent>
					<Typography variant="h4" sx={topCardHeadingTypographyStyle}>
						Karabast is an open-source, fan-made platform.
					</Typography>
					<Typography variant="body1" sx={topCardContentTypographyStyle}>
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
				sx={bottomCardStyle}
			>
				<Box sx={stickyTitleBoxStyle}>
					<Typography variant="h4" sx={titleStyle}>
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
