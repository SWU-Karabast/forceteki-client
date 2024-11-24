import React from "react";
import { TextField } from "@mui/material";
import { StyledTextFieldProps } from "@/app/_components/Auth/AuthTypes";

const StyledTextField: React.FC<StyledTextFieldProps> = ({
	errorMessage,
	...props
}) => {
	return (
		<TextField
			variant="outlined"
			fullWidth
			error={!!errorMessage}
			helperText={errorMessage || ""}
			{...props}
		/>
	);
};

export default StyledTextField;
