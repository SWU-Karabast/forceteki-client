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

interface UserMutedPopupProps {
    open: boolean;
    onClose: () => void;
}

const UserMutedPopup: React.FC<UserMutedPopupProps> = ({ open, onClose }) => {
    const { user } = useUser();

    const handleUnderstand = () => {
        if (user?.id) {
            localStorage.setItem(`mute_popup_seen_${user.id}`, 'true');
        }
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
            onClose={() => {}} // Can't close by clicking outside
            disableEscapeKeyDown
            aria-labelledby="user-muted-dialog-title"
            sx={styles.dialog}
        >
            <DialogContent>
                <Typography variant="h4" sx={styles.title} id="user-muted-dialog-title">
                    Account Temporarily Muted
                </Typography>

                <Typography variant="body1" sx={styles.message}>
                    Your account &#34;<strong>{user?.username}</strong>&#34; has been temporarily restricted
                    due to a violation of our community guidelines. During this time, you won&#39;t be able to
                    send chat messages.
                </Typography>

                <Typography variant="body1" sx={styles.message}>
                    You can still play games during this restriction. If you believe this restriction
                    was applied in error, please contact our moderation team.
                </Typography>

                <Typography>
                    For questions or appeals, reach out on our{' '}
                    <Link
                        href="https://discord.com/channels/1220057752961814568/1220057753448616038"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: 'inherit', textDecoration: 'underline' }}
                    >
                        discord channel
                    </Link>
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

export default UserMutedPopup;