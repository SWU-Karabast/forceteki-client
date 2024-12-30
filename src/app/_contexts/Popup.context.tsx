"use client";
import React, { createContext, useContext, useState } from "react";
import {
  DefaultPopup,
  PilePopup,
  SelectCardsPopup,
  SelectFromPilePopup,
} from "../_components/_sharedcomponents/Popup/Popup.types";

// TODO: SelectCardsPopup | LeaderAbilityPopup | DrawPopup | SelectCardsWithAspectPopup
export type PopupData =
  | DefaultPopup
  | SelectCardsPopup
  | SelectFromPilePopup
  | PilePopup;

export type PopupType = PopupData["type"];

export type PopupDataMap = {
  default: Omit<DefaultPopup, "type">;
  select: Omit<SelectCardsPopup, "type">;
  pile: Omit<PilePopup, "type">;
  "pile-select": Omit<SelectFromPilePopup, "type">;
};

interface PopupContextProps {
  popups: PopupData[];
  openPopup: <T extends PopupType>(type: T, data: PopupDataMap[T]) => void;
  closePopup: (uuid: string) => void;
  focusPopup: (uuid: string) => void;
}

const PopupContext = createContext<PopupContextProps | undefined>(undefined);

export const PopupProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [popups, setPopups] = useState<PopupData[]>([]);

  function isDefaultPopup(popup: PopupData): popup is DefaultPopup {
    return (popup as DefaultPopup)?.promptType !== undefined;
  }

  const openPopup = <T extends PopupType>(type: T, data: PopupDataMap[T]) => {
    if (popups.some((popup) => popup.uuid === data.uuid)) return;
    if (
      popups.length > 0 &&
      popups.some((popup) => isDefaultPopup(popup)) &&
      isDefaultPopup({ type, ...data } as PopupData)
    )
      return;

    console.log("Opening new popup with uuid", data.uuid);
    setPopups((prev) => [...prev, { type, ...data } as PopupData]);
  };

  const closePopup = (uuid: string) => {
    console.log("Closing popup with uuid", uuid);

    setPopups((prev) => prev.filter((popup) => popup.uuid !== uuid));
  };

  const focusPopup = (uuid: string) => {
    if (popups.length <= 1) return;
    if (popups[popups.length - 1].uuid === uuid) return;

    setPopups((prev) => {
      const index = prev.findIndex((popup) => popup.uuid === uuid);
      if (index !== -1) {
        const newPopups = [...prev];

        const [popup] = newPopups.splice(index, 1);
        newPopups.push(popup);
        return newPopups;
      }
      return prev;
    });
  };

  return (
    <PopupContext.Provider
      value={{ openPopup, closePopup, focusPopup, popups }}
    >
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
