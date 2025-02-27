import { useGame } from '@/app/_contexts/Game.context';
import { usePopup } from '@/app/_contexts/Popup.context';
import { 
    Autocomplete,
    Box,
    Button,
    IconButton,
    TextField,
    Typography
} from '@mui/material';
import { MouseEvent, useState } from 'react';
import { BiMinus, BiPlus } from 'react-icons/bi';
import {
    buttonStyle,
    containerStyle,
    footerStyle,
    headerStyle,
    minimizeButtonStyle,
    textStyle,
    titleStyle,
} from '../Popup.styles';
import { DropdownPopup } from '../Popup.types';

interface ButtonProps {
    data: DropdownPopup;
}

export const DropdownPopupModal = ({ data }: ButtonProps) => {
    const { sendGameMessage } = useGame();
    const { closePopup } = usePopup();
    const [isMinimized, setIsMinimized] = useState(false);
    const [selectedOption, setSelectedOption] = useState('');

    const handleChange = (event: React.SyntheticEvent) => {
        const selectedIndex = parseInt(
            (event.target as HTMLElement).dataset.optionIndex as string,
            10
        );
        setSelectedOption(data.options[selectedIndex]);
    };
    
    const handleDone = () => {
        sendGameMessage(['menuButton', selectedOption, data.uuid]);
        closePopup(data.uuid);
    };

    const renderPopupContent = () => {
        if (isMinimized) return null;
        return (
            <>
                {data.description && (
                    <Typography sx={textStyle}>{data.description}</Typography>
                )}

                <Autocomplete 
                    options={data.options}
                    onChange={handleChange}
                    renderInput={(params) => (
                        <TextField {...params} />
                    )}
                    sx={{ width: '50%', color: 'white' }}
                    slotProps={{ 
                        popupIndicator: { sx: { color: 'white' } },
                        clearIndicator: { sx: { color: 'white' } },
                    }}
                />

                <Box sx={footerStyle}>
                    <Button
                        onClick={handleDone}
                        disabled={selectedOption === ''}
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
