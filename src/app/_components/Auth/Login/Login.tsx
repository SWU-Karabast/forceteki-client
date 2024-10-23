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
	//------------------------STYLES------------------------//

	const containerStyle = {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		pt: "12em",
	};

	const primaryCardStyle = {
		width: { xs: "90vw", sm: "70vw", md: "60vw", lg: "30vw" },
		p: "2.5em",
		borderRadius: "1.5em",
		backgroundColor: "#000000E6",
		backdropFilter: "blur(20px)",
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

	const checkboxStyle = {
		color: "#fff",
		"&.Mui-checked": {
			color: "#fff",
		},
	};

	const checkboxLabelStyle = {
		color: "#fff",
		fontSize: "1rem",
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

	const forgotPasswordStyle = {
		color: "#fff",
		fontSize: ".5rem",
		textDecoration: "underline",
	};

	const toggleSignUpTextStyle = {
		color: "#fff",
		fontSize: ".7rem",
	};

	const toggleButtonStyle = {
		color: "#1976d2",
		textDecoration: "underline",
		fontSize: ".7rem",
	};

	const secondaryCardStyle = {
		borderRadius: "1.5em",
		backgroundColor: "#18325199",
		width: { xs: "90vw", sm: "70vw", md: "40vw", lg: "25vw" },
		boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
		p: "2em",
	};

	const secondaryTextStyle = {
		fontFamily: "var(--font-barlow), sans-serif",
		fontSize: "1em",
		textAlign: "left",
		color: "#fff",
		mb: 2,
	};

	const privacyPolicyLinkStyle = {
		fontFamily: "var(--font-barlow), sans-serif",
		fontSize: "1em",
		textDecoration: "underline",
		color: "#fff",
	};

	//------------------------RETURN------------------------//

	return (
		<Box sx={containerStyle}>
			{/* Primary Card - Login Form */}
			<Card sx={primaryCardStyle}>
				<CardContent>
					<Typography variant="h3" sx={headingStyle}>
						Login
					</Typography>
					<form onSubmit={handleSubmit}>
						{/* Username Input */}
						<FormControl fullWidth sx={formControlStyle}>
							<Typography sx={labelTextStyle}>Username</Typography>
							<StyledTextField
								type="email"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
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
								required
							/>
						</FormControl>
						{/* Remember Me Checkbox */}
						<FormControlLabel
							control={
								<Checkbox
									sx={checkboxStyle}
									checked={rememberMe}
									onChange={(e) => setRememberMe(e.target.checked)}
								/>
							}
							label={
								<Typography sx={checkboxLabelStyle}>Remember Me</Typography>
							}
							sx={{ mb: 3 }}
						/>
						{/* Submit Button */}
						<Button type="submit" variant="contained" sx={submitButtonStyle}>
							Login
						</Button>
					</form>
					{/* Forgot Password Link */}
					<Box sx={{ textAlign: "center" }}>
						<Link href="/forgot-password" passHref>
							<Typography sx={forgotPasswordStyle}>Forgot Password?</Typography>
						</Link>
					</Box>
					{/* Toggle to Sign Up */}
					<Box sx={{ textAlign: "center" }}>
						<Typography sx={toggleSignUpTextStyle}>
							Don&apos;t have an account?
							<Button onClick={toggleAuth} sx={toggleButtonStyle}>
								Sign Up
							</Button>
						</Typography>
					</Box>
				</CardContent>
			</Card>

			{/* Secondary Card - Remember Me Info */}
			<Card sx={secondaryCardStyle}>
				<CardContent>
					<Typography sx={secondaryTextStyle}>
						By using the Remember Me function, you consent to a cookie being
						stored in your browser for the purpose of identifying your account
						on future visits.
					</Typography>
					{/* Privacy Policy Link */}
					<Box sx={{ textAlign: "left" }}>
						<Link href="/privacy-policy" passHref>
							<Typography sx={privacyPolicyLinkStyle}>
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
