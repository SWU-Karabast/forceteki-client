import { useGame } from '@/app/_contexts/Game.context';
import { Box, IconButton, Typography } from '@mui/material';
import { MouseEvent, useState } from 'react';
import { BiMinus, BiPlus } from 'react-icons/bi';
import {
    containerStyle,
    headerStyle,
    minimizeButtonStyle,
    titleStyle,
} from '../../Popup.styles';
import { OptionalTriggerPopup } from '../../Popup.types';
import RichText from '../../../RichText/RichText';
import TriggerOption from '../ActionTriggerPopup/TriggerOption';

interface ButtonProps {
    data: OptionalTriggerPopup;
}

const styles = {
    modalContent: {
        display: 'flex',
        justifyContent: 'center',
        marginTop: '0.5rem',
    },
};

export default function OptionalTriggerPopupModal({ data }: ButtonProps) {
    const { sendGameMessage } = useGame();
    const [isMinimized, setIsMinimized] = useState(false);

    const handleMinimize = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setIsMinimized(!isMinimized);
    };

    const triggerButton = data.buttons.find((button) => button.text.toLowerCase() === 'trigger') ?? data.buttons[0];
    const passButton = data.buttons.find((button) => button !== triggerButton);

    return (
        <Box sx={containerStyle}>
            <Box sx={headerStyle(isMinimized)}>
                <RichText text={data.title} sx={titleStyle} component={Typography} />
                <IconButton
                    sx={minimizeButtonStyle}
                    aria-label="minimize"
                    onClick={handleMinimize}
                >
                    {isMinimized ? <BiPlus /> : <BiMinus />}
                </IconButton>
            </Box>
            {!isMinimized && (
                <Box sx={styles.modalContent}>
                    <TriggerOption
                        cardText={triggerButton.label ?? triggerButton.text}
                        sourceCard={triggerButton.sourceCard}
                        hasLegalEffects
                        onTrigger={() => sendGameMessage([triggerButton.command, triggerButton.arg, triggerButton.uuid])}
                        pass={
                            passButton
                                ? {
                                    text: passButton.text,
                                    onPass: () => sendGameMessage([passButton.command, passButton.arg, passButton.uuid]),
                                }
                                : undefined
                        }
                    />
                </Box>
            )}
        </Box>
    );
}
