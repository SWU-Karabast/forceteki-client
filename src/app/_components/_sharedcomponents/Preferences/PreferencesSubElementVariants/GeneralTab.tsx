import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Button, Divider, Link, TextField, Tooltip } from '@mui/material';
import { useUser } from '@/app/_contexts/User.context';
import { useEffect, useState } from 'react';
import { ErrorModal } from '@/app/_components/_sharedcomponents/Error/ErrorModal';
import { getUsernameChangeInfoFromServer, setUsernameOnServer } from '@/app/_utils/DeckStorageUtils';
import { validateDiscordUsername } from '@/app/_validators/UsernameValidation/UserValidation';

function GeneralTab() {
    const { user, updateUsername, anonymousUserId } = useUser();

    const [username, setUsername] = useState<string>('');
    const [errorModalOpen, setErrorModalOpen] = useState(false);
    const [errorTitle, setErrorTitle] = useState<string>('Username error');
    const [usernameChangeable, setUsernameChangeable] = useState<boolean>(false);
    const [canSubmitClientSide, setCanSubmitClientSide] = useState<boolean>(false);
    const [messageColor, setMessageColor] = useState<string | null>(null);
    const [userErrorSummary, setUserErrorSummary] = useState<string | null>(null);
    const [userUsernameInfo, setUserUsernameInfo] = useState<string | null>(null);
    const [successfulUsernameChange, setSuccesfulUsernameChange] = useState(false);
    const [deckErrorDetails, setDeckErrorDetails] = useState<string | undefined>(undefined);
    const [showTooltip, setShowTooltip] = useState(false);

    const usersId = user?.id ? user.id : anonymousUserId ? anonymousUserId : '';

    const handleCopyLink = (userId: string) => {
        navigator.clipboard.writeText(userId)
            .then(() => {
                setShowTooltip(true);
                setTimeout(() => setShowTooltip(false), 1000);
            })
            .catch(err => console.error('Failed to copy link', err));
    };

    const handleUsernameInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newUsername = event.target.value;
        setUsername(newUsername);
        setSuccesfulUsernameChange(false); // Clear success message on new input
        setDeckErrorDetails(undefined); // Clear previous server error details

        const validationError = validateDiscordUsername(newUsername);
        setUserErrorSummary(validationError);
        setCanSubmitClientSide(validationError === null && newUsername.trim() !== '');
    };

    const handleChangeUsername = async () => {
        const validationError = validateDiscordUsername(username);
        if (validationError) {
            setUserErrorSummary(validationError);
            setCanSubmitClientSide(false);
            setErrorTitle('Validation Error');
            return;
        }
        setUserErrorSummary(null);

        try {
            const newUsernameFromServer = await setUsernameOnServer(user, username.trim());
            setSuccesfulUsernameChange(true);
            setUserUsernameInfo('Username successfully changed!');
            setMessageColor('green');
            setTimeout(() => {
                setSuccesfulUsernameChange(false);
            }, 2000);
            updateUsername(newUsernameFromServer);
            getUsernameChangeInfo();
        } catch (error) {
            console.error('Error changing username:', error);
            setErrorTitle('Profile error');
            if (error instanceof Error) {
                setUserErrorSummary(error.message);
            } else {
                setUserErrorSummary('An unexpected error occurred while changing username.');
                setDeckErrorDetails('Server error when changing username. Please try again later.');
            }
            setSuccesfulUsernameChange(false);
            setCanSubmitClientSide(false);
        }
    };

    const getUsernameChangeInfo = async () => {
        if (user) {
            try {
                const result = await getUsernameChangeInfoFromServer(user);
                setUsernameChangeable(result.canChange);
                setMessageColor(result.typeOfMessage); // e.g., 'yellow', 'green', 'red'
                setUserUsernameInfo(result.message);
            } catch (err) {
                console.error('Failed to get username change info:', err);
                setUserUsernameInfo('Could not retrieve username change policy at this time.');
                setMessageColor('red');
            }
        }
    };

    useEffect(() => {
        const currentUsername = user?.username || '';
        setUsername(currentUsername);
        getUsernameChangeInfo();
        const validationError = validateDiscordUsername(currentUsername);
        setUserErrorSummary(validationError); // Show initial validation state if any
        setCanSubmitClientSide(validationError === null && currentUsername.trim() !== '');
    }, [user]); // Rerun when user object changes

    const isSubmitDisabled = !usernameChangeable || !canSubmitClientSide || username.trim() === (user?.username || '').trim();


    const styles = {
        typographyContainer: { mb: '0.5rem' },
        functionContainer: { mb: '3.5rem' },
        contentContainer: {
            display: 'flex',
            flexDirection: 'column'
        },
        identifierContainer: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
        },
        boxStyle: {
            display: 'flex',
            mt: '1em',
        },
        textFieldStyle: {
            backgroundColor: '#3B4252',
            borderTopLeftRadius:'5px',
            borderBottomLeftRadius:'5px',
            width:'20rem',
            '& .MuiInputBase-input': {
                color: '#fff',
            },
            '& .MuiInputBase-input::placeholder': {
                color: '#fff',
            },
        },
        buttonStyle:{
            backgroundColor: '#2F7DB680',
            ml:'2px',
            borderTopLeftRadius:'0px',
            borderBottomLeftRadius:'0px',
            borderTopRightRadius:'5px',
            borderBottomRightRadius:'5px',
            '&:disabled': {
                backgroundColor: '#404040',
                color:'#FFF'
            },
        },
        messageContainer: {
            mt: '0.5rem',
            minHeight: '40px',
            maxWidth: 'calc(20rem + 130px)',
        },
        errorMessageStyle: {
            color: 'var(--initiative-red)',
            fontSize: '0.875rem',
        },
        userUsernameInfoStyle: {
            color: messageColor === 'yellow' ? '#ffd54f' :
                messageColor === 'green' ? '#81c784' :
                    messageColor === 'red' ? 'var(--initiative-red)' :
                        '#B0B0B0',
            fontSize: '0.875rem',
        },
        successMessageStyle: {
            color: 'var(--selection-green)', // Ensure this CSS variable is defined
            fontSize: '0.875rem',
        },
        errorMessageLink: {
            cursor: 'pointer',
            color: 'var(--initiative-red)',
            textDecorationColor: 'var(--initiative-red)',
            ml: '4px'
        }
    };

    return (
        <>
            <Box sx={styles.functionContainer}>
                <Typography sx={styles.typographyContainer} variant={'h2'}>Profile</Typography>
                <Divider sx={{ mb: '20px' }} />
                <Box sx={styles.contentContainer}>
                    {user && (
                        <Box sx={{ mb: '30px' }}>
                            <Typography variant={'h3'}>Username</Typography>
                            <Box sx={styles.boxStyle}>
                                <TextField
                                    placeholder={user?.username || 'Enter new username'}
                                    value={username}
                                    onChange={handleUsernameInputChange}
                                    sx={styles.textFieldStyle}
                                    error={!!userErrorSummary && !successfulUsernameChange} // Show error state on field
                                />
                                <Button
                                    variant="contained"
                                    disabled={isSubmitDisabled}
                                    onClick={handleChangeUsername}
                                    sx={styles.buttonStyle}
                                >
                                    Change Username
                                </Button>
                            </Box>
                            <Box sx={styles.messageContainer}>
                                {userErrorSummary && !successfulUsernameChange ? (
                                    <Typography variant={'body2'} sx={styles.errorMessageStyle}>
                                        {userErrorSummary}
                                        {deckErrorDetails && (
                                            <Link
                                                sx={styles.errorMessageLink}
                                                onClick={() => setErrorModalOpen(true)}
                                            >Details
                                            </Link>
                                        )}
                                    </Typography>
                                ) : successfulUsernameChange ? (
                                    <Typography variant={'body2'} sx={styles.successMessageStyle}>
                                        Username successfully changed!
                                    </Typography>
                                ) : userUsernameInfo ? (
                                    <Typography variant={'body2'} sx={styles.userUsernameInfoStyle}>
                                        {userUsernameInfo}
                                    </Typography>
                                ) : null}
                            </Box>

                            <Typography variant="body2" sx={{ mt: 2, color: '#8C8C8C', fontSize: '0.85rem', maxWidth: 'calc(20rem + 130px)' }}>
                                You can change your username as many times as you want during the <strong>first week after account creation</strong>.
                                After that, you&#39;re limited to <strong>one</strong> change every <strong>month</strong>.
                            </Typography>
                        </Box>
                    )}
                    <Typography variant={'h3'} sx={{ mt: user ? 0 : '1rem' }}>Player ID</Typography>
                    <Box sx={{ ...styles.boxStyle }}>
                        <TextField
                            value={usersId}
                            sx={styles.textFieldStyle}
                        />
                        <Tooltip
                            open={showTooltip}
                            title="Copied!"
                            arrow
                            placement="top"
                        >
                            <Button variant="contained" onClick={() => handleCopyLink(usersId)} sx={styles.buttonStyle}>
                                Copy Identifier
                            </Button>
                        </Tooltip>
                    </Box>
                </Box>
            </Box>
            <ErrorModal
                open={errorModalOpen}
                onClose={() => setErrorModalOpen(false)}
                title={errorTitle}
                errors={deckErrorDetails}
            />
        </>
    );
}
export default GeneralTab;