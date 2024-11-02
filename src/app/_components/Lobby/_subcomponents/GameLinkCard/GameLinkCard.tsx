import React from "react";
import {
	Card,
	CardContent,
	Typography,
	TextField,
	Button,
	Box,
} from "@mui/material";

const GameLinkCard: React.FC = () => {
	//------------------------STYLES------------------------//

	const cardStyle = {
		height: "15vh",
		background: "#18325199",
		pb: "4vh",
		backgroundColor: "#000000E6",
		backdropFilter: "blur(20px)",
	};

	const textFieldStyle = {
		backgroundColor: "#fff2",
		"& .MuiInputBase-input": {
			color: "#fff",
		},
		"& .MuiInputBase-input::placeholder": {
			color: "#fff",
		},
	};

	const boxStyle = {
		display: "flex",
		justifyContent: "flex-end",
		mt: "1em",
	};

	const buttonStyle = {
		backgroundColor: "#292929",
	};

	return (
		<Card sx={cardStyle}>
			<CardContent>
				<Typography variant="h6" sx={{ color: "white" }}>
					Game Link
				</Typography>
				<TextField
					fullWidth
					sx={textFieldStyle}
					placeholder="https://properlink.com"
				/>
				<Box sx={boxStyle}>
					<Button variant="contained" sx={buttonStyle}>
						Copy Invite Link
					</Button>
				</Box>
			</CardContent>
		</Card>
	);
};

export default GameLinkCard;
