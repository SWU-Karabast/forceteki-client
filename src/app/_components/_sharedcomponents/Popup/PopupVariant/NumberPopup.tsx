'use client';

import { useGame } from '@/app/_contexts/Game.context';
import { usePopup } from '@/app/_contexts/Popup.context';
import {
    Box,
    Button,
    IconButton,
    Typography
} from '@mui/material';
import { MouseEvent, useState } from 'react';
import { BiMinus, BiPlus } from 'react-icons/bi';
import NumberSpinner from '../../NumberSpinner/NumberSpinner';
import RichText from '../../RichText/RichText';
import {
    buttonStyle,
    containerStyle,
    footerStyle,
    headerStyle,
    minimizeButtonStyle,
    textStyle,
    titleStyle,
} from '../Popup.styles';
import { NumberPopup } from '../Popup.types';

interface NumberPopupModalProps {
    data: NumberPopup;
}

export const NumberPopupModal = ({ data }: NumberPopupModalProps) => {
    const { sendGameMessage } = useGame();
    const { closePopup } = usePopup();
    const [isMinimized, setIsMinimized] = useState(false);
    const [selectedNumber, setSelectedNumber] = useState<number | null>(Math.min(data.min, data.max));
    const [inputValue, setInputValue] = useState(String(Math.min(data.min, data.max)));

    const validationMessage = (() => {
        const normalizedInput = inputValue.trim();

        if (normalizedInput === '') {
            return 'Enter a number.';
        }

        if (!/^-?\d+$/.test(normalizedInput)) {
            return 'Enter a whole number.';
        }

        const parsedValue = Number(normalizedInput);

        if (parsedValue < data.min) {
            return `Must be at least ${data.min}.`;
        }

        if (parsedValue > data.max) {
            return `Must be at most ${data.max}.`;
        }

        return null;
    })();

    const handleDone = () => {
        if (validationMessage || selectedNumber === null) {
            return;
        }

        sendGameMessage(['menuButton', Number(inputValue.trim()), data.uuid]);
        closePopup(data.uuid);
    };

    const renderPopupContent = () => {
        if (isMinimized) return null;

        return (
            <>
                {data.description && (
                    <RichText text={data.description} sx={textStyle} component={Typography}/>
                )}

                <NumberSpinner
                    min={data.min}
                    max={data.max}
                    allowOutOfRange
                    value={selectedNumber}
                    error={!!validationMessage}
                    helperText={validationMessage}
                    onValueChange={(value) => setSelectedNumber(value)}
                    onInputValueChange={setInputValue}
                />

                <Box sx={footerStyle}>
                    <Button
                        disabled={!!validationMessage}
                        onClick={handleDone}
                        sx={buttonStyle}
                        variant="contained"
                    >
                        Done
                    </Button>
                </Box>
            </>
        );
    };

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
            {renderPopupContent()}
        </Box>
    );
};
