import { usePopup } from '@/app/_contexts/Popup.context';
import { Box, Button, Grid2, IconButton, Typography } from '@mui/material';
import { useState } from 'react';
import { BiMinus, BiPlus } from 'react-icons/bi';
import GameCard from '../../Cards/GameCard';
import {
    buttonStyle,
    containerStyle,
    footerStyle,
    headerStyle,
    minimizeButtonStyle,
    titleStyle,
} from '../Popup.styles';
import { PilePopup } from '../Popup.types';

interface ButtonProps {
    data: PilePopup;
}

export const gridContainerStyle = {
    maxHeight: '60vh',
    overflowY: 'auto',
    marginTop: '1rem',
};

export const PilePopupModal = ({ data }: ButtonProps) => {
    const { closePopup } = usePopup();

    const [isMinimized, setIsMinimized] = useState(false);

    const renderPopupContent = () => {
        if (isMinimized) return null;
        return (
            <>
                <Grid2
                    container
                    spacing={1}
                    columnSpacing={3.5}
                    alignItems={'center'}
                    sx={gridContainerStyle}
                >
                    {data.cards.map((card, index) => (
                        <Grid2 key={index}>
                            <GameCard card={card} />
                        </Grid2>
                    ))}
                </Grid2>

                {data.cards.length === 0 && <Typography>No cards to display</Typography>}

                <Box sx={footerStyle}>
                    <Button onClick={() => closePopup(data.uuid)} sx={buttonStyle}>
                        Done
                    </Button>
                </Box>
            </>
        );
    };

    const handleMinimize = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setIsMinimized(!isMinimized);
    };

    return (
        <Box sx={containerStyle}>
            <Box sx={headerStyle(isMinimized)}>
                <Typography sx={titleStyle}>{data.title}</Typography>
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