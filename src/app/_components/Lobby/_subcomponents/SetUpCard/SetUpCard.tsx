import React, { ChangeEvent, useEffect, useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Box, CardActions, Link, Tooltip, MenuItem, Checkbox, FormControlLabel, Divider
} from '@mui/material';
import { Info } from '@mui/icons-material';
import { useGame } from '@/app/_contexts/Game.context';
import { ILobbyUserProps, ISetUpProps } from '@/app/_components/Lobby/LobbyTypes';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';
import { DeckSource, fetchDeckData } from '@/app/_utils/fetchDeckData';
import {
    IDeckValidationFailures,
    DeckValidationFailureReason,
} from '@/app/_validators/DeckValidation/DeckValidationTypes';
import { ErrorModal } from '@/app/_components/_sharedcomponents/Error/ErrorModal';
import { parseInputAsDeckData } from '@/app/_utils/checkJson';
import { StoredDeck } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import {
    retrieveDecksForUser,
    saveDeckToLocalStorage,
    saveDeckToServer
} from '@/app/_utils/ServerAndLocalStorageUtils';
import { useUser } from '@/app/_contexts/User.context';
import { useSession } from 'next-auth/react';
import { SupportedDeckSources } from '@/app/_constants/constants';
import PreferenceOptionWithIcon from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceOption';

const SetUpCard: React.FC<ISetUpProps> = ({
    readyStatus,
    owner,
}) => {
    const { lobbyState, connectedPlayer, sendLobbyMessage } = useGame();
    const { user } = useUser();
    const [favouriteDeck, setFavouriteDeck] = useState<string>('');
    const [deckLink, setDeckLink] = useState<string>('');
    const [showTooltip, setShowTooltip] = useState(false);
    const [showLink, setshowLink] = useState(false)
    const [deckImportErrorsSeen, setDeckImportErrorsSeen] = useState(false);
    const opponentUser = lobbyState ? lobbyState.users.find((u: ILobbyUserProps) => u.id !== connectedPlayer) : null;
    const connectedUser = lobbyState ? lobbyState.users.find((u: ILobbyUserProps) => u.id === connectedPlayer) : null;
    const lobbyFormat = lobbyState ? lobbyState.gameFormat : null;

    const [savedDecks, setSavedDecks] = useState<StoredDeck[]>([]);
    const [saveDeck, setSaveDeck] = useState<boolean>(false);
    const { data: session } = useSession(); // Get session from next-auth

    // For deck error display
    const [deckErrorSummary, setDeckErrorSummary] = useState<string | null>(null);
    const [deckErrorDetails, setDeckErrorDetails] = useState<IDeckValidationFailures | string | undefined>(undefined);
    const [displayError, setDisplayerror] = useState(false);
    const [errorModalOpen, setErrorModalOpen] = useState(false);
    const [blockError, setBlockError] = useState(false);

    const opponentReady = opponentUser?.ready;
    const disableSettings = !owner || readyStatus || opponentReady;

    // ------------------------Additional functions------------------------//
    const handleStartGame = async () => {
        sendLobbyMessage(['onStartGameAsync']);
    };

    const handleChangeUndoSetting = async (checked: boolean) => {
        sendLobbyMessage(['updateSetting', 'requestUndo', checked]);
    };

    useEffect(() => {
        fetchDecks();
    }, []);

    // Load saved decks from localStorage
    const fetchDecks = async () => {
        try {
            await retrieveDecksForUser(session?.user,user,{ setDecks: setSavedDecks, setFirstDeck: setFavouriteDeck });
        } catch (err){
            console.log(err);
            alert('Server error when fetching decks');
        }
    };

    const handleLinkToggle = () =>{
        setshowLink(!showLink);
    }

    const handleOnChangeDeck = async () => {
        if ((!favouriteDeck && !deckLink) || readyStatus) return;
        let userDeck: string;
        // check whether the favourite deck was selected or a decklink was used. The decklink always has precedence
        setDeckImportErrorsSeen(false);
        if(favouriteDeck) {
            const selectedDeck = savedDecks.find(deck => deck.deckID === favouriteDeck);
            if (selectedDeck?.deckLink && !deckLink) {
                userDeck = selectedDeck?.deckLink
            }else{
                userDeck = deckLink;
            }
        }else{
            userDeck = deckLink;
        }
        try {
            let deckData;
            const parsedInput = parseInputAsDeckData(userDeck);
            if(parsedInput.type === 'url') {
                deckData = userDeck ? await fetchDeckData(userDeck, false) : null;
                if(favouriteDeck && deckData && !deckLink) {
                    deckData.deckID = favouriteDeck;
                    deckData.deckLink = userDeck;
                    deckData.isPresentInDb = !!user;
                }else if(deckData) {
                    deckData.deckLink = userDeck;
                    deckData.isPresentInDb = false;
                }
            }else if(parsedInput.type === 'json') {
                deckData = parsedInput.data
            }else{
                setDeckErrorSummary('Couldn\'t import. Deck is invalid or unsupported deckbuilder');
                setDeckErrorDetails('Incorrect deck format or unsupported deckbuilder.');
                setErrorModalOpen(true);
                return;
            }
            // save deck to local storage
            if (saveDeck && deckData && deckLink){
                try {
                    if(user) {
                        if(!await saveDeckToServer(deckData, deckLink, user)){
                            throw new Error('Error saving the deck to server');
                        }
                        deckData.isPresentInDb = true;
                    }else{
                        saveDeckToLocalStorage(deckData, deckLink);
                    }
                }catch (err) {
                    console.log(err);
                    setDeckErrorSummary('Server error when saving deck to server.');
                    setDeckErrorDetails('There was an error when saving deck to the server. Please contact the developer team on discord.');
                    setErrorModalOpen(true);
                }
            }

            sendLobbyMessage(['changeDeck', deckData])
        }catch (error){
            setDisplayerror(true);
            setDeckErrorDetails(undefined);
            setErrorModalOpen(true)
            if(error instanceof Error){
                if(error.message.includes('403')) {
                    setDeckErrorSummary('Couldn\'t import. The deck is set to private.');
                    setDeckErrorDetails({
                        [DeckValidationFailureReason.DeckSetToPrivate]: true,
                    });
                }else{
                    setDeckErrorSummary('Couldn\'t import. Deck is invalid.');
                }
            }
            return;
        }
    }

    // ------------------ Listen for changes to deckErrors ------------------ //
    useEffect(() => {
        // get error messages
        const deckErrors: IDeckValidationFailures = connectedUser?.deckErrors ?? [];
        const temporaryErrors: IDeckValidationFailures = connectedUser?.importDeckErrors ?? [];
        if ((!deckErrors || Object.entries(deckErrors).length === 0) && (!temporaryErrors || Object.entries(temporaryErrors).length === 0)) {
            // No validation errors => clear any old error states
            setDeckErrorSummary(null);
            setDeckErrorDetails(undefined);
            setErrorModalOpen(false);
            setDisplayerror(false);
            setBlockError(false);
            return;
        }


        // Determine if a blocking error exists (ignoring NotImplemented and temporary errors)
        // we want two errors that won't trigger the

        if (deckErrors && Object.keys(deckErrors).length > 0) {
            // Show a short inline error message and store the full list
            setDisplayerror(true);
            setDeckErrorSummary('Deck is invalid.');
            setDeckErrorDetails(deckErrors);
            setBlockError(true);

            // Check if any errors other than the specified ones exist
            const hasOtherErrors = Object.keys(deckErrors).some(key =>
                key !== DeckValidationFailureReason.MinMainboardSizeNotMet &&
                key !== DeckValidationFailureReason.MaxSideboardSizeExceeded
            );

            // Only open modal if there are validation errors besides the two excluded types
            if (hasOtherErrors) {
                setErrorModalOpen(true);
            } else {
                setErrorModalOpen(false);
            }
        }else{
            setDeckErrorSummary(null);
            setDeckErrorDetails(undefined);
            setErrorModalOpen(false);
            setDisplayerror(false);
            setBlockError(false);
        }
        if (temporaryErrors && !deckImportErrorsSeen) {
            // Only 'notImplemented' or no errors => clear them out
            setDisplayerror(true);
            setDeckErrorSummary('Couldn\'t import. Deck is invalid.');
            setDeckErrorDetails(temporaryErrors);
            setErrorModalOpen(true);
        }
    }, [connectedUser]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(lobbyState?.connectionLink)
            .then(() => {
                setShowTooltip(true);
                // Hide the tooltip after 1 second
                setTimeout(() => setShowTooltip(false), 1000);
            })
            .catch(err => console.error('Failed to copy link', err));
    };

    const handleUseForceBase = () => {
        sendLobbyMessage(['useForceBase'])
    }

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
            justifyContent: 'center',
            mt: '1em',
        },
        buttonStyle: {
            backgroundColor: '#292929',
            minWidth: '9rem',
        },
        initiativeCardStyle: {
            background: '#18325199',
            display: 'flex',
            padding: '20px',
            flexDirection: 'column',
            maxHeight: '45vh',
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
            mt:'1em',
            mb: '.5em',
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
        },
        checkboxStyle: {
            color: disableSettings ? '#b0b0b0' : '#fff', // Lighter color when disabled and unchecked
            '&.Mui-checked': {
                color: '#fff',
            },
            '&.Mui-disabled': {
                color: '#fff',
            },
            opacity: disableSettings ? 0.5 : 1, // Slightly less opacity when disabled and checked
        },
        checkboxAndRadioGroupTextStyle: {
            color: disableSettings ? '#c0c0c0' : '#fff',  // Lighter color when disabled
            fontSize: '1em',
        },
    }
    return (
        <Card sx={styles.initiativeCardStyle}>
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
                    {readyStatus && opponentReady && owner ? (
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
                        connectedUser && connectedUser.deck ? (
                            <CardActions sx={styles.buttonsContainerStyle}>
                                <Box sx={styles.readyImg} />
                                <Button
                                    disabled={blockError}
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
                    {savedDecks && !showLink ? (
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body1" sx={styles.labelTextStyle}>
                                    Favorite Decks
                                </Typography>
                                <Typography onClick={handleLinkToggle} sx={{ ...styles.labelTextStyle, color: 'lightblue', cursor:'pointer', textDecoration:'underline' }} >
                                    Import New Deck
                                </Typography>
                            </Box>
                            <StyledTextField
                                select
                                value={favouriteDeck}
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    setFavouriteDeck(e.target.value)
                                }
                                placeholder="Favorite Decks"
                            >
                                {savedDecks.length === 0 ? (
                                    <MenuItem value="" disabled>
                                        No saved decks found
                                    </MenuItem>
                                ) : (
                                    savedDecks.map((deck) => (
                                        <MenuItem key={deck.deckID} value={deck.deckID}>
                                            {deck.favourite ? '★ ' : ''}{deck.name}
                                        </MenuItem>
                                    ))
                                )}
                            </StyledTextField>
                        </Box>
                    ) : (
                        <>
                            {savedDecks && (
                                <Box sx={{ display: 'flex', justifyContent: 'end', mt: '1em' }}>
                                    <Typography onClick={handleLinkToggle} sx={{ color: 'lightblue', cursor:'pointer', textDecoration:'underline' }} >
                                        Use Favorites Deck
                                    </Typography>
                                </Box>
                            )}
                            <Box sx={styles.labelTextStyle}>
                                Deck link (
                                <Tooltip
                                    arrow={true}
                                    title={
                                        <Box sx={{ whiteSpace: 'pre-line' }}>
                                            {SupportedDeckSources.join('\n')}
                                        </Box>
                                    }
                                >
                                    <Link sx={{ color: 'lightblue', textDecoration: 'underline', textDecorationStyle: 'dotted' }}>
                                        supported deckbuilders
                                    </Link>
                                </Tooltip>
                                )
                                <br />
                                OR paste deck JSON directly
                            </Box>
                            <StyledTextField
                                type="text"
                                disabled={readyStatus}
                                value={deckLink}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                    setDeckLink(e.target.value);
                                    if (connectedUser?.deckErrors && Object.keys(connectedUser.deckErrors).length > 0) {
                                        setDisplayerror(true);
                                        setDeckErrorSummary('Deck is invalid.');
                                        setDeckErrorDetails(connectedUser.deckErrors);
                                    } else {
                                        setDisplayerror(false);
                                        setDeckErrorSummary(null);
                                        setDeckErrorDetails(undefined);
                                    }
                                }}
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        sx={styles.checkboxStyle}
                                        checked={saveDeck}
                                        onChange={(
                                            e: ChangeEvent<HTMLInputElement>,
                                            checked: boolean
                                        ) => setSaveDeck(checked)}
                                    />
                                }
                                label={
                                    <Typography sx={styles.checkboxAndRadioGroupTextStyle}>
                                        Save Deck List
                                    </Typography>
                                }
                            />
                        </>
                    )}
                    {(displayError || blockError) && (
                        <Typography variant={'body1'} color={'error'} sx={styles.errorMessageStyle}>
                            {deckErrorSummary}{' '}
                            {deckErrorDetails && (
                                <Link
                                    sx={styles.errorMessageLink}
                                    onClick={() => setErrorModalOpen(true) }
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
                        {savedDecks && !showLink ? ('Load Deck') : ('Import Deck')}
                    </Button>
                </>
            )}
            {deckErrorDetails && (
                <ErrorModal
                    title="Deck Validation Error"
                    open={errorModalOpen}
                    onClose={() => {
                        setErrorModalOpen(false)
                        setDeckImportErrorsSeen(true);
                    }}
                    errors={deckErrorDetails}
                    format={lobbyFormat}
                />
            )}
            <Divider sx={{ mt: 2, borderColor: '#666' }} />
            <Typography variant="h5" sx={{ fontSize: '1.2em', fontWeight: '600', color: 'white', mt: 2, mb: 1 }}>
                Game Settings
            </Typography>
            <FormControlLabel
                control={
                    <Checkbox
                        sx={styles.checkboxStyle}
                        checked={lobbyState.settings.requestUndo}
                        disabled={!owner || readyStatus || opponentReady}
                        onChange={(e: ChangeEvent<HTMLInputElement>, checked: boolean) => 
                            handleChangeUndoSetting(checked)
                        }
                    />
                }
                label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', lineHeight: 1 }}>
                        <span style={{ ...styles.checkboxAndRadioGroupTextStyle }}>
                            Undo Confirmation
                        </span>
                        <Tooltip title="Uses the same rules for Undo as public games. Limited number of free undos, then requires opponent approval. If this is disabled, there are no limits on undo.">
                            <Info 
                                sx={{ 
                                    fontSize: '14px',
                                    color: '#1976d2',
                                    backgroundColor: '#fff',
                                    borderRadius: '50%',
                                    cursor: 'help',
                                    opacity: disableSettings ? 0.5 : 1
                                }} 
                            />
                        </Tooltip>
                    </Box>
                }
            />
        </Card>
    )
};

export default SetUpCard;
