import { Box, Typography } from '@mui/material';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import {
    containerStyle, footerStyle,
    headerStyle,
    textStyle,
    titleStyle
} from "@/app/_components/_sharedcomponents/Popup/Popup.styles";
import {createPortal} from "react-dom";
import {useEffect, useState} from "react";
interface ButtonProps {
    title: string;
    message: string;
    display: boolean;
    onConfirmation: () => void;
    handleCancel: () => void;
}

export const LobbyConfirmationPopupModule = ({ title, message, display, onConfirmation, handleCancel }: ButtonProps) => {

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const styles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
            display: 'flex',
            zIndex: 9999,
        },
        card: {
            background: 'linear-gradient(#0F1F27, #030C13) padding-box, linear-gradient(to top, #30434B, #50717D) border-box',
            border: '1px solid #444',
            borderRadius: '12px',
            padding: '2rem',
            minWidth: '420px',
            maxWidth: '700px',
        },
    }

    if (!mounted || !display) return null;

    return createPortal(
        <Box sx={styles.overlay}>
            <Box sx={styles.card}>
                <Box sx={containerStyle}>
                    <Box sx={headerStyle(false)}>
                        <Typography sx={titleStyle}>{title}</Typography>
                    </Box>
                    <Typography sx={textStyle}>
                        {message}
                    </Typography>
                    <Box sx={footerStyle}>
                        <PreferenceButton
                            variant={'standard'}
                            buttonFnc={onConfirmation}
                            text={'Confirm'}
                        />
                        <PreferenceButton
                            variant={'concede'}
                            buttonFnc={handleCancel}
                            text={'Cancel'}
                        />
                    </Box>
                </Box>
            </Box>
        </Box>,
        document.body
    );
};