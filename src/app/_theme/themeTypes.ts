import "@mui/material/styles";

declare module "@mui/material/styles" {
  interface TypographyVariants {
    bodyBold: React.CSSProperties; // Define your custom variant here
  }
  interface TypographyVariantsOptions {
    bodyBold?: React.CSSProperties;
  }
  interface BreakpointOverrides {
    xs: true;
    sm: true;
    md: true;
    lg: true;
    xl: true;
    xxl: true;
    xxxl: true;
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    bodyBold: true;
  }
}