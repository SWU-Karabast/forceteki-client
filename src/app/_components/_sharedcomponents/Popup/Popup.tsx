"use client";
import { PopupData, PopupType, usePopup } from "@/app/_contexts/Popup.context";
import { Box, IconButton } from "@mui/material";
import React from "react";
import { BiMinus } from "react-icons/bi";
import { contentStyle, minimalButtonStyle, overlayStyle } from "./Popup.styles";
import { ConcedePopup, DefaultPopup, MulliganPopup } from "./Popup.types";
import { ConcededPopupModal } from "./PopupVariant/ConcedePopup";
import { DefaultPopupModal } from "./PopupVariant/DefaultPopup";
import { MulliganPopupModal } from "./PopupVariant/MulliganPopup";

const PopupShell: React.FC = () => {
  const { type, data, closePopup } = usePopup();

  if (!type || !data) return null; // No popup to display

  const renderPopup = (type: PopupType, data: PopupData) => {
    switch (type) {
      case "default":
        return <DefaultPopupModal data={data as DefaultPopup} />;
      case "mulligan":
        return <MulliganPopupModal data={data as MulliganPopup} />;
      case "concede":
        return <ConcededPopupModal data={data as ConcedePopup} />;
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
