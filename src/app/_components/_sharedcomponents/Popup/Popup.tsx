"use client";
import { PopupData, PopupType, usePopup } from "@/app/_contexts/Popup.context";
import { Box } from "@mui/material";
import React from "react";
import { contentStyle, overlayStyle } from "./Popup.styles";
import { DefaultPopup, PilePopup, SelectCardsPopup } from "./Popup.types";
import { DefaultPopupModal } from "./PopupVariant/DefaultPopup";
import { PilePopupModal } from "./PopupVariant/PilePopup";
import { SelectCardsPopupModal } from "./PopupVariant/SelectCardsPopup";

const PopupShell: React.FC = () => {
  const { type, data } = usePopup();

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
      <Box sx={contentStyle}>{renderPopup(type, data)}</Box>
    </Box>
  );
};

export default PopupShell;
