import { useGame } from '@/app/_contexts/Game.context';
import { Box, Typography } from '@mui/material';
import {
    containerStyle,
    footerStyle,
    headerStyle,
    textStyle,
    titleStyle,
} from '../Popup.styles';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';

interface ConcedePopupProps {
    onClose: () => void;
}

export const ConcedePopup = ({ onClose }: ConcedePopupProps) => {
    const { sendGameMessage, connectedPlayer } = useGame();

    const handleConfirm = () => {
        sendGameMessage(['concede', connectedPlayer, '']);
        onClose();
    };

    return (
        <Box sx={containerStyle}>
            <Box sx={headerStyle(false)}>
                <Typography sx={titleStyle}>Concede</Typography>
            </Box>
            <Typography sx={textStyle}>
                Do you wish to concede?
            </Typography>
            <Box sx={footerStyle}>
                <PreferenceButton
                    variant={'standard'}
                    buttonFnc={onClose}
                    text={'Cancel'}
                />
                <PreferenceButton
                    variant={'concede'}
                    buttonFnc={handleConfirm}
                    text={'Concede'}
                />
            </Box>
        </Box>
    );
};