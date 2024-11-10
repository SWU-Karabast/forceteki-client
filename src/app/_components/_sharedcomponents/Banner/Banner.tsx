import React from "react";
import { Box } from "@mui/material";
import './banner.css';

const KarabastBanner: React.FC = () => {

	const bannerContainerStyle = {
		position: "absolute",
		height: "26vh",
		width: "100%",
		display: "flex",
		zIndex: -1,
	};

	return (
		
		<>
			<div className="home-header">
            	<h1>Karabast</h1>
            	<p>The Fan-Made, Open-Source<br/>Star Wars Unlimited Simulator</p>
        	</div>

			<div className="home-banner">
				<div className="banner + ' ' + block-1"></div>
				<div className="banner + ' ' + block-2"></div>
				<div className="banner + ' ' + block-3"></div>
				<div className="banner + ' ' + block-4"></div>
   			</div>
		</>
	);
};

export default KarabastBanner;
