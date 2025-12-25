'use client';
import { PopupData, PopupType, usePopup } from '@/app/_contexts/Popup.context';
import { Box, SxProps, Theme } from '@mui/material';
import React from 'react';
import {DefaultPopup, DropdownPopup, PilePopup, SelectCardsPopup} from './Popup.types';
import { DefaultPopupModal } from './PopupVariant/DefaultPopup';
import { PilePopupModal } from './PopupVariant/PilePopup';
import { SelectCardsPopupModal } from './PopupVariant/SelectCardsPopup';
import { contentStyle } from './Popup.styles';
import { useGame } from '@/app/_contexts/Game.context';
import { DropdownPopupModal } from './PopupVariant/DropdownPopup';
import { LeaveGamePopupModule } from '@/app/_components/_sharedcomponents/Popup/PopupVariant/LeaveGamePopup';

const focusHandlerStyle = (type: PopupType, data: PopupData, index: number, playerName:string, containCards?:boolean): SxProps<Theme> => ({
    zIndex: 11 + index,
    pointerEvents: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...getPopupPosition(type, data, index, playerName, containCards)
});

export const getPopupPosition = (type: PopupType, data: PopupData, index: number, playerName:string, containCards?:boolean) => {
    return {
        position: 'absolute',
        left:'50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: '80%'
    };

    // const pilePosition = {
    //     position: 'absolute',
    //     left: containCards ? '-23%' : '-30.5%',
    //     width: '100%',
    // }

    // if (type === 'pile') {
    //     if (data.uuid === `${playerName}-discard`) {
    //         return {
    //             ...pilePosition,
    //             bottom: '400px',
    //         } as const;
    //     }
    //     return {
    //         ...pilePosition,
    //         top: '350px',
    //     } as const;
    // }
    
    // return {
    //     ...basePosition,
    //     top: '150px',
    // } as const;
}

interface IPopupShellProps {
    sidebarOpen?: boolean;
}

const PopupShell: React.FC<IPopupShellProps> = ({
    sidebarOpen = false
}) => {
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
            case 'leaveGame':
                return <LeaveGamePopupModule uuid={data.uuid} />;
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

    const overlayStyle = {
        position: 'absolute',
        width: sidebarOpen ? 'calc(100% - 250px)' : '100%',
        height: '100%',
        pointerEvents: 'none',
        display: 'flex',
        zIndex: 10,
    };

    return (
        <Box sx={overlayStyle}>
            {defaultPopups.map((popup, index) => renderPopup(popup, index))}
            {nonDefaultPopups.map((popup, index) => renderPopup(popup, index))}
        </Box>
    );
};

export default PopupShell;