import { Box, Button, Typography } from "@mui/material";
import {
  buttonStyle,
  containerStyle,
  footerStyle,
  textStyle,
  titleStyle,
} from "../Popup.styles";
import { DefaultPopup } from "../Popup.types";

interface ButtonProps {
  data: DefaultPopup;
}

export const DefaultPopupModal = ({ data }: ButtonProps) => {
  return (
    <Box sx={containerStyle}>
      <Typography sx={titleStyle}>{data.title}</Typography>
      <Typography sx={textStyle}>{data.description}</Typography>
      <Box sx={footerStyle}>
        <Button onClick={data.onConfirm} sx={buttonStyle} variant="contained">
          Yes
        </Button>
        <Button onClick={data.onCancel} sx={buttonStyle}>
          No
        </Button>
      </Box>
    </Box>
  );
};
