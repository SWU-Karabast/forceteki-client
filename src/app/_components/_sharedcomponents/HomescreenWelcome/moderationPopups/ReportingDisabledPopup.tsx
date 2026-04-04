'use client';
import {
    Typography,
    Dialog,
    DialogContent,
    DialogActions,
    Link,
} from '@mui/material';

import { useUser } from '@/app/_contexts/User.context';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';

interface ReportingDisabledPopupProps {
    open: boolean;
    onClose: () => void;
}

const ReportingDisabledPopup: React.FC<ReportingDisabledPopupProps> = ({ open, onClose }) => {
    const { user } = useUser();

    const handleUnderstand = () => {
        onClose();
    };

    const styles = {
        dialog: {
            '& .MuiDialog-paper': {
                backgroundColor: '#1E2D32',
                borderRadius: '20px',
                maxWidth: '720px',
                width: '100%',
                padding: '20px',
                border: '2px solid transparent',
                background:
                    'linear-gradient(#0F1F27, #030C13) padding-box, linear-gradient(to top, #30434B, #50717D) border-box',
            },
        },
        title: {
            color: '#DC3545',
            fontSize: '2rem',
            textAlign: 'left',
            marginBottom: '16px',
        },
        message: {
            fontSize: '1rem',
            color: '#fff',
            marginBottom: '16px'
        },
        actions: {
            justifyContent: 'center',
            padding: '16px 0',
        },
        button: {
            backgroundColor: '#2F7DB6',
            color: '#fff',
            '&:hover': { backgroundColor: '#3590D2' },
            minWidth: '140px',
        },
    } as const;

    return (
        <Dialog
            open={open}
            onClose={() => {}}
            disableEscapeKeyDown
            aria-labelledby="reporting-disabled-dialog-title"
            sx={styles.dialog}
        >
            <DialogContent>
                <Typography variant="h4" sx={styles.title} id="reporting-disabled-dialog-title">
                    Reporting Privileges Revoked
                </Typography>

                <Typography variant="body1" sx={styles.message}>
                    Your account &#34;<strong>{user?.username}</strong>&#34; has been restricted from
                    submitting bug reports and player conduct reports due to submitting one or more reports
                    that were found to be in violation of our{' '}
                    <Link
                        href="/Terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: 'inherit', textDecoration: 'underline' }}
                    >
                        code of conduct
                    </Link>.
                </Typography>

                <Typography variant="body1" sx={styles.message}>
                    If you believe this was applied in error or have questions, please reach out on our{' '}
                    <Link
                        href="https://discord.com/channels/1220057752961814568/1417680409151410226/1418301240525193348"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: 'inherit', textDecoration: 'underline' }}
                    >
                        discord player ticketing channel
                    </Link>.
                </Typography>
            </DialogContent>

            <DialogActions sx={styles.actions}>
                <PreferenceButton
                    buttonFnc={handleUnderstand}
                    text="I Understand"
                    variant="standard"
                    sx={styles.button}
                />
            </DialogActions>
        </Dialog>
    );
};

export default ReportingDisabledPopup;
