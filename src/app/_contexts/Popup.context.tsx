"use client";
import React, { createContext, useContext, useState } from "react";
import {
  ConcedePopup,
  DefaultPopup,
  MulliganPopup,
} from "../_components/_sharedcomponents/Popup/Popup.types";

// TODO: SelectCardsPopup | LeaderAbilityPopup | DrawPopup | SelectCardsWithAspectPopup
export type PopupData = DefaultPopup | MulliganPopup | ConcedePopup;

export type PopupType = PopupData["type"];

export type PopupDataMap = {
  default: Omit<DefaultPopup, "type">;
  mulligan: Omit<MulliganPopup, "type">;
  concede: Omit<ConcedePopup, "type">;
};

interface PopupContextProps {
  type?: PopupType;
  data?: PopupData;
  openPopup: <T extends PopupType>(type: T, data: PopupDataMap[T]) => void;
  closePopup: () => void;
}

const PopupContext = createContext<PopupContextProps | undefined>(undefined);

export const PopupProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [type, setType] = useState<PopupType | undefined>(undefined);
  const [data, setData] = useState<PopupData | undefined>(undefined);

  const openPopup = <T extends PopupType>(type: T, data: PopupDataMap[T]) => {
    setType(type);
    setData({ type, ...data } as PopupData);
  };

  const closePopup = () => {
    console.log("Closing popup");
    setType(undefined);
    setData(undefined);
  };

  return (
    <PopupContext.Provider value={{ type, data, openPopup, closePopup }}>
      {children}
    </PopupContext.Provider>
  );
};

export const usePopup = () => {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error("usePopup must be used within a PopupProvider");
  }
  return context;
};
