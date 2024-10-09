import React from "react";
import { Box, IconButton, Typography } from "@mui/material";
import { Settings, Menu, ArrowBackIosNew } from "@mui/icons-material";

const ControlHub: React.FC<ControlHub> = ({
	sidebarOpen,
	toggleSidebar,
	path,
}) => {
	const isLobbyView = path === "/lobby";

	return (
		<Box
			sx={{
				position: "absolute",
				top: 10,
				right: 10,
				display: "flex",
				alignItems: "center",
				zIndex: 1,
			}}
		>
			{isLobbyView ? (
				<>
					<IconButton>
						<ArrowBackIosNew
							sx={{
								color: "#fff",
								marginTop: ".5vh",
								fontFamily: "var(--font-barlow), sans-serif",
								fontWeight: "600",
								fontSize: "1.5rem",
							}}
						/>
					</IconButton>
					<Typography
						variant="h6"
						sx={{
							fontFamily: "var(--font-barlow), sans-serif",
							fontWeight: "600",
							color: "#fff",
							marginTop: ".5vh",
							marginRight: ".5vw",
						}}
					>
						Exit
					</Typography>
				</>
			) : (
				<>
					<IconButton>
						<Settings sx={{ color: "#fff" }} />
					</IconButton>
					{!sidebarOpen && (
						<IconButton onClick={toggleSidebar}>
							<Menu sx={{ color: "#fff" }} />
						</IconButton>
					)}
				</>
			)}
		</Box>
	);
};

export default ControlHub;
