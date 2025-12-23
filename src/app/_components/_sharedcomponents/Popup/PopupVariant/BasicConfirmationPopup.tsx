import { usePopup } from '@/app/_contexts/Popup.context';
import { Box, Typography } from '@mui/material';
import {
    containerStyle,
    footerStyle,
    headerStyle,
    textStyle,
    titleStyle,
} from '../Popup.styles';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { BasicConfirmationPopup } from "@/app/_components/_sharedcomponents/Popup/Popup.types";
interface ButtonProps {
    data: BasicConfirmationPopup;
}

export const BasicConfirmationPopupModule = ({ data }: ButtonProps) => {
    const { closePopup } = usePopup();


    const handleCancel = () => {
        closePopup(data.uuid);
    };
    const handleConfirm = () => {
        data.handleConfirmation();
        closePopup(data.uuid);
    }

    return (
        <Box sx={containerStyle}>
            <Box sx={headerStyle(false)}>
                <Typography sx={titleStyle}>{data.title}</Typography>
            </Box>
            <Typography sx={textStyle}>
                {data.message}
            </Typography>
            <Box sx={footerStyle}>
                <PreferenceButton
                    variant={'standard'}
                    buttonFnc={handleConfirm}
                    text={'Confirm'}
                />
                <PreferenceButton
                    variant={'concede'}
                    buttonFnc={handleCancel}
                    text={'Cancel'}
                />

            </Box>
        </Box>
    );
};