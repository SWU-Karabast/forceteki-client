import { useState } from 'react';
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { unlinkSwuStatsAsync } from '@/app/_utils/ServerAndLocalStorageUtils';
import { useUser } from '@/app/_contexts/User.context';
import { getSwuStatsAuthUrl } from '@/app/_utils/swuStatsUtils';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';

type Props = {
    linked: boolean;
};

export default function LinkSwuStatsButton({ linked }: Props) {
    const theme = useTheme();
    const { user, updateSwuStatsRefreshToken } = useUser();
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const handleClick = async () => {
        if (linked) {
            setShowConfirmDialog(true);
        } else {
            window.location.href = await getSwuStatsAuthUrl();
        }
    };

    const handleConfirmUnlink = async () => {
        try {
            const result = await unlinkSwuStatsAsync(user);
            if (result) {
                updateSwuStatsRefreshToken(false);
            }
        } catch (error) {
            if (error instanceof Error) {
                alert(error.message);
            }
            console.log(error);
        } finally {
            setShowConfirmDialog(false);
        }
    };

    const handleCancelUnlink = () => {
        setShowConfirmDialog(false);
    };
    const styles = {
        dialogContainer: {
            background: 'linear-gradient(#0F1F27, #030C13) padding-box, linear-gradient(to top, #30434B, #50717D) border-box',
            color: 'white',
            padding: '2rem',
            borderRadius: '15px',
            border: '2px solid transparent',
        },
        linkButton: {
            background: linked ? 'darkgreen' : theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            fontWeight: 'bold',
            textTransform: 'none',
            borderRadius: '12px',
            px: 1,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            '&:hover': {
                background: linked ? '#003400' : theme.palette.primary.dark,
                boxShadow: '0 6px 14px rgba(0,0,0,0.25)',
            }
        }
    }


    return (
        <>
            <Button
                variant="contained"
                onClick={handleClick}
                sx={styles.linkButton}
            >
                {linked ? '⛓️‍💥 Unlink SWUstats' : '🔗 Link SWUstats'}
            </Button>

            <Dialog
                open={showConfirmDialog}
                onClose={handleCancelUnlink}
                PaperProps={{ sx: styles.dialogContainer }}
            >
                <DialogTitle id="confirm-unlink-dialog-title">
                    Confirm Unlink SWUstats
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color:'inherit' }} id="confirm-unlink-dialog-description">
                        Are you sure you want to unlink your SWUstats account?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <PreferenceButton
                        buttonFnc={handleCancelUnlink}
                        variant={'standard'}
                        text={'Cancel'}
                    >
                    </PreferenceButton>
                    <PreferenceButton
                        buttonFnc={handleConfirmUnlink}
                        variant={'concede'}
                        text={'Unlink'}
                    >
                    </PreferenceButton>
                </DialogActions>
            </Dialog>
        </>
    );
}