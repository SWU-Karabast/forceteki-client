import React from "react";
import { Box, IconButton, Typography } from "@mui/material";
import { Settings, Menu, ArrowBackIosNew, GitHub } from "@mui/icons-material";
import { FaDiscord, FaPatreon } from "react-icons/fa";

import NextLinkMui from "../Auth/_subcomponents/NextLinkMui/NextLinkMui";

const ControlHub: React.FC<ControlHub> = ({
	sidebarOpen,
	toggleSidebar,
	path,
}) => {
	const isLobbyView = path === "/lobby";
	const isAuthView = path === "/auth";

	return (
		<Box
			sx={{
				position: "absolute",
				top: 10,
				right: isAuthView ? 0 : 10,
				display: "flex",
				alignItems: "center",
				zIndex: 1,
			}}
		>
			{isAuthView ? (
				// Auth View: Profile, Log Out, and Social Icons
				<Box
					sx={{
						display: "flex",
						gap: 1,
						alignItems: "center",
						marginLeft: "1rem",
					}}
				>
					{/* Profile and Log Out Chip */}
					<Box
						sx={{
							display: "flex",
							padding: "0.5rem 1rem",
							borderRadius: "50px",
							backgroundColor: "rgba(0, 0, 0, 0.9)",
							height: "48px",
							alignItems: "center",
						}}
					>
						<NextLinkMui
							href="/profile"
							sx={{
								fontFamily: "var(--font-barlow), sans-serif",
								fontWeight: "400",
								marginRight: "1rem",
								textDecoration: "none",
								color: "#fff",
								"&:hover": {
									color: "#00ffff",
								},
							}}
						>
							Profile
						</NextLinkMui>
						<NextLinkMui
							href="/logout"
							sx={{
								fontFamily: "var(--font-barlow), sans-serif",
								fontWeight: "400",
								textDecoration: "none",
								color: "#fff",
								"&:hover": {
									color: "#00ffff",
								},
							}}
						>
							Log Out
						</NextLinkMui>
					</Box>

					{/* Social Icons Chip */}
					<Box
						sx={{
							display: "flex",
							padding: "0.5rem",
							borderRadius: "50px 0 0 50px", // Rounded on one side
							backgroundColor: "rgba(0, 0, 0, 0.9)",
							height: "48px", // Ensure both are the same height
							alignItems: "center",
						}}
					>
						<NextLinkMui
							href="https://discord.com"
							target="_blank"
							rel="noopener noreferrer"
						>
							<IconButton
								sx={{ color: "#fff", "&:hover": { color: "#00ffff" } }}
							>
								<FaDiscord />
							</IconButton>
						</NextLinkMui>
						<NextLinkMui
							href="https://github.com"
							target="_blank"
							rel="noopener noreferrer"
						>
							<IconButton
								sx={{ color: "#fff", "&:hover": { color: "#00ffff" } }}
							>
								<GitHub />
							</IconButton>
						</NextLinkMui>
						<NextLinkMui
							href="https://patreon.com"
							target="_blank"
							rel="noopener noreferrer"
						>
							<IconButton
								sx={{ color: "#fff", "&:hover": { color: "#00ffff" } }}
							>
								<FaPatreon />
							</IconButton>
						</NextLinkMui>
					</Box>
				</Box>
			) : isLobbyView ? (
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
