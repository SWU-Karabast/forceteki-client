import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Box, CardActions, Link, Tooltip,
} from '@mui/material';
import { useGame } from '@/app/_contexts/Game.context';
import { useRouter } from 'next/navigation'
import { ILobbyUserProps, ISetUpProps } from '@/app/_components/Lobby/LobbyTypes';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';
import { fetchDeckData } from '@/app/_utils/fetchDeckData';
import {
    IDeckValidationFailures,
    DeckValidationFailureReason,
} from '@/app/_validators/DeckValidation/DeckValidationTypes';
import { ErrorModal } from '@/app/_components/_sharedcomponents/Error/ErrorModal';

const SetUpCard: React.FC<ISetUpProps> = ({
    readyStatus,
    owner,
}) => {
    const { lobbyState, connectedPlayer, sendLobbyMessage } = useGame();
    const [deckLink, setDeckLink] = useState<string>('');
    const [showTooltip, setShowTooltip] = useState(false);
    const opponentUser = lobbyState ? lobbyState.users.find((u: ILobbyUserProps) => u.id !== connectedPlayer) : null;
    const connectedUser = lobbyState ? lobbyState.users.find((u: ILobbyUserProps) => u.id === connectedPlayer) : null;
    const lobbyFormat = lobbyState ? lobbyState.lobbyFormat : null;

    // For deck error display
    const [deckErrorSummary, setDeckErrorSummary] = useState<string | null>(null);
    const [deckErrorDetails, setDeckErrorDetails] = useState<IDeckValidationFailures | undefined>(undefined);
    const [displayError, setDisplayerror] = useState(false);
    const [errorModalOpen, setErrorModalOpen] = useState(false);
    const [blockError, setBlockError] = useState(false);
    // Timer ref for clearing the inline text after 5s
    const errorTextTimer = useRef<NodeJS.Timeout | null>(null);

    // Extract the player from the URL query params
    const router = useRouter();

    // ------------------------Additional functions------------------------//
    const handleStartGame = async () => {
        sendLobbyMessage(['onStartGameAsync']);
        router.push('/GameBoard');
    };
    const handleOnChangeDeck = async () => {
        console.log('Deck Link:', deckLink);
        if (!deckLink || readyStatus) return;
        const deckData = deckLink ? await fetchDeckData(deckLink, false) : null;
        console.log(deckData);
        sendLobbyMessage(['changeDeck', deckData])
    }

    const showInlineErrorTextFor5s = (deckErrors:IDeckValidationFailures) =>{
        if(errorTextTimer.current) clearTimeout(errorTextTimer.current);
        errorTextTimer.current = setTimeout(() => {
            if(!blockError) {
                setDeckErrorSummary(null);
                setDisplayerror(false);
            }else{
                setDeckErrorSummary('Deck is invalid.');
                setDeckErrorDetails(deckErrors);
            }
            // Check if there's any blocking error (not "NotImplemented")
            errorTextTimer.current = null;
        }, 5000);
    }

    // ------------------ Listen for changes to deckErrors ------------------ //
    useEffect(() => {
        if (!connectedUser?.deckErrors) {
            // No validation errors => clear any old error states
            setDeckErrorSummary(null);
            setDeckErrorDetails(undefined);
            setErrorModalOpen(false);
            setDisplayerror(false);
            setBlockError(false);
            return;
        }
        // get error messages
        const deckErrors: IDeckValidationFailures = connectedUser.deckErrors;
        const temporaryErrors: IDeckValidationFailures = connectedUser.importDeckErrors;
        // Determine if a blocking error exists (ignoring NotImplemented and temporary errors)
        const hasBlockingError = Object.entries(deckErrors).some(([reason, value]) => {
            if (reason === DeckValidationFailureReason.NotImplemented) return false;
            return Array.isArray(value) ? value.length > 0 : !!value;
        });

        if (hasBlockingError) {
            // Show a short inline error message and store the full list
            setDisplayerror(true);
            setDeckErrorSummary('Deck is invalid.');
            setDeckErrorDetails(deckErrors);
            setBlockError(true)
        }else{
            setDeckErrorSummary(null);
            setDeckErrorDetails(undefined);
            setErrorModalOpen(false);
            setDisplayerror(false);
            setBlockError(false);
        }
        if (temporaryErrors) {
            // Only 'notImplemented' or no errors => clear them out
            setDisplayerror(true);
            setDeckErrorSummary('Couldn\'t import, deck is invalid.');
            setDeckErrorDetails(temporaryErrors);
            showInlineErrorTextFor5s(deckErrors)
        }
    }, [connectedUser]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(lobbyState.connectionLink)
            .then(() => {
                setShowTooltip(true);
                // Hide the tooltip after 1 second
                setTimeout(() => setShowTooltip(false), 1000);
            })
            .catch(err => console.error('Failed to copy link', err));
    };

    // ------------------------STYLES------------------------//
    const styles = {
        setUpCard: {
            paddingLeft: '20px',
            paddingRight: '20px',
        },
        readyImg: {
            width: '15px',
            height: '15px',
            backgroundImage: `url(${readyStatus ? '/ready.png' : '/notReady.png'})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            marginTop: '7px',
            marginRight: '5px'
        },
        cardStyle: {
            height: 'fit-content',
            background: '#18325199',
            pb: '4vh',
            backgroundColor: '#000000E6',
            backdropFilter: 'blur(20px)',
        },
        textFieldStyle: {
            backgroundColor: '#fff2',
            '& .MuiInputBase-input': {
                color: '#fff',
            },
            '& .MuiInputBase-input::placeholder': {
                color: '#fff',
            },
        },
        boxStyle: {
            display: 'flex',
            justifyContent: 'flex-end',
            mt: '1em',
        },
        buttonStyle: {
            backgroundColor: '#292929',
            minWidth: '9rem',
        },
        initiativeCardStyle: {
            background: '#18325199',
            display: 'flex',
            padding: '30px',
            flexDirection: 'column',
            justifyContent: 'center',
        },
        buttonsContainerStyle: {
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
        },
        setUpTextStyle: {
            fontSize: '1.5em',
            fontWeight: '800',
            color: 'white',
            alignSelf: 'flex-start',
        },
        labelTextStyle: {
            mb: '.5em',
            mt: '1.5em',
            color: 'white',
        },
        labelTextStyleSecondary: {
            color: '#aaaaaa',
            display: 'inline',
        },
        submitButtonStyle: {
            display: 'block',
            ml: 'auto',
            mr: 'auto',
            mt: '10px',
        },
        errorMessageStyle: {
            color: 'var(--initiative-red);',
            mt: '0.5rem',
            mb: '0px'
        },
        errorMessageLink:{
            cursor: 'pointer',
            color: 'var(--selection-red);',
            textDecorationColor: 'var(--initiative-red);',
        }
    }
    return (
        <Card sx={styles.initiativeCardStyle}>
            <Typography variant="h3" sx={styles.setUpTextStyle}>
                Set Up
            </Typography>

            {!opponentUser ? (
                // If opponent is null, show "Waiting for an opponent" UI
                <CardContent sx={styles.setUpCard}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="h6" sx={{ marginTop: '6px' }}>
                            Waiting for an opponent to join
                        </Typography>
                    </Box>
                    <Box sx={styles.boxStyle}>
                        <TextField
                            fullWidth
                            sx={styles.textFieldStyle}
                            value={lobbyState ? lobbyState.connectionLink : ''}
                        />
                        <Tooltip
                            open={showTooltip}
                            title="Copied!"
                            arrow
                            placement="top"
                        >
                            <Button variant="contained" onClick={handleCopyLink} sx={styles.buttonStyle}>
                                Copy Invite Link
                            </Button>
                        </Tooltip>
                    </Box>
                </CardContent>
            ) : (
                // If opponent is not null
                <>
                    {readyStatus && opponentUser.ready && owner ? (
                        // Both are ready
                        <>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Box sx={styles.readyImg} />
                                <Typography variant="h6" sx={{ marginTop: '6px' }}>
                                    Both players are ready.
                                </Typography>
                            </Box>
                            <CardActions sx={styles.buttonsContainerStyle}>
                                <Button variant="contained" onClick={() => handleStartGame()}>
                                    Start Game
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={() => sendLobbyMessage(['setReadyStatus', !readyStatus])}
                                >
                                    {readyStatus ? 'Unready' : 'Ready'}
                                </Button>
                            </CardActions>
                        </>
                    ) : (
                        // Not both ready — show toggle-ready button
                        connectedUser && connectedUser.deck && !blockError ? (
                            <CardActions sx={styles.buttonsContainerStyle}>
                                <Box sx={styles.readyImg} />
                                <Button
                                    variant="contained"
                                    onClick={() => sendLobbyMessage(['setReadyStatus', !readyStatus])}
                                >
                                    {readyStatus ? 'Unready' : 'Ready'}
                                </Button>
                            </CardActions>

                        ) : (
                            <Typography>Please import a deck</Typography>
                        )
                    )}
                </>
            )}

            {lobbyState && (
                <>
                    <Box sx={styles.labelTextStyle}>
                        <Link href="https://www.swustats.net/" target="_blank" sx={{ color: 'lightblue' }}>
                            SWU Stats
                        </Link>{' '}
                        or{' '}
                        <Link href="https://www.swudb.com/" target="_blank" sx={{ color: 'lightblue' }}>
                            SWUDB
                        </Link>{' '}
                        or{' '}
                        <Link
                            href="https://www.sw-unlimited-db.com/"
                            target="_blank"
                            sx={{ color: 'lightblue' }}
                        >
                            SW-Unlimited-DB
                        </Link>{' '}
                        Deck Link{' '}
                        <Typography variant="body1" sx={styles.labelTextStyleSecondary}>
                            (use the URL or &apos;Deck Link&apos; button)
                        </Typography>
                    </Box>
                    <StyledTextField
                        type="url"
                        disabled={readyStatus}
                        value={deckLink}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setDeckLink(e.target.value)}
                    />
                    {(displayError || blockError) && (
                        <Typography variant={'body1'} color={'error'} sx={styles.errorMessageStyle}>
                            {deckErrorSummary}{' '}
                            {deckErrorDetails && (
                                <Link
                                    sx={styles.errorMessageLink}
                                    onClick={() => setErrorModalOpen(true)}
                                >
                                    Details
                                </Link>
                            )}
                        </Typography>
                    )}
                    <Button
                        type="button"
                        onClick={handleOnChangeDeck}
                        variant="contained"
                        disabled={readyStatus}
                        sx={styles.submitButtonStyle}
                    >
                        Change Deck
                    </Button>
                </>
            )}
            {deckErrorDetails && (
                <ErrorModal
                    title="Deck Validation Error"
                    open={errorModalOpen}
                    onClose={() => setErrorModalOpen(false)}
                    errors={deckErrorDetails}
                    format={lobbyFormat}
                />
            )}
        </Card>
    )
};

export default SetUpCard;
