import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Button, Divider, Link, TextField, Tooltip } from '@mui/material';
import { useUser } from '@/app/_contexts/User.context';
import { useEffect, useRef, useState } from 'react';
import { ErrorModal } from '@/app/_components/_sharedcomponents/Error/ErrorModal';
import { getUsernameChangeInfoFromServer, setUsernameOnServer } from '@/app/_utils/ServerAndLocalStorageUtils';
import { validateDiscordUsername } from '@/app/_validators/UsernameValidation/UserValidation';
import LinkSwuStatsButton from '@/app/_components/_sharedcomponents/SwuStats/LinkSwuStatsButton';
import MuiLink from '@mui/material/Link';
import { getMuteDisplayText } from '@/app/_utils/moderationUtils';

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
    const [muteTimeText, setMuteTimeText] = useState<string>('');

    const [swuStatsError, setSwuStatsError] = useState<boolean>(false);
    const swuStatsErrorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        const urlParams = new URLSearchParams(window.location.search);
        const swustatsStatus = urlParams.get('swustats');
        if (swustatsStatus === 'error') {
            setSwuStatsError(true);

            swuStatsErrorTimeoutRef.current = setTimeout(() => {
                setSwuStatsError(false);
            }, 5000);
        } else {
            setSwuStatsError(false);
        }
    }, []);

    useEffect(() => {
        const currentUsername = user?.username || '';
        setUsername(currentUsername);
        getUsernameChangeInfo();
        const validationError = validateDiscordUsername(currentUsername);
        setUserErrorSummary(validationError); // Show initial validation state if any
        setCanSubmitClientSide(validationError === null && currentUsername.trim() !== '');
        if (user && user.isMuted) {
            setMuteTimeText(getMuteDisplayText(user.mutedUntil));

            const interval = setInterval(() => {
                setMuteTimeText(getMuteDisplayText(user.mutedUntil));
            }, 60000);

            return () => clearInterval(interval);
        } else {
            setMuteTimeText('');
        }
    }, [user]);

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
        },
        swuStatsContainer:{
            mb:'40px'
        },
        muteNoticeContainer: {
            mt: '2rem',
            p: '1rem',
            backgroundColor: '#2D1B42',
            border: '1px solid #8B5CF6',
            borderRadius: '8px',
            maxWidth: 'calc(20rem + 130px)',
        },
        muteNoticeTitle: {
            color: '#DC3545',
            fontSize: '1rem',
            fontWeight: 'bold',
            mb: '0.5rem',
        },
        muteNoticeText: {
            color: '#E5E7EB',
            fontSize: '0.875rem',
            mb: '0.5rem',
        },
        muteTimeText: {
            color: '#C4B5FD',
            fontSize: '0.875rem',
            fontWeight: 'bold',
            mb: '0.5rem',
        },
    };

    return (
        <>
            <Box sx={styles.functionContainer}>
                <Typography sx={styles.typographyContainer} variant={'h2'}>Profile</Typography>
                <Divider sx={{ mb: '20px' }} />
                <Box sx={styles.contentContainer}>
                    {user && (
                        <Box>
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
                            <Box sx={styles.swuStatsContainer}>
                                <LinkSwuStatsButton linked={!!user.swuStatsRefreshToken}/>
                                {swuStatsError && (
                                    <Typography variant={'body2'} sx={styles.errorMessageStyle}>
                                        Failed to link to SWUStats account. If this keeps happening, please report the problem to the
                                        <MuiLink
                                            href="https://discord.com/channels/1220057752961814568/1345468050568380568"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            sx={{ ml:'4px', color: 'inherit', textDecoration: 'underline' }}
                                        >
                                            Discord
                                        </MuiLink>.
                                    </Typography>
                                )}
                            </Box>
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
                    {/* Mute Notice - Only show if user is muted */}
                    {user?.isMuted && (
                        <Box sx={styles.muteNoticeContainer}>
                            <Typography sx={styles.muteNoticeTitle}>
                                Account Temporarily Muted
                            </Typography>
                            <Typography sx={styles.muteNoticeText}>
                                Your account is temporarily muted due to a community guidelines violation.
                            </Typography>
                            {muteTimeText && (
                                <Typography sx={styles.muteTimeText}>
                                    Time remaining: {muteTimeText}
                                </Typography>
                            )}
                            <Typography sx={styles.muteNoticeText}>
                                If you believe this restriction was applied in error, you can appeal by contacting our moderation team on{' '}
                                <MuiLink
                                    href="https://discord.com/channels/1220057752961814568/1220057753448616038"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    sx={{ color: '#8B5CF6', textDecoration: 'underline' }}
                                >
                                    Discord
                                </MuiLink>.
                            </Typography>
                        </Box>
                    )}
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