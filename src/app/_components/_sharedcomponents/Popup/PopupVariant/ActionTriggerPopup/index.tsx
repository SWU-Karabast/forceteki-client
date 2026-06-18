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
        overflowX: 'auto',
        overflowY: 'hidden',
        paddingBottom: '0.5rem',
        marginTop: '1rem',
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
