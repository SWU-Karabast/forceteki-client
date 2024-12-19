import { Box, Button, Typography } from "@mui/material";
import {
  buttonStyle,
  containerStyle,
  textStyle,
  titleStyle,
} from "../Popup.styles";
import { MulliganPopup } from "../Popup.types";

interface ButtonProps {
  data: MulliganPopup;
}

export const MulliganPopupModal = ({ data }: ButtonProps) => {
  return (
    <Box sx={containerStyle}>
      <Typography sx={titleStyle}>Would you like to mulligan?</Typography>
      <Typography sx={textStyle}>
        Mulligan will replace your initial 6 cards with another 6 new\nones.
        This action can only be done one time!
      </Typography>
      <Box sx={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
        <Button onClick={data.onDraw} sx={buttonStyle} variant="contained">
          Draw another six
        </Button>
        <Button onClick={data.onKeep} sx={buttonStyle}>
          Keep this hand
        </Button>
      </Box>
    </Box>
  );
};
