import { Box, Button, Typography } from "@mui/material";
import {
  buttonStyle,
  concedeButtonStyle,
  containerStyle,
  textStyle,
  titleStyle,
} from "../Popup.styles";
import { ConcedePopup } from "../Popup.types";

interface ButtonProps {
  data: ConcedePopup;
}

export const ConcededPopupModal = ({ data }: ButtonProps) => {
  return (
    <Box sx={containerStyle}>
      <Typography sx={titleStyle}>Would you like to concede?</Typography>
      <Typography sx={textStyle}>
        Concede will end the game and declare you as the loser.
      </Typography>
      <Box sx={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
        <Button
          onClick={data.onConcede}
          sx={concedeButtonStyle}
          variant="contained"
        >
          Concede
        </Button>
        <Button onClick={data.onCancel} sx={buttonStyle}>
          Continue playing
        </Button>
      </Box>
    </Box>
  );
};
