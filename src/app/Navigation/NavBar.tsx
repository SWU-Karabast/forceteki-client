"use client";
import { usePathname } from "next/navigation";
import { Typography, Grid2 as Grid } from "@mui/material";
import ControlHub from "../_components/_sharedcomponents/ControlHub/ControlHub";
import { useSidebar } from "../_contexts/Sidebar.context";
import { useUser } from "../_contexts/User.context"; // Import UserContext

const Navbar = () => {
	const { user, logout } = useUser(); // Get user and logout from UserContext
	const pathname = usePathname();
	const { sidebarOpen, toggleSidebar } = useSidebar();

	//------------------------STYLES------------------------//

	const navbarContainerStyle = {
		position: "fixed",
		top: 0,
		left: 0,
		right: 0,
		zIndex: 1100,
		width: "100%",
	};

	const gameLobbyTextStyle = {
		fontFamily: "var(--font-barlow), sans-serif",
		fontSize: "2.6em",
		fontWeight: "600",
		color: "#fff",
		ml: ".5vw",
	};

	return (
		<Grid
			container
			justifyContent="space-between"
			alignItems="center"
			sx={navbarContainerStyle}
		>
			{pathname === "/lobby" && (
				<Typography variant="h1" sx={gameLobbyTextStyle}>
					GAME LOBBY
				</Typography>
			)}

			<ControlHub
				path={pathname}
				sidebarOpen={sidebarOpen}
				toggleSidebar={toggleSidebar}
				user={user}
				logout={logout}
			/>
		</Grid>
	);
};

export default Navbar;
