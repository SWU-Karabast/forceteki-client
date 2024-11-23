import React from "react";
import { Box, Typography } from "@mui/material";
import { s3ImageURL } from "@/app/_utils/s3Assets";

const KarabastBanner: React.FC = () => {
	
	const styles = {
	  titleheader: { 
		fontSize: "3.2rem", 
		fontWeight: 400, 
		marginBottom: "5px" 
	  },
	  subheader: { 
		marginBottom: 0, 
	  },
	  bannerContainerStyle: {
		position: 'absolute',
		height: '26vh',
		width: '100%',
		display: 'flex',
		alignItems: 'center',
		padding: '0 2%',
		zIndex: -1,
		overflow: 'hidden',
	  },
	  textBoxStyle: {
		position: 'relative',
		width: '20%',
		zIndex: 10,
		marginBottom: '7em',
		marginLeft: '1em',
	  },
	  homeBanner: {
		width: 'calc(100% - 240px)',
		minWidth: '400px',
		height: '100%',
		position: 'absolute',
		top: 0,
		right: 0,
		zIndex: -1,
		mask: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%) 100% 50% / 100% 100% repeat-x',
		display: 'flex',
	  },
	  banner: {
		backgroundSize: 'cover',
		backgroundPosition: 'center',
		clipPath: 'polygon(150px 0, 100% 0, calc(100% - 150px) 326px, 0% 326px)',
		flex: 1,
	  },
	  block1: {
		backgroundImage: `url(${s3ImageURL("ui/leia-banner.webp")})`,
		marginRight: '-152px',
		'@media (max-width:800px)': { marginRight: 0, },
	  },
	  block2: {
		backgroundImage: `url(${s3ImageURL("ui/boba-banner.webp")})`,
		'@media (max-width:1200px)': { marginLeft: '-2px', },
		'@media (max-width:800px)': { display: 'none', },
	  },
	  block3: {
		backgroundImage: `url(${s3ImageURL("ui/kylo-banner.webp")})`,
		marginLeft: '-152px',
		'@media (max-width:1200px)': { display: 'none', },
	  },
	  block4: {
		backgroundImage: "url('/luke-sor.jpg')",
		marginLeft: '-152px',
		'@media (max-width:1600px)': { display: 'none', },
	  },
	};

	return (
			<Box sx={styles.bannerContainerStyle}>
			<Box sx={styles.textBoxStyle}>
				<Typography variant="h1" sx={styles.titleheader}>KARABAST</Typography>
				<Typography variant="body1" sx={styles.subheader}>The Fan-Made, Open-Source</Typography>
				<Typography variant="body1">Star Wars Unlimited Simulator</Typography>
			</Box>
			<Box sx={styles.homeBanner}>
				<Box sx={[styles.banner, styles.block1]} />
				<Box sx={[styles.banner, styles.block2]} />
				<Box sx={[styles.banner, styles.block3]} />
				<Box sx={[styles.banner, styles.block4]} />
			</Box>
		</Box>
	);
};

export default KarabastBanner;
