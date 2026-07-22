import { useGame } from '@/app/_contexts/Game.context';
import { Box, IconButton, Typography } from '@mui/material';
import { MouseEvent, useState } from 'react';
import { BiMinus, BiPlus } from 'react-icons/bi';
import {
    containerStyle,
    headerStyle,
    minimizeButtonStyle,
    textStyle,
    titleStyle,
} from '../../Popup.styles';
import { ActionTriggerPopup, PopupButton } from '../../Popup.types';
import RichText from '../../../RichText/RichText';
import TriggerButton from './TriggerButton';

interface ButtonProps {
    data: ActionTriggerPopup;
}

const styles = {
    modalContent: {
        display: 'flex',
        gap: '1rem',
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'safe center',
        // cards are all the same size and bottom-aligned; grouped cards' stacked peek + count badge
        // overflow upward into this reserved top padding so they are visible but don't shift the row.
        // Keep paddingTop just above the max stack peek (2 layers x STACK_OFFSET_PX ~= 28px) to avoid
        // dead space above the cards.
        alignItems: 'flex-end',
        overflowX: 'auto',
        overflowY: 'hidden',
        paddingTop: '1.75rem',
        paddingBottom: '0.5rem',
        marginTop: '0.25rem',
        marginBottom: '2rem',
    }
};

export default function ActionTriggerPopupModal({ data }: ButtonProps) {
    const { sendGameMessage } = useGame();
    const [isMinimized, setIsMinimized] = useState(false);

    const handleMinimize = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setIsMinimized(!isMinimized);
    };

    return (
        <Box sx={containerStyle}>
            <Box sx={headerStyle(isMinimized)}>
                <RichText text={data.title} sx={titleStyle} component={Typography}/>
                <IconButton
                    sx={minimizeButtonStyle}
                    aria-label="minimize"
                    onClick={handleMinimize}
                >
                    {isMinimized ? <BiPlus /> : <BiMinus />}
                </IconButton>
            </Box>
            {!isMinimized && (
                <>
                    {data.description && (
                        <RichText text={data.description} sx={textStyle} component={Typography}/>
                    )}
                    <Box sx={styles.modalContent}>
                        {data.buttons.map((button: PopupButton, index: number) => (
                            <TriggerButton
                                key={`${button.uuid}:${index}`}
                                text={button.text}
                                sourceCard={button.sourceCard}
                                hasLegalEffects={button.hasLegalEffects}
                                count={button.count}
                                onClick={() => {
                                    sendGameMessage([button.command, button.arg, button.uuid]);
                                }}
                            />
                        ))}
                    </Box>
                </>
            )}
        </Box>
    );
};
