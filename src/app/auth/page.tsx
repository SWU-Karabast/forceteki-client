"use client";
import React, { useState, FormEvent } from "react";
import { Box } from "@mui/material";
import KarabastBanner from "../_components/Banner/Banner";
import Login from "../_components/Auth/Login/Login";
import SignUp from "../_components/Auth/SignUp/SignUp";

const Auth: React.FC = () => {
	// State to toggle between Login and Sign Up
	const [isLogin, setIsLogin] = useState<boolean>(true);

	// Login State Hooks
	const [loginUsername, setLoginUsername] = useState<string>("");
	const [loginPassword, setLoginPassword] = useState<string>("");
	const [rememberMe, setRememberMe] = useState<boolean>(false);

	// Sign Up State Hooks
	const [signUpEmail, setSignUpEmail] = useState<string>("");
	const [signUpPassword, setSignUpPassword] = useState<string>("");
	const [signUpConfirmPassword, setSignUpConfirmPassword] =
		useState<string>("");
	const [signUpPasswordError, setSignUpPasswordError] =
		useState<boolean>(false);
	const [signUpPasswordMatchError, setSignUpPasswordMatchError] =
		useState<boolean>(false);

	// Handle Login Submission
	const handleLoginSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		console.log("Login - Username:", loginUsername);
		console.log("Login - Password:", loginPassword);
		console.log("Login - Remember Me:", rememberMe);

		// Temporary - Simulate storing the token or credentials
		document.cookie = `user=${loginUsername}; max-age=3600; path=/`;
		// Once the back-end is ready, send credentials to an API
		// fetch("/api/login", { method: "POST", body: JSON.stringify({ username: loginUsername, password: loginPassword }) })
	};

	// Handle Sign Up Submission
	const handleSignUpSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		console.log("Sign Up - Email:", signUpEmail);
		console.log("Sign Up - Password:", signUpPassword);

		// Validate before submission
		if (!signUpPasswordError && !signUpPasswordMatchError) {
			// Simulate sign-up logic
			console.log("Sign-up successful", {
				email: signUpEmail,
				password: signUpPassword,
			});
			// Reset form or redirect as needed
		} else {
			console.log("Errors in Sign Up form", {
				signUpPasswordError,
				signUpPasswordMatchError,
			});
		}
	};

	// Handle Password Change for Sign Up
	const handleSignUpPasswordChange = (password: string) => {
		setSignUpPassword(password);
		setSignUpPasswordError(password.length < 8);
		setSignUpPasswordMatchError(password !== signUpConfirmPassword);
	};

	// Handle Confirm Password Change for Sign Up
	const handleSignUpConfirmPasswordChange = (confirmPassword: string) => {
		setSignUpConfirmPassword(confirmPassword);
		setSignUpPasswordMatchError(signUpPassword !== confirmPassword);
	};

	return (
		<Box
			sx={{
				position: "relative",
				height: "100vh",
				overflow: "hidden",
				display: "flex",
				flexDirection: "column",
			}}
		>
			{/* Banner positioned absolutely */}
			<KarabastBanner />

			{/* Conditionally render Login or Sign Up */}
			{isLogin ? (
				<Login
					username={loginUsername}
					setUsername={setLoginUsername}
					password={loginPassword}
					setPassword={setLoginPassword}
					rememberMe={rememberMe}
					setRememberMe={setRememberMe}
					handleSubmit={handleLoginSubmit}
					toggleAuth={() => setIsLogin(false)}
				/>
			) : (
				<SignUp
					email={signUpEmail}
					setEmail={setSignUpEmail}
					password={signUpPassword}
					setPassword={handleSignUpPasswordChange}
					confirmPassword={signUpConfirmPassword}
					setConfirmPassword={handleSignUpConfirmPasswordChange}
					passwordError={signUpPasswordError}
					passwordMatchError={signUpPasswordMatchError}
					handleSubmit={handleSignUpSubmit}
					toggleAuth={() => setIsLogin(true)}
				/>
			)}
		</Box>
	);
};

export default Auth;
