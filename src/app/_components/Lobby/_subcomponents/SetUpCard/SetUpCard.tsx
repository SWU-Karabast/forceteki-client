import React, { ChangeEvent, useEffect, useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Box, CardActions, Link, Tooltip, MenuItem, Checkbox, FormControlLabel, Divider,
    FormControl
} from '@mui/material';
import { Info } from '@mui/icons-material';
import { useGame } from '@/app/_contexts/Game.context';
import { ILobbyUserProps, ISetUpProps } from '@/app/_components/Lobby/LobbyTypes';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';
import { fetchDeckData } from '@/app/_utils/fetchDeckData';
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
import { SupportedDeckSources, SwuGameFormat } from '@/app/_constants/constants';
import PreferenceOptionWithIcon from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceOption';
import { useDeckErrors } from '@/app/_hooks/useDeckErrors';

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
    const { errorState, setError, clearErrorsFunc, setIsJsonDeck, setModalOpen } = useDeckErrors();
    const [displayError, setDisplayerror] = useState(false);
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

    const handleJsonDeck = (deckLink: string) => {
        const parsedInput = parseInputAsDeckData(deckLink);
        if(parsedInput.type === 'json'){
            setIsJsonDeck(true);
            setSaveDeck(false);
            setError(null, 'We do not support saving JSON decks at this time. Please import the deck into a deckbuilder such as SWUDB and use link import.', 'JSON Decks Notice', 'warning');
            return;
        }
        setIsJsonDeck(false);
        clearErrorsFunc();
    }

    const handleLinkToggle = () =>{
        setshowLink(!showLink);
    }

    const handleOnChangeDeck = async () => {
        if ((!favouriteDeck && !deckLink) || readyStatus) return;
        let userDeck: string;
        let deckType = 'url';
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
            deckType = parsedInput.type
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
                setError('Couldn\'t import. Deck is invalid or unsupported deckbuilder',
                    'Incorrect deck format or unsupported deckbuilder.',
                    undefined,
                    'error')
                setModalOpen(true);
                return;
            }
            // save deck to local storage
            if (saveDeck && deckData && deckLink && deckType === 'url'){
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
                    setError('Server error when saving deck to server.',
                        'There was an error when saving deck to the server. Please contact the developer team on discord.',
                        'Deck Validation Error', 'error');
                    setModalOpen(true);
                }
            }

            sendLobbyMessage(['changeDeck', deckData])
        }catch (error){
            setDisplayerror(true);
            clearErrorsFunc();
            setModalOpen(true)
            if(error instanceof Error){
                if(error.message.includes('403')) {
                    setError('Couldn\'t import. The deck is set to private.',{
                        [DeckValidationFailureReason.DeckSetToPrivate]: true,
                    }, 'Deck Validation Error', 'error');
                }else{
                    setError('Couldn\'t import. Deck is invalid.',undefined,'Deck Validation Error', 'error');
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
            clearErrorsFunc();
            setModalOpen(false);
            setDisplayerror(false);
            setBlockError(false);
            return;
        }


        // Determine if a blocking error exists (ignoring NotImplemented and temporary errors)
        // we want two errors that won't trigger the

        if (deckErrors && Object.keys(deckErrors).length > 0) {
            // Show a short inline error message and store the full list
            setDisplayerror(true);
            setError('Deck is invalid.',deckErrors,'Deck Validation Error', 'error');
            setBlockError(true);

            // Check if any errors other than the specified ones exist
            const hasOtherErrors = Object.keys(deckErrors).some(key =>
                key !== DeckValidationFailureReason.MinMainboardSizeNotMet &&
                key !== DeckValidationFailureReason.MaxSideboardSizeExceeded
            );

            // Only open modal if there are validation errors besides the two excluded types
            if (hasOtherErrors) {
                setModalOpen(true);
            } else {
                setModalOpen(false);
            }
        }else{
            clearErrorsFunc();
            setModalOpen(false);
            setDisplayerror(false);
            setBlockError(false);
        }
        if (temporaryErrors && !deckImportErrorsSeen) {
            // Only 'notImplemented' or no errors => clear them out
            setDisplayerror(true);
            setError('Couldn\'t import. Deck is invalid.',temporaryErrors, 'Deck Validation Error', 'error');
            setModalOpen(true);
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
        formControlStyle: {
            mb: '1rem',
        },
        disabledDropdownStyle: {
            mb: '1rem',
            width: { xs: '100%', sm: '50%' }, // Full width on extra small screens, half width on small and up
            maxWidth: '300px', // Reasonable maximum width
            '& .MuiOutlinedInput-root': {
                '&.Mui-disabled': {
                    pointerEvents: 'none', // Disable all mouse interactions
                    '& fieldset': {
                        borderColor: '#888888', // Lighter gray border when disabled
                    },
                },
            },
            '& .MuiInputBase-input.Mui-disabled': {
                color: '#aaaaaa', // Lighter gray text when disabled
                WebkitTextFillColor: '#aaaaaa', // Override WebKit's default disabled text color
            },
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
        errorMessageLinkPlain:{
            ml: '2px',
            cursor: 'pointer',
            color: 'white',
            textDecorationColor: 'white',
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
                color: 'rgba(255, 255, 255, 0.3)',
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
                                    if (connectedUser?.deckErrors && Object.keys(connectedUser.deckErrors).length > 0) {
                                        setDisplayerror(true);
                                        setError('Deck is invalid', connectedUser.deckErrors, 'Deck Validation Error','error')
                                    } else {
                                        setDisplayerror(false);
                                        clearErrorsFunc();
                                    }
                                    handleJsonDeck(e.target.value);
                                    setDeckLink(e.target.value);
                                }}
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        sx={styles.checkboxStyle}
                                        disabled={errorState.isJsonDeck}
                                        checked={saveDeck}
                                        onChange={(
                                            e: ChangeEvent<HTMLInputElement>,
                                            checked: boolean
                                        ) => setSaveDeck(checked)}
                                    />
                                }
                                label={
                                    <Typography sx={styles.checkboxAndRadioGroupTextStyle}>
                                        {errorState.isJsonDeck ? (
                                            <Box>
                                                JSON format cannot be saved.
                                                <Link
                                                    sx={styles.errorMessageLinkPlain}
                                                    onClick={() => setModalOpen(true)}
                                                >Details
                                                </Link>
                                            </Box>
                                        ) : 'Save Deck List'}
                                    </Typography>
                                }
                            />
                        </>
                    )}
                    {(displayError || blockError) && (
                        <Typography variant={'body1'} color={'error'} sx={styles.errorMessageStyle}>
                            {errorState.summary}{' '}
                            {errorState.details && (
                                <Link
                                    sx={styles.errorMessageLink}
                                    onClick={() => setModalOpen(true) }
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
            {errorState.details && (
                <ErrorModal
                    title={errorState.title}
                    open={errorState.modalOpen}
                    onClose={() => {
                        setModalOpen(false)
                        setDeckImportErrorsSeen(true);
                    }}
                    errors={errorState.details}
                    format={lobbyFormat}
                    modalType={errorState.modalType}
                />
            )}
            {lobbyState.isPrivate && (
                <>
                    <Divider sx={{ mt: 2, borderColor: '#666' }} />
                    <Typography variant="h5" sx={{ fontSize: '1.2em', fontWeight: '600', color: 'white', mt: 2, mb: 1 }}>
                        Game Settings
                    </Typography>
                    {lobbyFormat === SwuGameFormat.Open && (
                        <>
                            <Typography variant="body1" sx={styles.labelTextStyle}>
                                Mainboard Minimum Size
                            </Typography>
                            <FormControl fullWidth sx={styles.disabledDropdownStyle}>
                                <StyledTextField
                                    select
                                    value={lobbyState.allow30CardsInMainBoard ? '30Card' : '50Card'}
                                    onChange={() => {}}
                                    disabled={true}
                                >
                                    <MenuItem value="50Card">50 Cards</MenuItem>
                                    <MenuItem value="30Card">30 Cards</MenuItem>
                                </StyledTextField>
                            </FormControl>
                        </>
                    )}
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
                                    Undo Requests
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
                </>
            )}
        </Card>
    )
};

export default SetUpCard;
