import { createTheme } from "@mui/material/styles";

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
	components: {
		MuiContainer: {
			styleOverrides: {
				root: {
					paddingLeft: "0px",
					paddingRight: "0px",
					[baseTheme.breakpoints.up("lg")]: {
						maxWidth: "100%",
					},
				},
			},
		},
		MuiCardContent: {
			styleOverrides: {
				root: {
					padding: 0,
					"&:last-child": {
						paddingBottom: 0,
					},
				},
			},
		},
		MuiCssBaseline: {
			styleOverrides: {
				body: {
					backgroundColor: baseTheme.palette.background.default,
					backgroundImage: `url('/image2.png')`,
					backgroundSize: "cover",
					backgroundPosition: "center",
					backgroundRepeat: "no-repeat",
					font: "Barlow, sans-serif",
				},
			},
		},
	},
});
