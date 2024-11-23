import React from "react";
import { Box, Divider, IconButton, Typography } from "@mui/material";
import { Settings, Menu, ArrowBackIosNew, GitHub } from "@mui/icons-material";
import { FaDiscord, FaPatreon } from "react-icons/fa6";
import { useRouter } from "next/navigation";
import NextLinkMui from "./_subcomponents/NextLinkMui/NextLinkMui";
import { ControlHubProps } from "./ControlHubTypes";

const ControlHub: React.FC<ControlHubProps> = ({
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

	// ---------------------- Styles ---------------------- //

	const controlHubStyles = {
		container: (isLobbyView: boolean, isGameboardView: boolean) => ({
			position: "absolute",
			top: 10,
			right: isLobbyView || isGameboardView ? 10 : 0,
			display: "flex",
			alignItems: "center",
			zIndex: 1,
		}),
		defaultMainContainer: {
			display: "flex",
			gap: 1,
			alignItems: "center",
			ml: "1rem",
		},
		backButton: {
			color: "#fff",
			mt: ".5vh",
			fontFamily: "var(--font-barlow), sans-serif",
			fontWeight: "600",
			fontSize: "1.5rem",
		},
		exitText: {
			fontFamily: "var(--font-barlow), sans-serif",
			fontWeight: "600",
			color: "#fff",
			mt: ".5vh",
			mr: ".5vw",
		},
		profileBox: {
			display: "flex",
			borderRadius: "50px",
			backgroundColor: "#000000E6",
			backdropFilter: "blur(20px)",
			height: "48px",
			justifyContent: "space-around",
			alignItems: "center",
			alignContent: "center",
			p: "0.5rem 1rem",
		},
		profileLink: {
			fontFamily: "var(--font-barlow), sans-serif",
			fontWeight: "400",
			fontSize: "1em",
			textDecoration: "none",
			color: "#fff",
			"&:hover": {
				color: "#00ffff",
			},
		},
		socialIconsBox: {
			display: "flex",
			height: "48px",
			borderRadius: "50px 0 0 50px",
			backgroundColor: "#000000E6",
			backdropFilter: "blur(20px)",
			alignItems: "center",
			p: "0.5rem",
		},
		iconButton: {
			color: "#fff",
			"&:hover": { color: "#00ffff" },
		},
	};

	return (
		<Box sx={controlHubStyles.container(isLobbyView, isGameboardView)}>
			{isLobbyView ? (
				<>
					<IconButton>
						<ArrowBackIosNew
							sx={controlHubStyles.backButton}
							onClick={handleBack}
						/>
					</IconButton>
					<Typography variant="h5" sx={controlHubStyles.exitText}>
						EXIT
					</Typography>
				</>
			) : isGameboardView ? (
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
				<Box sx={controlHubStyles.defaultMainContainer}>
					<Box sx={controlHubStyles.profileBox}>
						{user ? (
							<>
								<NextLinkMui href="/profile" sx={controlHubStyles.profileLink}>
									PROFILE
								</NextLinkMui>
								<Divider
									orientation="vertical"
									flexItem
									sx={{ borderColor: "#ffffff4D", mx: 1 }}
								/>
								<NextLinkMui
									href="/"
									onClick={logout}
									sx={controlHubStyles.profileLink}
								>
									LOG OUT
								</NextLinkMui>
							</>
						) : (
							<NextLinkMui href="/auth" sx={controlHubStyles.profileLink}>
								LOG IN
							</NextLinkMui>
						)}
					</Box>
					<Box sx={controlHubStyles.socialIconsBox}>
						<NextLinkMui
							href="https://discord.com"
							target="_blank"
							rel="noopener noreferrer"
						>
							<IconButton sx={controlHubStyles.iconButton}>
								<FaDiscord />
							</IconButton>
						</NextLinkMui>
						<NextLinkMui
							href="https://github.com/SWU-Karabast"
							target="_blank"
							rel="noopener noreferrer"
						>
							<IconButton sx={controlHubStyles.iconButton}>
								<GitHub />
							</IconButton>
						</NextLinkMui>
						<NextLinkMui
							href="https://patreon.com"
							target="_blank"
							rel="noopener noreferrer"
						>
							<IconButton sx={controlHubStyles.iconButton}>
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
