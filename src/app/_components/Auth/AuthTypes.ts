import React from "react";

export interface ILoginProps {
	handleSubmit: (provider: "google" | "discord") => void;
}

export interface IStyledTextFieldProps {
	variant?: "outlined" | "filled" | "standard";
	fullWidth?: boolean;
	value?: string | null;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	errorMessage?: string;
	[key: string]: unknown;
}
