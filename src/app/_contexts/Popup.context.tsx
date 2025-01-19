'use client';
import React, { createContext, useContext, useCallback, useState } from 'react';
import {
    DefaultPopup,
    DropdownPopup,
    PilePopup,
    SelectCardsPopup,
} from '../_components/_sharedcomponents/Popup/Popup.types';

export type PopupData =
  | DefaultPopup
  | SelectCardsPopup
  | PilePopup
  | DropdownPopup;

export type PopupType = PopupData['type'];

export type PopupDataMap = {
    [P in PopupData as P['type']]: Omit<P, 'type'>;
};

interface PopupContextProps {
    popups: PopupData[];
    openPopup: <T extends PopupType>(type: T, data: PopupDataMap[T]) => void;
    togglePopup: <T extends PopupType>(type: T, data: PopupDataMap[T]) => void;
    closePopup: (uuid: string) => void;
    focusPopup: (uuid: string) => void;
    clearPopups: () => void;
}

const PopupContext = createContext<PopupContextProps | undefined>(undefined);

export const PopupProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [popups, setPopups] = useState<PopupData[]>([]);

    const openPopup = useCallback(<T extends PopupType>(type: T, data: PopupDataMap[T]) => {
        setPopups((prev) => {
            if (prev.some((popup) => popup.uuid === data.uuid)) return prev;
            return [...prev, { type, ...data } as PopupData];
        });
    }, []);

    const togglePopup = <T extends PopupType>(type: T, data: PopupDataMap[T]) => {
        if (popups.some((popup) => popup.uuid === data.uuid)) closePopup(data.uuid);
        else openPopup(type, data);
    }


    const closePopup = (uuid: string) => {
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

    const clearPopups = useCallback(() => {
        setPopups([]);
    }, []);

    return (
        <PopupContext.Provider
            value={{ openPopup, closePopup, focusPopup, togglePopup, clearPopups, popups }}
        >
            {children}
        </PopupContext.Provider>
    );
};

export const usePopup = () => {
    const context = useContext(PopupContext);
    if (!context) {
        throw new Error('usePopup must be used within a PopupProvider');
    }
    return context;
};