"use client";

import React from "react";
import { Box } from "@mui/material";
import KarabastBanner from "../_components/_sharedcomponents/Banner/Banner";
import Login from "../_components/Auth/Login/Login";


const Auth: React.FC = () => {


	const mainContainerStyle = {
		position: "relative",
		height: "100vh",
		overflow: "hidden",
		display: "flex",
		flexDirection: "column",
	};

	return (
		<Box sx={mainContainerStyle}>
			<KarabastBanner />
			<Login />
		</Box>
	);
};

export default Auth;
