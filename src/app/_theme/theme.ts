import { createTheme } from "@mui/material/styles";
import '../font.css'; // Font import and -webkit-font-smoothing override

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

	typography: {
		
		allVariants: {
			color: 'white',
			margin: 0,
		},
		h1: {
			fontSize: '1.75rem',
			fontWeight: 800,
			textTransform: 'uppercase',
		},
		h2: {
			fontSize: '1.5rem',
			fontWeight: 700,
			marginBottom: '1.25rem',
		},
		h3: {
			fontSize: '1.15rem',
			fontWeight: 600,
			marginBottom: '0rem',
		},
		h4: {
			fontSize: '1rem',
			fontWeight: 400,
			marginBottom: '0.9rem',
		},
		body1: {
			fontSize: '1rem',
			fontWeight: 400,
			lineHeight: '130%',
			marginBottom: '1rem',
		},
		body2: {
			fontSize: '0.75rem',
			fontWeight: 400,
		},
	},

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
					backgroundSize: "cover",
					backgroundPosition: "center",
					backgroundImage: "url('/gamebg.jpg')",
					maxWidth: "100%",
					height: "100%",
					margin: "0"
				},
				b: {
					fontWeight: 600,
				},
			},
		},
	},
});
