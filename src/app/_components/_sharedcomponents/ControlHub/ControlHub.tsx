import React from "react";
import { Box, IconButton, Typography, Button } from "@mui/material";
import { Settings, Menu, ArrowBackIosNew, GitHub } from "@mui/icons-material";
import { FaDiscord, FaPatreon } from "react-icons/fa6";
import { useRouter } from "next/navigation";

import NextLinkMui from "./_subcomponents/NextLinkMui/NextLinkMui";

const ControlHub: React.FC<ControlHub> = ({
	sidebarOpen,
	toggleSidebar,
	path,
	user,
	logout,
}) => {
	const router = useRouter();
	const isLobbyView = path === "/lobby";
	const isGameboardView = path === "/gameboard";

	const handleBack = () => {
		if (isLobbyView) {
			router.push("/");
		} else {
			router.back();
		}
	};

	return (
		<Box
			sx={{
				position: "absolute",
				top: 10,
				right: isLobbyView || isGameboardView ? 10 : 0,
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
								mt: ".5vh",
								fontFamily: "var(--font-barlow), sans-serif",
								fontWeight: "600",
								fontSize: "1.5rem",
							}}
							onClick={handleBack}
						/>
					</IconButton>
					<Typography
						variant="h6"
						sx={{
							fontFamily: "var(--font-barlow), sans-serif",
							fontWeight: "600",
							color: "#fff",
							mt: ".5vh",
							mr: ".5vw",
						}}
					>
						Exit
					</Typography>
				</>
			) : isGameboardView ? (
				// Gameboard View: Settings and Menu Button
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
			) : (
				// Default View: Conditional Profile/Login and Social Icons
				<Box
					sx={{
						display: "flex",
						gap: 1,
						alignItems: "center",
						ml: "1rem",
					}}
				>
					{/* Conditionally render Profile/Log Out or Log In */}
					{user ? (
						<Box
							sx={{
								display: "flex",
								p: "0.5rem 1rem",
								borderRadius: "50px",
								backgroundColor: "#000000E6",
								backdropFilter: "blur(20px)",
								height: "48px",
								alignItems: "center",
								alignContent: "center",
							}}
						>
							<NextLinkMui
								href="/profile"
								sx={{
									fontFamily: "var(--font-barlow), sans-serif",
									fontWeight: "400",
									mr: "1rem",
									textDecoration: "none",
									color: "#fff",
									"&:hover": {
										color: "#00ffff",
									},
								}}
							>
								PROFILE
							</NextLinkMui>
							<Button
								onClick={logout}
								sx={{
									height: "48px",
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
							</Button>
						</Box>
					) : (
						<Button
							onClick={() => router.push("/auth")}
							sx={{
								height: "48px",
								fontFamily: "var(--font-barlow), sans-serif",
								fontWeight: "400",
								textDecoration: "none",
								color: "#fff",
								backgroundColor: "#000000E6",
								borderRadius: "50px",
								p: "0.5rem 1rem",
								"&:hover": {
									color: "#00ffff",
								},
							}}
						>
							Log In
						</Button>
					)}

					{/* Social Icons Chip */}
					<Box
						sx={{
							display: "flex",
							p: "0.5rem",
							borderRadius: "50px 0 0 50px", // Rounded on one side
							backgroundColor: "#000000E6",
							backdropFilter: "blur(20px)",
							height: "48px",
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
							href="https://github.com/SWU-Karabast"
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
			)}
		</Box>
	);
};

export default ControlHub;
