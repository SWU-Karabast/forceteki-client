"use client";
import { PopupData, PopupType, usePopup } from "@/app/_contexts/Popup.context";
import { Box, IconButton } from "@mui/material";
import React from "react";
import { BiMinus } from "react-icons/bi";
import { contentStyle, minimalButtonStyle, overlayStyle } from "./Popup.styles";
import { DefaultPopup, PilePopup, SelectCardsPopup } from "./Popup.types";
import { DefaultPopupModal } from "./PopupVariant/DefaultPopup";
import { PilePopupModal } from "./PopupVariant/PilePopup";
import { SelectCardsPopupModal } from "./PopupVariant/SelectCardsPopup";

const PopupShell: React.FC = () => {
  const { type, data, closePopup } = usePopup();

  if (!type || !data) return null; // No popup to display

  const renderPopup = (type: PopupType, data: PopupData) => {
    switch (type) {
      case "default":
        return <DefaultPopupModal data={data as DefaultPopup} />;
      case "pile":
        return <PilePopupModal data={data as PilePopup} />;
      case "select":
        return <SelectCardsPopupModal data={data as SelectCardsPopup} />;
      default:
        return null;
    }
  };

  return (
    <Box sx={overlayStyle}>
      <Box sx={contentStyle}>
        <IconButton
          sx={minimalButtonStyle}
          aria-label="minimize"
          onClick={closePopup}
        >
          <BiMinus />
        </IconButton>
        {renderPopup(type, data)}
      </Box>
    </Box>
  );
};

export default PopupShell;
