import { useGame } from '@/app/_contexts/Game.context';
import { Box, IconButton, Typography } from '@mui/material';
import { MouseEvent, useState } from 'react';
import { BiMinus, BiPlus } from 'react-icons/bi';
import GradientBorderButton from '@/app/_components/_sharedcomponents/_styledcomponents/GradientBorderButton';
import {
    containerStyle,
    headerStyle,
    minimizeButtonStyle,
    titleStyle,
} from '../../Popup.styles';
import { OptionalTriggerPopup } from '../../Popup.types';
import RichText from '../../../RichText/RichText';
import TriggerButton, { CARD_WIDTH } from '../ActionTriggerPopup/TriggerButton';

interface ButtonProps {
    data: OptionalTriggerPopup;
}

const styles = {
    modalContent: {
        display: 'flex',
        justifyContent: 'center',
        marginTop: '0.5rem',
    },
    // paired tightly with the card above and matched to its width, so the two read as one control
    passButtonRow: {
        display: 'flex',
        justifyContent: 'center',
        marginTop: '0.5rem',
    },
    passButton: {
        width: CARD_WIDTH,
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
                <>
                    <Box sx={styles.modalContent}>
                        <TriggerButton
                            text={triggerButton.label ?? triggerButton.text}
                            sourceCard={triggerButton.sourceCard}
                            hasLegalEffects
                            onClick={() => sendGameMessage([triggerButton.command, triggerButton.arg, triggerButton.uuid])}
                        />
                    </Box>
                    {passButton && (
                        <Box sx={styles.passButtonRow}>
                            <GradientBorderButton
                                sx={styles.passButton}
                                onClick={() => sendGameMessage([passButton.command, passButton.arg, passButton.uuid])}
                            >
                                <RichText text={passButton.text} />
                            </GradientBorderButton>
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
}
