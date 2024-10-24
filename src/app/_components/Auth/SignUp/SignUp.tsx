import React from "react";
import {
	Box,
	Button,
	Card,
	CardContent,
	FormControl,
	Typography,
} from "@mui/material";
import StyledTextField from "../../_sharedcomponents/_styledcomponents/StyledTextField/StyledTextField";

const SignUp: React.FC<SignUpProps> = ({
	email,
	setEmail,
	password,
	setPassword,
	confirmPassword,
	setConfirmPassword,
	passwordError,
	passwordMatchError,
	handleSubmit,
	toggleAuth,
}) => {
	//------------------------STYLES------------------------//

	const containerStyle = {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		pt: "12em",
	};

	const cardStyle = {
		width: { xs: "90vw", sm: "70vw", md: "60vw", lg: "30vw" },
		borderRadius: "1.5em",
		backgroundColor: "#000000E6",
		backdropFilter: "blur(20px)",
		p: "2.5em",
		mb: "2em",
	};
	const headingStyle = {
		fontFamily: "var(--font-barlow), sans-serif",
		fontWeight: "800",
		fontSize: "2em",
		color: "#fff",
		mb: ".5em",
	};

	const formControlStyle = {
		mb: ".5em",
	};

	const labelTextStyle = {
		fontFamily: "var(--font-barlow), sans-serif",
		fontSize: "1.3em",
		color: "#fff",
		mb: ".5em",
	};

	const submitButtonStyle = {
		display: "block",
		width: "10em",
		height: "3em",
		borderRadius: "0.5em",
		backgroundColor: "#292929",
		fontFamily: "var(--font-barlow), sans-serif",
		fontSize: "1.2em",
		ml: "auto",
		mr: "auto",
		mb: ".8em",
		"&:hover": {
			backgroundColor: "#3a3a3a",
		},
	};
	const toggleTextStyle = {
		color: "#fff",
		fontSize: ".7rem",
	};

	const toggleButtonStyle = {
		color: "#1976d2",
		textDecoration: "underline",
		fontSize: ".7rem",
	};

	return (
		<Box sx={containerStyle}>
			<Card sx={cardStyle}>
				<CardContent>
					<Typography variant="h4" sx={headingStyle}>
						Sign Up
					</Typography>
					<form onSubmit={handleSubmit}>
						{/* Email Input */}
						<FormControl fullWidth sx={formControlStyle}>
							<Typography sx={labelTextStyle}>Email</Typography>
							<StyledTextField
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</FormControl>

						{/* Password Input */}
						<FormControl fullWidth sx={formControlStyle}>
							<Typography sx={labelTextStyle}>Password</Typography>
							<StyledTextField
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								errorMessage={
									passwordError ? "Password must be at least 8 characters" : ""
								}
								required
							/>
						</FormControl>

						{/* Confirm Password Input */}
						<FormControl fullWidth sx={formControlStyle}>
							<Typography sx={labelTextStyle}>Confirm Password</Typography>
							<StyledTextField
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								errorMessage={
									passwordMatchError ? "Passwords do not match" : ""
								}
								required
							/>
						</FormControl>

						{/* Submit Button */}
						<Button type="submit" variant="contained" sx={submitButtonStyle}>
							Sign Up
						</Button>
					</form>
					{/* Toggle to Login */}
					<Box sx={{ textAlign: "center", mt: 2 }}>
						<Typography sx={toggleTextStyle}>
							Already have an account?{" "}
							<Button onClick={toggleAuth} sx={toggleButtonStyle}>
								Login
							</Button>
						</Typography>
					</Box>
				</CardContent>
			</Card>
		</Box>
	);
};

export default SignUp;
