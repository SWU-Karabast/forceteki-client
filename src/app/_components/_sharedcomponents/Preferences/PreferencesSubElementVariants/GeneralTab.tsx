import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Button, Divider, Link, TextField, Tooltip } from '@mui/material';
import { useUser } from '@/app/_contexts/User.context';
import { useEffect, useState } from 'react';
import { ErrorModal } from '@/app/_components/_sharedcomponents/Error/ErrorModal';
import { getUsernameChangeInfoFromServer, setUsernameOnServer } from '@/app/_utils/DeckStorageUtils';

function GeneralTab() {
    const { user, updateUsername, anonymousUserId } = useUser();

    const [username, setUsername] = useState<string>('');
    const [errorModalOpen, setErrorModalOpen] = useState(false);
    const [errorTitle, setErrorTitle] = useState<string>('Username error');
    const [usernameChangeable, setUsernameChangeable] = useState<boolean>(false);
    const [messageColor, setMessageColor] = useState<string | null>(null);
    // For a short, user-friendly error message
    const [userErrorSummary, setUserErrorSummary] = useState<string | null>(null);
    const [userUsernameInfo, setUserUsernameInfo] = useState<string | null>(null);
    const [successfulUsernameChange, setSuccesfulUsernameChange] = useState(false);
    // For the raw/technical error details
    const [deckErrorDetails, setDeckErrorDetails] = useState<string | undefined>(undefined);
    const [showTooltip, setShowTooltip] = useState(false);

    const usersId = user?.id ? user.id : anonymousUserId ? anonymousUserId : ''

    const handleCopyLink = (userId: string) => {
        navigator.clipboard.writeText(userId)
            .then(() => {
                setShowTooltip(true);
                // Hide the tooltip after 1 second
                setTimeout(() => setShowTooltip(false), 1000);
            })
            .catch(err => console.error('Failed to copy link', err));
    };

    const handleChangeUsername = async () => {
        const trimmedUsername = username.trim();
        if (!trimmedUsername) {
            setErrorTitle('Validation Error');
            setUserErrorSummary('Username cannot be empty');
            return;
        }

        if (trimmedUsername.length < 3) {
            setErrorTitle('Validation Error');
            setUserErrorSummary('Username must be at least 3 characters long');
            return;
        }

        try{
            const newUsername = await setUsernameOnServer(trimmedUsername);
            setSuccesfulUsernameChange(true);
            setTimeout(() => {
                setSuccesfulUsernameChange(false);
            }, 2000);
            updateUsername(newUsername);
        }catch (error){
            console.log(error);
            setErrorTitle('Profile error');
            if(error instanceof Error) {
                setUserErrorSummary(error.message);
            } else {
                setUserErrorSummary('Error changing username');
                setDeckErrorDetails('Server error when changing username');
            }
        }
    };

    const getUsernameChangeInfo = async () => {
        if(user) {
            const result = await getUsernameChangeInfoFromServer();
            setUsernameChangeable(result.canChange);
            setMessageColor(result.typeOfMessage);
            setUserUsernameInfo(result.message);
        }
    }

    useEffect(() => {
        setUsername(user?.username ? user?.username : '');
        getUsernameChangeInfo();
    }, [user]);



    const styles = {
        typographyContainer: {
            mb: '0.5rem',
        },
        functionContainer:{
            mb:'3.5rem',
        },
        contentContainer:{
            display:'flex',
            flexDirection:'column',
        },
        identifierContainer:{
            display:'flex',
            flexDirection:'row',
            alignItems:'center',
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
        errorMessageStyle: {
            color: 'var(--initiative-red);',
            mt: '0.5rem'
        },
        userUsernameInfoStyle:{
            color: messageColor ? messageColor === 'yellow' ? '#ffd54f' : '#81c784' : 'var(--initiative-red);',
            mt: '0.5rem'
        },
        successMessageStyle: {
            color: 'var(--selection-green);',
            mt: '0.5rem'
        },
        errorMessageLink:{
            cursor: 'pointer',
            color: 'var(--selection-red);',
            textDecorationColor: 'var(--initiative-red);',
        }
    }

    return (
        <>
            <Box sx={styles.functionContainer}>
                <Typography sx={styles.typographyContainer} variant={'h2'}>Profile</Typography>
                <Divider sx={{ mb: '20px' }}/>
                <Box sx={styles.contentContainer}>
                    {user && (
                        <Box sx={{ mb:'30px' }}>
                            <Typography variant={'h3'}>Username</Typography>
                            <Box sx={styles.boxStyle}>
                                <TextField
                                    value={username}
                                    onChange={(e) => {
                                        setUsername(e.target.value);
                                        setUserErrorSummary(null);
                                        setDeckErrorDetails(undefined);
                                    }}
                                    sx={styles.textFieldStyle}
                                />
                                <Button variant="contained" disabled={!usernameChangeable} onClick={handleChangeUsername} sx={styles.buttonStyle}>
                                    Change Username
                                </Button>
                            </Box>
                            {userErrorSummary ? (
                                <Typography variant={'body1'} sx={styles.errorMessageStyle}>
                                    {userErrorSummary}{' '}
                                    { deckErrorDetails && (<Link
                                        sx={styles.errorMessageLink}
                                        onClick={() => setErrorModalOpen(true)}
                                    >Details
                                    </Link>)}
                                </Typography>
                            ): successfulUsernameChange ? (
                                <Typography variant={'body1'} sx={styles.successMessageStyle}>
                                    Username successfully changed!
                                </Typography>
                            ) : null}
                            <Typography variant={'body1'} sx={styles.userUsernameInfoStyle}>
                                {userUsernameInfo}{' '}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1, color: '#8C8C8C', fontSize: '0.85rem', maxWidth: '26rem' }}>
                                You can change your username as many times as you want during the <strong>first hour after account creation</strong>.
                                After that, you&#39;re limited to <strong>one</strong> change every <strong>4 months</strong>.
                            </Typography>
                        </Box>
                    )}
                    <Typography variant={'h3'}>Player ID</Typography>
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
