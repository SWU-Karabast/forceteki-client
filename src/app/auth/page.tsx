"use client";
import React, { useState, FormEvent } from "react";
import { Box } from "@mui/material";
import KarabastBanner from "../_components/_sharedcomponents/Banner/Banner";
import Login from "../_components/Auth/Login/Login";
import SignUp from "../_components/Auth/SignUp/SignUp";
import { useUser } from "../_contexts/User.context";
import { useRouter } from "next/navigation";

const Auth: React.FC = () => {
	const router = useRouter();

	const [isLogin, setIsLogin] = useState<boolean>(true);

	// Login State Hooks
	const [loginUsername, setLoginUsername] = useState<string>("");
	const [loginPassword, setLoginPassword] = useState<string>("");
	const [rememberMe, setRememberMe] = useState<boolean>(false);

	// Sign Up State Hooks (if needed later)
	const [signUpEmail, setSignUpEmail] = useState<string>("");
	const [signUpPassword, setSignUpPassword] = useState<string>("");
	const [signUpConfirmPassword, setSignUpConfirmPassword] =
		useState<string>("");
	const [signUpPasswordError, setSignUpPasswordError] =
		useState<boolean>(false);
	const [signUpPasswordMatchError, setSignUpPasswordMatchError] =
		useState<boolean>(false);

	console.log(
		"temporary use of variables setSignUpPasswordError, setSignUpPasswordMatchError to avoid unused vars",
		setSignUpPasswordError,
		setSignUpPasswordMatchError
	);

	const { login } = useUser(); // Get the login function from UserContext

	// Handle Login Submission
	const handleLoginSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		console.log("Login - Username:", loginUsername);
		console.log("Login - Password:", loginPassword);
		console.log("Login - Remember Me:", rememberMe);

		// Simulate login and set the user in the context
		login(loginUsername);
		router.push("/"); // Redirect to the home page
		// Temporary -  storing the token or credentials (remove later)
		document.cookie = `user=${loginUsername}; max-age=3600; path=/`;
	};

	// Handle Sign Up Submission (not implemented yet)
	const handleSignUpSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		console.log("Sign Up - Email:", signUpEmail);
		console.log("Sign Up - Password:", signUpPassword);

		// Simulate sign-up logic if needed
		if (!signUpPasswordError && !signUpPasswordMatchError) {
			console.log("Sign-up successful", {
				email: signUpEmail,
				password: signUpPassword,
			});
		}
	};

	//-------------------------Styles-------------------------//

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
					setPassword={setSignUpPassword}
					confirmPassword={signUpConfirmPassword}
					setConfirmPassword={setSignUpConfirmPassword}
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
