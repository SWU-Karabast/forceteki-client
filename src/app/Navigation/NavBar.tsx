"use client";
import { usePathname } from "next/navigation";
import { Grid2 as Grid } from "@mui/material";
import ControlHub from "../_components/ControlHub/ControlHub";
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
			<ControlHub
				path={pathname}
				sidebarOpen={sidebarOpen}
				toggleSidebar={toggleSidebar}
			/>
		</Grid>
	);
};

export default Navbar;
