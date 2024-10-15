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
	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				paddingTop: "20vh",
			}}
		>
			<Card
				sx={{
					width: { xs: "90vw", sm: "70vw", md: "40vw", lg: "25vw" },
					padding: "2.5em",
					borderRadius: "1.5vw",
					backgroundColor: "rgba(0, 0, 0, 0.9)",
					mb: 4,
				}}
			>
				<CardContent>
					<Typography
						variant="h4"
						sx={{ color: "#fff", mb: 3, fontWeight: "bold" }}
					>
						Sign Up
					</Typography>
					<form onSubmit={handleSubmit}>
						{/* Email Input */}
						<FormControl fullWidth sx={{ mb: 3 }}>
							<Typography sx={{ color: "#fff", fontSize: "1.1rem", mb: 1 }}>
								Email
							</Typography>
							<StyledTextField
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								errorMessage={
									passwordError ? "Password must be at least 8 characters" : ""
								}
								required
							/>
						</FormControl>

						{/* Password Input */}
						<FormControl fullWidth sx={{ mb: 3 }}>
							<Typography sx={{ color: "#fff", fontSize: "1.1rem", mb: 1 }}>
								Password
							</Typography>
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
						<FormControl fullWidth sx={{ mb: 3 }}>
							<Typography sx={{ color: "#fff", fontSize: "1.1rem", mb: 1 }}>
								Confirm Password
							</Typography>
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
						<Button
							type="submit"
							variant="contained"
							color="primary"
							sx={{
								mb: 2,
								height: "3.5em",
								fontSize: "1.1rem",
								borderRadius: "0.5vw",
								backgroundColor: "#292929",
								width: "10vw",
								mx: "auto",
								display: "block",
							}}
						>
							Sign Up
						</Button>
					</form>
					{/* Toggle to Login */}
					<Box sx={{ textAlign: "center", mt: 2 }}>
						<Typography sx={{ color: "#fff", fontSize: ".7rem" }}>
							Already have an account?{" "}
							<Button
								onClick={toggleAuth}
								sx={{
									color: "#1976d2",
									textDecoration: "underline",
									padding: 0,
									fontSize: ".7rem",
								}}
							>
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
