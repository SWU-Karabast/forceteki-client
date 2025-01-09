'use client';
import { PopupData, PopupType, usePopup } from '@/app/_contexts/Popup.context';
import { Box, Button, SxProps, Theme } from '@mui/material';
import React from 'react';
import { DefaultPopup, DropdownPopup, PilePopup, SelectCardsPopup } from './Popup.types';
import { DefaultPopupModal } from './PopupVariant/DefaultPopup';
import { PilePopupModal } from './PopupVariant/PilePopup';
import { SelectCardsPopupModal } from './PopupVariant/SelectCardsPopup';
import { contentStyle } from './Popup.styles';
import { useGame } from '@/app/_contexts/Game.context';
import { DropdownPopupModal } from './PopupVariant/DropdownPopup';

const overlayStyle = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    display: 'flex',
    zIndex: 10,
};

const focusHandlerStyle = (type: PopupType, data: PopupData, index: number, playerName:string, containCards?:boolean): SxProps<Theme> => ({
    zIndex: 11 + index,
    pointerEvents: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...getPopupPosition(type, data, index, playerName, containCards)
});

export const getPopupPosition = (type: PopupType, data: PopupData, index: number, playerName:string, containCards?:boolean) => {
    const basePosition = {
        position: 'absolute',
        left:'50%',
        marginTop: '150px',
        transform: `translate(0px, ${index * 50}px)`,
    };

    const pilePosition = {
        position: 'absolute',
        left: containCards ? '-23%' : '-30.5%',
        width: '100%',
    }

    if (type === 'pile') {
        if (data.uuid === `${playerName}-discard`) {
            return {
                ...pilePosition,
                bottom: '400px',
            } as const;
        }
        return {
            ...pilePosition,
            top: '350px',
        } as const;
    }
    
    return {
        ...basePosition,
        top: '150px',
    } as const;
}

const PopupShell: React.FC = () => {
    const { popups, focusPopup } = usePopup();
    const { connectedPlayer }= useGame();
    const isPilePopup = (popup: PopupData): popup is PilePopup => popup.type === 'pile';

    if (popups.length === 0) return null; // No popup to display

    const renderPopupContent = (type: PopupType, data: PopupData) => {
        switch (type) {
            case 'default':
                return <DefaultPopupModal data={data as DefaultPopup} />;
            case 'pile':
                return <PilePopupModal data={data as PilePopup} />;
            case 'select':
                return <SelectCardsPopupModal data={data as SelectCardsPopup} />;
            case 'dropdown':
                return <DropdownPopupModal data={data as DropdownPopup} />;
            default:
                return null;
        }
    };

    const renderPopup= (popup: PopupData, index:number) => {
        return (
            <Box
                key={popup.uuid}
                sx={focusHandlerStyle(popup.type, popup, index, connectedPlayer, isPilePopup(popup) && popup.cards.length > 0)}
                onClick={() => focusPopup(popup.uuid)}
            >
                <Box sx={contentStyle(index)}>{renderPopupContent(popup.type, popup)}</Box>
            </Box>
        )
    }

    const [nonDefaultPopups, defaultPopups] = [
        popups.filter((popup) => popup.type !== 'default'),
        popups.filter((popup) => popup.type === 'default')
    ];

    return (
        <Box sx={overlayStyle}>
            {defaultPopups.map((popup, index) => renderPopup(popup, index))}
            {nonDefaultPopups.map((popup, index) => renderPopup(popup, index))}
        </Box>
    );
};

export default PopupShell;