import { usePopup } from "@/app/_contexts/Popup.context";
import { Box, Button, Grid2, IconButton, Typography } from "@mui/material";
import { useState } from "react";
import { BiMinus, BiPlus } from "react-icons/bi";
import GameCard from "../../Cards/GameCard/GameCard";
import {
  buttonStyle,
  containerStyle,
  footerStyle,
  headerStyle,
  minimalButtonStyle,
  titleStyle,
} from "../Popup.styles";
import { PilePopup } from "../Popup.types";

interface ButtonProps {
  data: PilePopup;
}

export const gridContainerStyle = {
  maxHeight: "60vh",
  overflowY: "auto",
  marginTop: "1rem",
  scrollbarColor: "#537079 transparent",
  "&::-webkit-scrollbar-track": {
    boxShadow: "inset 0 0 6px rgba(0,0,0,0.00)",
    webkitBoxShadow: "inset 0 0 6px rgba(0,0,0,0.00)",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "rgba(0,0,0,.1)",
    outline: "1px solid slategrey",
  },
  scrollbarGutter: "stable",
};

export const PilePopupModal = ({ data }: ButtonProps) => {
  const { closePopup } = usePopup();

  const [isMinimized, setIsMinimized] = useState(false);

  const renderPopupContent = () => {
    if (isMinimized) return null;
    return (
      <>
        <Grid2
          container
          spacing={1}
          columnSpacing={3.5}
          alignItems={"center"}
          sx={gridContainerStyle}
        >
          {data.cards.map((card, index) => (
            <Grid2 key={index}>
              <GameCard card={card} />
            </Grid2>
          ))}
        </Grid2>

        <Box sx={footerStyle}>
          <Button onClick={() => closePopup(data.uuid)} sx={buttonStyle}>
            Done
          </Button>
        </Box>
      </>
    );
  };

  const handleMinimize = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsMinimized(!isMinimized);
  };

  return (
    <Box sx={containerStyle}>
      <Box sx={headerStyle(isMinimized)}>
        <Typography sx={titleStyle}>{data.title}</Typography>
        <IconButton
          sx={minimalButtonStyle}
          aria-label="minimize"
          onClick={handleMinimize}
        >
          {isMinimized ? <BiPlus /> : <BiMinus />}
        </IconButton>
      </Box>

      {renderPopupContent()}
    </Box>
  );
};