import { useGame } from '@/app/_contexts/Game.context';
import { usePopup } from '@/app/_contexts/Popup.context';
import { Box, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import {
    containerStyle,
    footerStyle,
    headerStyle,
    textStyle,
    titleStyle,
} from '../Popup.styles';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';

interface LeaveGamePopupProps {
    uuid: string;
}

export const LeaveGamePopupModule = ({ uuid }: LeaveGamePopupProps) => {
    const { sendMessage, gameState } = useGame();
    const { closePopup } = usePopup();
    const router = useRouter();
    const hasWinner = !!gameState?.winners.length;
    const handleConfirm = () => {
        sendMessage('manualDisconnect');
        closePopup(uuid);
        router.push(`/${gameState?.undoEnabled ? '?undoTest=true' : ''}`);
    };

    const handleCancel = () => {
        closePopup(uuid);
    };

    return (
        <Box sx={containerStyle}>
            <Box sx={headerStyle(false)}>
                <Typography sx={titleStyle}>Leave Game</Typography>
            </Box>
            <Typography sx={textStyle}>
                {hasWinner ? 'Leave the game and return to homescreen?' : 'Leaving the game will concede.' }
            </Typography>
            <Box sx={footerStyle}>
                <PreferenceButton
                    variant={'standard'}
                    buttonFnc={handleCancel}
                    text={'Cancel'}
                />
                <PreferenceButton
                    variant={'concede'}
                    buttonFnc={handleConfirm}
                    text={'Leave game'}
                />

            </Box>
        </Box>
    );
};