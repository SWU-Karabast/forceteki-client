import { Theme, createTheme } from "@mui/material/styles";

export const theme: Theme = createTheme({
	palette: {
		background: {
			default: "#000000",
		},
		divider: '#353739', // Added this line to set the divider color
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
	typography: {
		fontFamily: 'var(--font-barlow), Arial, sans-serif',
		allVariants: {
			color: 'white',
			WebkitFontSmoothing: 'auto',
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
			'&:last-child': {
			  marginBottom: '0',
			},
		  },
		bodyBold: {
			fontSize: '1rem',
			fontWeight: 600,
			lineHeight: '130%',
			marginBottom: '1rem',
			color: 'white',
			fontFamily: 'var(--font-barlow), Arial, sans-serif',
		},
		body2: {
			fontSize: '0.75rem',
			fontWeight: 400,
		},
	},
	components: {
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
		MuiContainer: {
			styleOverrides: {
				root: {
					paddingLeft: "0px",
					paddingRight: "0px",
					// [baseTheme.breakpoints.up("lg")]: {
					// 	maxWidth: "100%",
					// },
				},
			},
		},
		MuiCard: {
			styleOverrides: {
				root: {
					borderRadius: ".8rem",
					padding: "1rem",
					backdropFilter: "blur(20px)",
					width: "100%",
					overflow: "auto",
				},
			},
			variants: [
				{
					props: { variant: "blue" },
					style: {
						backgroundColor: "#18325199",
					},
				},
				{
					props: { variant: "black" },
					style: {
						backgroundColor: "#000000E6",
					},
				},
			]
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
		MuiTypography: {
			defaultProps: {
				variantMapping: {
					bodyBold: "p",
				},
			},
		},
		MuiButton: {
			styleOverrides: {
			  root: {
				backgroundColor: '#292929',
				color: 'white',
				fontWeight: '600',
				fontSize: '1rem',
				textTransform: 'none',
				'&:hover': {
				  backgroundColor: '#404040',
				},
			  },
			},
		},
	},
});
