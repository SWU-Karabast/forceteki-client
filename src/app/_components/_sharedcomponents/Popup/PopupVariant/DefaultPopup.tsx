import { useGame } from "@/app/_contexts/Game.context";
import { usePopup } from "@/app/_contexts/Popup.context";
import { Box, Button, Typography } from "@mui/material";
import {
  buttonStyle,
  containerStyle,
  footerStyle,
  textStyle,
  titleStyle,
} from "../Popup.styles";
import { DefaultPopup, PopupButton } from "../Popup.types";

interface ButtonProps {
  data: DefaultPopup;
}

export const DefaultPopupModal = ({ data }: ButtonProps) => {
  const { sendGameMessage } = useGame();
  const { closePopup } = usePopup();

  return (
    <Box sx={containerStyle}>
      <Typography sx={titleStyle}>{data.title}</Typography>
      {data.description && (
        <Typography sx={textStyle}>{data.description}</Typography>
      )}
      <Box sx={footerStyle}>
        {data.buttons.map((button: PopupButton, index: number) => (
          <Button
            key={`${button.uuid}:${index}`}
            sx={buttonStyle}
            variant="contained"
            onClick={() => {
              sendGameMessage([button.command, button.arg, button.uuid]);
              closePopup();
            }}
          >
            {button.text}
          </Button>
        ))}
      </Box>
    </Box>
  );
};
