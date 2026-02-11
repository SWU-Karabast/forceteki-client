import { Theme, createTheme } from '@mui/material/styles';

export const theme: Theme = createTheme({
    palette: {
        background: {
            default: '#000000',
        },
        divider: '#353739', // Added this line to set the divider color
        text: {
            primary: '#fff',
            secondary: '#fff'
        }
    },
    breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            iphoneSE: 667,
            iphone12: 844,
            md: 900,
            iphone14max: 932,
            ipadMini: 1024,
            ipadAir: 1180,
            lg: 1200,
            ipadPro: 1366,
            desktopHD: 1600,
            xl: 1920,
            xxl: 2560,
            xxxl: 3840
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
            styleOverrides: (theme) => ({
                ':root': {
                    '--selection-green': '#72F979',
                    '--selection-red': '#FF0D0D',
                    '--selection-yellow': '#FFFE50',
                    '--selection-purple': '#C604C6',
                    '--selection-blue': '#66E5FF',
                    '--selection-grey': '#9DB4A0',
                    '--initiative-blue': '#00BAFF',
                    '--initiative-red': '#FF3231',
                    '--font-size-xs': '10px',
                    '--font-size-sm': '12px',
                    '--font-size-md': '14px',
                    '--font-size-lg': '17px',
                    '--font-size-xl': '18px',
                },
                html: {
                    fontSize: 'var(--font-size-md)', // Default to medium
                    [theme.breakpoints.down('sm')]: {
                        fontSize: 'var(--font-size-xs)',
                    },
                    [theme.breakpoints.between('sm', 'md')]: {
                        fontSize: 'var(--font-size-sm)',
                    },
                    [theme.breakpoints.between('md', 'lg')]: {
                        fontSize: 'var(--font-size-md)',
                    },
                    [theme.breakpoints.between('lg', 'xl')]: {
                        fontSize: 'var(--font-size-lg)',
                    },
                    [theme.breakpoints.up('xl')]: {
                        fontSize: 'var(--font-size-xl)',
                    },
                },
                body: {
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundImage: 'url(/default-background.webp)',
                    maxWidth: '100%',
                    height: '100%',
                    margin: '0',

                },
                b: {
                    fontWeight: 600,
                },
                '::-webkit-scrollbar': {
                    width: '2px',
                    height: '2px',
                },
                '::-webkit-scrollbar-thumb': {
                    backgroundColor: '#D3D3D3B3',
                    borderRadius: '2px',
                },
                '::-webkit-scrollbar-button': {
                    height: '10px',
                },
            }),
        },
        MuiContainer: {
            styleOverrides: {
                root: {
                    paddingLeft: '0px',
                    paddingRight: '0px',
                    // [baseTheme.breakpoints.up("lg")]: {
                    // 	maxWidth: "100%",
                    // },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: '.8rem',
                    width: '100%',
                    overflow: 'auto',
                },
            },
            variants: [
                {
                    props: { variant: 'blue' },
                    style: {
                        backgroundColor: '#18325199',
                        padding: '1.5rem',
                        backdropFilter: 'blur(20px)',
                    },
                },
                {
                    props: { variant: 'black' },
                    style: {
                        backgroundColor: 'rgba(10, 14, 20, 0.75)',
                        padding: '1.5rem',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
                    },
                },
            ]
        },
        MuiCardContent: {
            styleOverrides: {
                root: {
                    padding: 0,
                    '&:last-child': {
                        paddingBottom: 0,
                    },
                },
            },
        },
        MuiTypography: {
            defaultProps: {
                variantMapping: {
                    bodyBold: 'p',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    background: 'linear-gradient(135deg, #2a2f3a 0%, #1a1f2a 100%)',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '1rem',
                    textTransform: 'none',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    transition: 'all 0.25s ease',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #353b48 0%, #252b38 100%)',
                        borderColor: 'rgba(112, 251, 110, 0.3)',
                        boxShadow: '0 0 12px rgba(112, 251, 110, 0.1)',
                    },

                    '&:disabled': {
                        color: '#444',
                        borderColor: 'rgba(255, 255, 255, 0.03)',
                    },
                },
            },
        },
        MuiSelect: {
            defaultProps: {
                size: 'small',
            },
            styleOverrides: {
                select: {
                    backgroundColor: '#394452',
                    color: 'white',
                    '&:hover': {
                        backgroundColor: '#4C5C71',
                    },
                    '&:focus': {
                        borderRadius: '5px',
                    },
                },
                icon: {
                    color: 'white',
                },
            },
        },
        MuiTextField: {
            defaultProps: {
                size: 'small', // Set the default size to 'small' for TextField components
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: '5px',
                    backgroundColor: '#394452',
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'transparent',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'transparent',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#7286A0',
                    },
                },
                input: {
                    color: 'white',
                    '&::placeholder': {
                        color: 'white',
                    },
                },
            },
        },
        MuiMenu: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#394452',
                    borderRadius: '5px',
                },
            },
        },
        MuiMenuItem: {
            styleOverrides: {
                root: {
                    color: 'white',
                    '&:hover': {
                        backgroundColor: '#4C5C71',
                    },
                    '&.Mui-selected, &.Mui-selected:hover, &.Mui-selected:focus': {
                        backgroundColor: '#4C5C71',
                    },
                    '&:first-of-type': {
                        borderTopLeftRadius: '5px',
                        borderTopRightRadius: '5px',
                    },
                    '&:last-of-type': {
                        borderBottomLeftRadius: '5px',
                        borderBottomRightRadius: '5px',
                    },
                },
            },
        },
        MuiAutocomplete: {
            styleOverrides: {
                input: {
                    textAlign: 'center',
                },
                listbox: {
                    backgroundColor: '#394452',
                },
                option: {
                    '&:hover': {
                        backgroundColor: '#4C5C71'
                    },
                },
            }
        },

    },
});
