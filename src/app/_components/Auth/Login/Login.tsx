import React from "react";
import {
	Box,
	Button,
	Card,
	CardContent,
	Checkbox,
	FormControl,
	FormControlLabel,
	Typography,
} from "@mui/material";
import Link from "next/link";
import StyledTextField from "../../_sharedcomponents/_styledcomponents/StyledTextField/StyledTextField";

const Login: React.FC<LoginProps> = ({
	username,
	setUsername,
	password,
	setPassword,
	rememberMe,
	setRememberMe,
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
			{/* Primary Card - Login Form */}
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
						Login
					</Typography>
					<form onSubmit={handleSubmit}>
						{/* Username Input */}
						<FormControl fullWidth sx={{ mb: 3 }}>
							<Typography sx={{ color: "#fff", fontSize: "1.1rem", mb: 1 }}>
								Username
							</Typography>
							<StyledTextField
								type="email"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
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
								required
							/>
						</FormControl>
						{/* Remember Me Checkbox */}
						<FormControlLabel
							control={
								<Checkbox
									sx={{
										color: "#fff",
										"&.Mui-checked": {
											color: "#fff",
										},
										transform: "scale(1.2)",
									}}
									checked={rememberMe}
									onChange={(e) => setRememberMe(e.target.checked)}
								/>
							}
							label={
								<Typography sx={{ color: "#fff", fontSize: "1rem" }}>
									Remember Me
								</Typography>
							}
							sx={{ mb: 3 }}
						/>
						{/* Submit Button */}
						<Button
							type="submit"
							variant="contained"
							sx={{
								mb: 2,
								width: "10vw",
								height: "3.5em",
								fontSize: "1.1rem",
								borderRadius: "0.5vw",
								backgroundColor: "#292929",
								display: "block",
								marginLeft: "auto",
								marginRight: "auto",
							}}
						>
							Login
						</Button>
					</form>
					{/* Forgot Password Link */}
					<Box sx={{ textAlign: "center" }}>
						<Link href="/forgot-password" passHref>
							<Typography
								sx={{
									color: "#fff",
									fontSize: ".5rem",
									textDecoration: "underline",
								}}
							>
								Forgot Password?
							</Typography>
						</Link>
					</Box>
					{/* Toggle to Sign Up */}
					<Box sx={{ textAlign: "center" }}>
						<Typography sx={{ color: "#fff", fontSize: ".7rem" }}>
							Don&apos;t have an account?
							<Button
								onClick={toggleAuth}
								sx={{
									color: "#1976d2",
									textDecoration: "underline",
									padding: 0,
									fontSize: ".7rem",
								}}
							>
								Sign Up
							</Button>
						</Typography>
					</Box>
				</CardContent>
			</Card>

			{/* Secondary Card - Remember Me Info */}
			<Card
				sx={{
					width: { xs: "90vw", sm: "70vw", md: "40vw", lg: "25vw" },
					padding: "2em",
					borderRadius: "1.5vw",
					backgroundColor: "#18325199",
					boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
				}}
			>
				<CardContent>
					<Typography
						variant="body1"
						sx={{ color: "#fff", textAlign: "left", mb: 2, fontSize: "1rem" }}
					>
						By using the Remember Me function, you consent to a cookie being
						stored in your browser for the purpose of identifying your account
						on future visits.
					</Typography>
					{/* Privacy Policy Link */}
					<Box sx={{ textAlign: "left" }}>
						<Link href="/privacy-policy" passHref>
							<Typography
								sx={{
									color: "#fff",
									fontSize: "1rem",
									textDecoration: "underline",
								}}
							>
								Privacy Policy
							</Typography>
						</Link>
					</Box>
				</CardContent>
			</Card>
		</Box>
	);
};

export default Login;
