"use client";
import { PopupData, PopupType, usePopup } from "@/app/_contexts/Popup.context";
import { Box, ButtonBase } from "@mui/material";
import React from "react";
import { contentStyle, overlayStyle } from "./Popup.styles";
import { DefaultPopup, PilePopup, SelectCardsPopup } from "./Popup.types";
import { DefaultPopupModal } from "./PopupVariant/DefaultPopup";
import { PilePopupModal } from "./PopupVariant/PilePopup";
import { SelectCardsPopupModal } from "./PopupVariant/SelectCardsPopup";

const PopupShell: React.FC = () => {
  const { popups, focusPopup } = usePopup();

  if (popups.length === 0) return null; // No popup to display

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

  console.log("Popups:", popups.length);

  return (
    <Box sx={overlayStyle}>
      {popups.map((popup, index) => (
        <ButtonBase
          key={popup.uuid}
          sx={contentStyle(index)}
          onClick={() => focusPopup(popup.uuid)}
        >
          <Box sx={contentStyle(index)}>{renderPopup(popup.type, popup)}</Box>
        </ButtonBase>
      ))}
    </Box>
  );
};

export default PopupShell;
