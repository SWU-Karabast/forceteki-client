import React from "react";
import { TextField } from "@mui/material";

const StyledTextField: React.FC<StyledTextFieldProps> = ({
	errorMessage,
	...props
}) => {
	return (
		<TextField
			variant="outlined"
			fullWidth
			sx={{
				backgroundColor: "#fff",
				borderRadius: "0.5vw",
				"& .MuiOutlinedInput-root": {
					height: "3.5em",
					borderRadius: "0.5vw",
					"&.Mui-focused": {
						borderRadius: "0.5vw",
					},
					"&.Mui-error": {
						borderTopLeftRadius: "0.5vw",
						borderTopRightRadius: "0.5vw",
						borderBottomLeftRadius: 0,
						borderBottomRightRadius: 0,
					},
				},
				"& .MuiInputBase-input": {
					fontSize: "1rem",
				},
			}}
			error={!!errorMessage}
			helperText={errorMessage || ""}
			{...props}
		/>
	);
};

export default StyledTextField;
