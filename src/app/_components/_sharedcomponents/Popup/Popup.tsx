'use client';
import { PopupData, PopupType, usePopup } from '@/app/_contexts/Popup.context';
import { Box, Button, SxProps, Theme } from '@mui/material';
import React from 'react';
import { DefaultPopup, PilePopup, SelectCardsPopup } from './Popup.types';
import { DefaultPopupModal } from './PopupVariant/DefaultPopup';
import { PilePopupModal } from './PopupVariant/PilePopup';
import { SelectCardsPopupModal } from './PopupVariant/SelectCardsPopup';
import { contentStyle } from './Popup.styles';
import { useGame } from '@/app/_contexts/Game.context';

const overlayStyle = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    display: 'flex',
    zIndex: 10,
};

const focusHandlerStyle = (type: PopupType, data: PopupData, index: number, playerName:string): SxProps<Theme> => ({
    zIndex: 11 + index,
    padding: 0,
    minWidth: 'auto',
    '&:hover': {
        backgroundColor: 'transparent',
    },
    pointerEvents: 'auto',
    ...getPopupPosition(type, data, index, playerName)
});

export const getPopupPosition = (type: PopupType, data: PopupData, index: number, playerName:string) => {
    const basePosition = {
        position: 'absolute',
        left: '50%',
        transform: `translate(-50%, 0) translate(0px, ${index * 10}px)`,
    };

    const pilePosition = {
        position: 'absolute',
        left: '325px',
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

    if (popups.length === 0) return null; // No popup to display

    const renderPopupContent = (type: PopupType, data: PopupData) => {
        switch (type) {
            case 'default':
                return <DefaultPopupModal data={data as DefaultPopup} />;
            case 'pile':
                return <PilePopupModal data={data as PilePopup} />;
            case 'select':
                return <SelectCardsPopupModal data={data as SelectCardsPopup} />;
            default:
                return null;
        }
    };

    const renderPopup= (popup: PopupData, index:number) => {
        return (
            <Button
                key={popup.uuid}
                disableRipple
                variant="text"
                sx={focusHandlerStyle(popup.type, popup, index, connectedPlayer)}
                onClick={() => focusPopup(popup.uuid)}
            >
                <Box sx={contentStyle(index)}>{renderPopupContent(popup.type, popup)}</Box>
            </Button>
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