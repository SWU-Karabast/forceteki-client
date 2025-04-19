import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Button, Divider, Link, TextField } from '@mui/material';
import { useUser } from '@/app/_contexts/User.context';
import { useEffect, useState } from 'react';
import { ErrorModal } from '@/app/_components/_sharedcomponents/Error/ErrorModal';
import { setUsernameOnServer } from '@/app/_utils/DeckStorageUtils';

function GeneralTab() {
    const { user, updateUsername } = useUser();

    const [username, setUsername] = useState<string>('');
    const [errorModalOpen, setErrorModalOpen] = useState(false);
    const [errorTitle, setErrorTitle] = useState<string>('Username error');
    // For a short, user-friendly error message
    const [deckErrorSummary, setDeckErrorSummary] = useState<string | null>(null);
    const [successfulUsernameChange, setSuccesfulUsernameChange] = useState(false);
    // For the raw/technical error details
    const [deckErrorDetails, setDeckErrorDetails] = useState<string | undefined>(undefined);

    const handleChangeUsername = async () => {
        const trimmedUsername = username.trim();
        if (!trimmedUsername) {
            setErrorTitle('Validation Error');
            setDeckErrorSummary('Username cannot be empty');
            return;
        }

        if (trimmedUsername.length < 3) {
            setErrorTitle('Validation Error');
            setDeckErrorSummary('Username must be at least 3 characters long');
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
            setDeckErrorSummary('Error changing username');
            if(error instanceof Error){
                setDeckErrorDetails(error.message);
            }else{
                setDeckErrorDetails('Server error when changing username');
            }
        }
    };

    useEffect(() => {
        setUsername(user?.username ? user?.username : '');
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
        },
        errorMessageStyle: {
            color: 'var(--initiative-red);',
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
                    <Typography variant={'h3'}>Username</Typography>
                    <Box sx={styles.boxStyle}>
                        <TextField
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value);
                                setDeckErrorSummary(null);
                                setDeckErrorDetails(undefined);
                            }}
                            sx={styles.textFieldStyle}
                        />
                        <Button variant="contained" disabled={username.length === 0 || !(user?.username != username)} onClick={handleChangeUsername} sx={styles.buttonStyle}>
                            Change username
                        </Button>
                    </Box>
                    {deckErrorSummary ? (
                        <Typography variant={'body1'} sx={styles.errorMessageStyle}>
                            {deckErrorSummary}{' '}
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
