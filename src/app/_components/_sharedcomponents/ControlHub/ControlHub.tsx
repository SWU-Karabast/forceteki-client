import React from "react";
import { Box, Divider, IconButton, Typography } from "@mui/material";
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

	//------------------------STYLES------------------------//

	const containerStyle = {
		position: "absolute",
		top: 10,
		right: isLobbyView || isGameboardView ? 10 : 0,
		display: "flex",
		alignItems: "center",
		zIndex: 1,
	};

	const defaultMainContainerStyle = {
		display: "flex",
		gap: 1,
		alignItems: "center",
		ml: "1rem",
	};

	const backButtonStyle = {
		color: "#fff",
		mt: ".5vh",
		fontFamily: "var(--font-barlow), sans-serif",
		fontWeight: "600",
		fontSize: "1.5rem",
	};

	const exitTextStyle = {
		fontFamily: "var(--font-barlow), sans-serif",
		fontWeight: "600",
		color: "#fff",
		mt: ".5vh",
		mr: ".5vw",
	};

	const profileBoxStyle = {
		display: "flex",
		borderRadius: "50px",
		backgroundColor: "#000000E6",
		backdropFilter: "blur(20px)",
		height: "48px",
		justifyContent: "space-around",
		alignItems: "center",
		alignContent: "center",
		p: "0.5rem 1rem",
	};

	const profileLinkStyle = {
		fontFamily: "var(--font-barlow), sans-serif",
		fontWeight: "400",
		fontSize: "1em",
		textDecoration: "none",
		color: "#fff",
		"&:hover": {
			color: "#00ffff",
		},
	};

	const socialIconsBoxStyle = {
		display: "flex",
		height: "48px",
		borderRadius: "50px 0 0 50px",
		backgroundColor: "#000000E6",
		backdropFilter: "blur(20px)",
		alignItems: "center",
		p: "0.5rem",
	};

	const iconButtonStyle = {
		color: "#fff",
		"&:hover": { color: "#00ffff" },
	};

	return (
		<Box sx={containerStyle}>
			{isLobbyView ? (
				<>
					<IconButton>
						<ArrowBackIosNew sx={backButtonStyle} onClick={handleBack} />
					</IconButton>
					<Typography variant="h5" sx={exitTextStyle}>
						EXIT
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
				<Box sx={defaultMainContainerStyle}>
					{/* Conditionally render Profile/Log Out or Log In */}
					<Box sx={profileBoxStyle}>
						{user ? (
							<>
								<NextLinkMui href="/profile" sx={profileLinkStyle}>
									PROFILE
								</NextLinkMui>
								<Divider
									orientation="vertical"
									flexItem
									sx={{ borderColor: "#ffffff4D", mx: 1 }}
								/>
								<NextLinkMui href="/" onClick={logout} sx={profileLinkStyle}>
									LOG OUT
								</NextLinkMui>
							</>
						) : (
							<NextLinkMui href="/auth" sx={profileLinkStyle}>
								LOG IN
							</NextLinkMui>
						)}
					</Box>
					{/* Social Icons Chip */}
					<Box sx={socialIconsBoxStyle}>
						<NextLinkMui
							href="https://discord.com"
							target="_blank"
							rel="noopener noreferrer"
						>
							<IconButton sx={iconButtonStyle}>
								<FaDiscord />
							</IconButton>
						</NextLinkMui>
						<NextLinkMui
							href="https://github.com/SWU-Karabast"
							target="_blank"
							rel="noopener noreferrer"
						>
							<IconButton sx={iconButtonStyle}>
								<GitHub />
							</IconButton>
						</NextLinkMui>
						<NextLinkMui
							href="https://patreon.com"
							target="_blank"
							rel="noopener noreferrer"
						>
							<IconButton sx={iconButtonStyle}>
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
