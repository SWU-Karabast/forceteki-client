import React from "react";

export interface LoginProps {
	handleSubmit: (provider: "google" | "discord") => void;
}

export interface StyledTextFieldProps {
	variant?: "outlined" | "filled" | "standard";
	fullWidth?: boolean;
	value?: string | null;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	errorMessage?: string;
	[key: string]: unknown;
}
