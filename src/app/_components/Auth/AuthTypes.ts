import React from "react";

export interface IStyledTextFieldProps {
	variant?: "outlined" | "filled" | "standard";
	fullWidth?: boolean;
	value?: string | null;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	errorMessage?: string;
	[key: string]: unknown;
}
