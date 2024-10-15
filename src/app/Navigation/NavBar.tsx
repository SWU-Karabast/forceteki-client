"use client";
import { usePathname } from "next/navigation";
import { Typography, Grid2 as Grid } from "@mui/material";
import ControlHub from "../_components/_sharedcomponents/ControlHub/ControlHub";
import { useSidebar } from "../_contexts/Sidebar.context";

const Navbar = () => {
	const pathname = usePathname();
	const { sidebarOpen, toggleSidebar } = useSidebar();

	return (
		<Grid
			container
			justifyContent="space-between"
			alignItems="center"
			sx={{
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				zIndex: 1100,
				width: "100%",
			}}
		>
			{pathname === "/lobby" ? (
				<Typography
					variant="h6"
					sx={{
						fontFamily: "var(--font-barlow), sans-serif",
						fontSize: "1.67vw",
						fontWeight: "600",
						color: "#fff",
						marginTop: ".5vh",
						marginLeft: ".5vw",
					}}
				>
					GAME LOBBY
				</Typography>
			) : null}

			<ControlHub
				path={pathname}
				sidebarOpen={sidebarOpen}
				toggleSidebar={toggleSidebar}
			/>
		</Grid>
	);
};

export default Navbar;
