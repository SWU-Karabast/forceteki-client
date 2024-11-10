import { createTheme } from "@mui/material/styles";
import '../GlobalText.css';
import '../GlobalForms.css';

const baseTheme = createTheme({
	palette: {
		background: {
			default: "#000000",
		},
	},
	breakpoints: {
		values: {
			xs: 0,
			sm: 600,
			md: 900,
			lg: 1200,
			xl: 1536,
			xxl: 1920,
			xxxl: 2560,
		},
	},
});

export const theme = createTheme({

});
