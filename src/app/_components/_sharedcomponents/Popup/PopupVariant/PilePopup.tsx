import { usePopup } from "@/app/_contexts/Popup.context";
import { Box, Button, Grid2, Typography } from "@mui/material";
import GameCard from "../../Cards/GameCard/GameCard";
import {
  buttonStyle,
  containerStyle,
  footerStyle,
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

  return (
    <Box sx={containerStyle}>
      <Typography sx={titleStyle}>{data.title}</Typography>

      <Grid2
        container
        spacing={2}
        columnSpacing={2}
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
        <Button onClick={closePopup} sx={buttonStyle}>
          Done
        </Button>
      </Box>
    </Box>
  );
};
