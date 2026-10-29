import '@mui/material/styles';
import '@mui/material/Typography';
import '@mui/material/Paper';

declare module '@mui/material/styles' {
    interface TypographyVariants {
        bodyBold: React.CSSProperties; // Define your custom variant here
        tabLabel: React.CSSProperties;
    }
    interface TypographyVariantsOptions {
        bodyBold?: React.CSSProperties;
        tabLabel?: React.CSSProperties;
    }
    interface BreakpointOverrides {
        xs: true,
        sm: true,
        iphoneSE: true,
        iphone12: true,
        md: true,
        iphone14max: true,
        ipadMini: true,
        ipadAir: true,
        lg: true,
        ipadPro: true,
        desktopHD: true,
        xl: true,
        xxl: true,
        xxxl: true         
    }
}

declare module '@mui/material/Typography' {
    interface TypographyPropsVariantOverrides {
        bodyBold: true;
        tabLabel: true;
    }
}

declare module '@mui/material/Paper' {
    interface PaperPropsVariantOverrides {
        blue: true;
        black: true;  
    }
}