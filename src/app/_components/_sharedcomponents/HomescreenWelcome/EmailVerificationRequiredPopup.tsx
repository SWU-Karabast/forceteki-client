'use client';
import {
    Typography,
    Dialog,
    DialogContent,
    DialogActions,
    Link,
} from '@mui/material';

import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { DiscordVerifyEmailHelpUrl, PlayerTicketingChannelUrl } from '@/app/_constants/constants';

interface EmailVerificationRequiredPopupProps {
    open: boolean;

    /** The sign-in provider whose email is not verified, e.g. `discord`. */
    provider: string | null;
    onClose: () => void;
}

const providerNames: Record<string, string> = {
    discord: 'Discord',
    google: 'Google',
};

/** Shown when a sign-in was refused because its provider has not verified the account's email address. */
const EmailVerificationRequiredPopup: React.FC<EmailVerificationRequiredPopupProps> = ({ open, provider, onClose }) => {
    const providerName = (provider && providerNames[provider]) ?? 'sign-in';

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
        link: {
            color: 'inherit',
            textDecoration: 'underline',
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
            aria-labelledby="email-verification-required-dialog-title"
            sx={styles.dialog}
        >
            <DialogContent>
                <Typography variant="h4" sx={styles.title} id="email-verification-required-dialog-title">
                    Verify Your Email to Sign In
                </Typography>

                <Typography variant="body1" sx={styles.message}>
                    Your {providerName} account doesn&#39;t have a verified email address. Karabast uses your email to
                    find and link your account, so it must be verified before you can create an account, link a new
                    sign-in, or sign in.
                </Typography>

                <Typography variant="body1" sx={styles.message}>
                    {provider === 'discord' ? (
                        <>
                            Follow Discord&#39;s guide to{' '}
                            <Link href={DiscordVerifyEmailHelpUrl} target="_blank" rel="noopener noreferrer" sx={styles.link}>
                                verifying your email
                            </Link>, then sign in again.
                        </>
                    ) : (
                        <>Add or verify the email address on your {providerName} account, then sign in again.</>
                    )}
                </Typography>

                <Typography variant="body1" sx={styles.message}>
                    If you have any issues or questions, reach out on our{' '}
                    <Link href={PlayerTicketingChannelUrl} target="_blank" rel="noopener noreferrer" sx={styles.link}>
                        discord player ticketing channel.
                    </Link>
                </Typography>
            </DialogContent>

            <DialogActions sx={styles.actions}>
                <PreferenceButton
                    buttonFnc={onClose}
                    text="I Understand"
                    variant="standard"
                    sx={styles.button}
                />
            </DialogActions>
        </Dialog>
    );
};

export default EmailVerificationRequiredPopup;
