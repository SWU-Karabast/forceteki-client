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
	return (
		<Card
			sx={{
				height: "15vh",
				background: "#18325199",
				paddingBottom: "4vh",
				backgroundColor: "rgba(0, 0, 0, 0.9)",
			}}
		>
			<CardContent>
				<Typography variant="h6" sx={{ color: "white" }}>
					Game Link
				</Typography>
				<TextField
					fullWidth
					sx={{
						color: "#fff",
						backgroundColor: "#fff2",
						"& .MuiInputBase-input::placeholder": {
							color: "#fff",
						},
					}}
					placeholder="https://properlink.com"
				/>
				<Box
					sx={{
						display: "flex",
						justifyContent: "flex-end",
						marginTop: "1vh",
					}}
				>
					<Button
						variant="contained"
						sx={{
							backgroundColor: "#292929",
						}}
					>
						Copy Invite Link
					</Button>
				</Box>
			</CardContent>
		</Card>
	);
};

export default GameLinkCard;
