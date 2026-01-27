import React, { ChangeEvent, useEffect, useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Box,
    Link,
    Tooltip,
    MenuItem,
    Checkbox,
    FormControlLabel,
    Divider,
    FormControl,
    Radio,
    RadioGroup,
} from '@mui/material';
import { Info } from '@mui/icons-material';
import { useGame } from '@/app/_contexts/Game.context';
import { ILobbyUserProps, IDeckSelectionCardProps } from '@/app/_components/Lobby/LobbyTypes';
import LobbyReadyButtons from '@/app/_components/Lobby/_subcomponents/LobbyReadyButtons/LobbyReadyButtons';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';
import { fetchDeckData } from '@/app/_utils/fetchDeckData';
import {
    IDeckValidationFailures,
    DeckValidationFailureReason,
} from '@/app/_validators/DeckValidation/DeckValidationTypes';
import { ErrorModal } from '@/app/_components/_sharedcomponents/Error/ErrorModal';
import { parseInputAsDeckData } from '@/app/_utils/checkJson';

import {
    saveDeckToLocalStorage,
    saveDeckToServer
} from '@/app/_utils/ServerAndLocalStorageUtils';
import { useUser } from '@/app/_contexts/User.context';
import { GamesToWinMode, SupportedDeckSources, SwuGameFormat } from '@/app/_constants/constants';
import { useDeckErrors } from '@/app/_hooks/useDeckErrors';
import { useDeckManagement } from '@/app/_hooks/useDeckManagement';

const DeckSelectionCard: React.FC<IDeckSelectionCardProps> = ({
    readyStatus,
    owner,
}) => {
    const { lobbyState, connectedPlayer, sendLobbyMessage } = useGame();
    const { user } = useUser();
    
    // Use shared deck management hook
    const {
        deckPreferences,
        deckPreferencesHandlers,
        deckLink,
        setDeckLink,
        savedDecks,
        fetchDecks
    } = useDeckManagement();
    
    const { showSavedDecks, favoriteDeck, saveDeck } = deckPreferences;
    const { setShowSavedDecks, setFavoriteDeck, setSaveDeck } = deckPreferencesHandlers;
    
    const [showTooltip, setShowTooltip] = useState(false);
    const [deckImportErrorsSeen, setDeckImportErrorsSeen] = useState(false);
    
    const opponentUser = lobbyState ? lobbyState.users.find((u: ILobbyUserProps) => u.id !== connectedPlayer) : null;
    const connectedUser = lobbyState ? lobbyState.users.find((u: ILobbyUserProps) => u.id === connectedPlayer) : null;
    const lobbyFormat = lobbyState ? lobbyState.gameFormat : null;

    // Bo3 state from lobbyState
    const winHistory = lobbyState?.winHistory || null;
    const gamesToWinMode = winHistory?.gamesToWinMode || GamesToWinMode.BestOfOne;
    const currentGameNumber = winHistory?.currentGameNumber || 1;
    const isBo3Mode = gamesToWinMode === GamesToWinMode.BestOfThree;

    // For deck error display
    const { errorState, setError, clearErrorsFunc, setIsJsonDeck, setModalOpen } = useDeckErrors();
    const [displayError, setDisplayError] = useState(false);
    const [blockError, setBlockError] = useState(false);

    const opponentReady = opponentUser?.ready;
    const disableSettings = !owner || readyStatus || opponentReady;

    // ------------------------Additional functions------------------------//
    const handleChangeUndoSetting = async (checked: boolean) => {
        sendLobbyMessage(['updateSetting', 'requestUndo', checked]);
    };

    const handleUseLawBase = () => {
        sendLobbyMessage(['useLawBase'])
    }

    useEffect(() => {
        fetchDecks();
    }, [fetchDecks]);

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

    const handleChangeDeckSelectionType = (useSavedDecks: boolean) => {
        setShowSavedDecks(useSavedDecks);
        clearErrorsFunc();
    }

    const hasSomeNonSideboardingErrors = (deckErrors: IDeckValidationFailures): boolean => {
        if (!deckErrors) return false;
        return Object.keys(deckErrors).some(key =>
            key !== DeckValidationFailureReason.MinMainboardSizeNotMet &&
            key !== DeckValidationFailureReason.MaxSideboardSizeExceeded
        );
    };

    const handleOnChangeDeck = async () => {
        if ((!favoriteDeck && !deckLink) || readyStatus) return;
        let userDeck = '';
        let deckType = 'url';
        // check whether the favourite deck was selected or a decklink was used. The decklink always has precedence
        setDeckImportErrorsSeen(false);
        if(showSavedDecks) {
            const selectedDeck = savedDecks.find(deck => deck.deckID === favoriteDeck);
            if (selectedDeck?.deckLink) {
                userDeck = selectedDeck?.deckLink
            }
        } else {
            userDeck = deckLink;
        }
        try {
            let deckData;
            const parsedInput = parseInputAsDeckData(userDeck);
            deckType = parsedInput.type
            if(parsedInput.type === 'url') {
                deckData = userDeck ? await fetchDeckData(userDeck, false) : null;
                if(favoriteDeck && deckData && showSavedDecks) {
                    deckData.deckID = favoriteDeck;
                    deckData.deckLink = userDeck;
                    deckData.isPresentInDb = !!user;
                } else if(!showSavedDecks && userDeck && deckData) {
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
            setDisplayError(true);
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
        const deckErrors: IDeckValidationFailures = connectedUser?.deckErrors;
        const temporaryErrors: IDeckValidationFailures = connectedUser?.importDeckErrors;
        if ((!deckErrors || Object.entries(deckErrors).length === 0) && (!temporaryErrors || Object.entries(temporaryErrors).length === 0)) {
            // No validation errors => clear any old error states
            clearErrorsFunc();
            setModalOpen(false);
            setDisplayError(false);
            setBlockError(false);
            return;
        }


        // Determine if a blocking error exists (ignoring NotImplemented and temporary errors)
        // we want two errors that won't trigger the

        if (deckErrors && Object.keys(deckErrors).length > 0) {
            // Show a short inline error message and store the full list
            setDisplayError(true);
            if (hasSomeNonSideboardingErrors(connectedUser.deckErrors)) {
                setError('Deck is invalid', connectedUser.deckErrors, 'Deck Validation Error','error');
            } else {
                setError('Sideboarding restrictions not met');
            }
            setBlockError(true);

            // Only open modal if there are validation errors besides the two excluded types
            if (hasSomeNonSideboardingErrors(deckErrors)) {
                setModalOpen(true);
            } else {
                setModalOpen(false);
            }
        }else{
            clearErrorsFunc();
            setModalOpen(false);
            setDisplayError(false);
            setBlockError(false);
        }
        if (temporaryErrors && !deckImportErrorsSeen) {
            if (hasSomeNonSideboardingErrors(temporaryErrors)) {
            // Only 'notImplemented' or no errors => clear them out
                setDisplayError(true);
                setError('Couldn\'t import. Deck is invalid.',temporaryErrors, 'Deck Validation Error', 'error');
                setModalOpen(true);
            } else {
                setDisplayError(true);
                setError('Sideboarding restrictions not met');
                setModalOpen(false);
            }
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



    // ------------------------STYLES------------------------//
    const styles = {
        setUpCard: {
            paddingLeft: '20px',
            paddingRight: '20px',
        },
        formControlStyle: {
            mb: '0.5rem',
        },
        disabledDropdownStyle: {
            mb: '0.5rem',
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
            mt: '1rem',
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
        gameHeaderStyle: {
            fontSize: '1.75rem',
            fontWeight: '700',
            color: 'white',
            textAlign: 'center',
            mb: 1,
        },
        setUpTextStyle: {
            fontSize: '1.5rem',
            fontWeight: '800',
            color: 'white',
            alignSelf: 'flex-start',
        },
        labelTextStyle: {
            mt:'0.5rem',
            mb: '.25rem',
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
            mt: '0.5rem',
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
        // Styles for deck selection components (always enabled)
        checkboxStyle: {
            color: '#fff',
        },
        checkboxAndRadioGroupTextStyle: {
            color: '#fff',
            fontSize: '1rem',
        },
        // Styles for game settings components (can be disabled)
        settingsCheckboxStyle: {
            color: disableSettings ? '#b0b0b0' : '#fff', // Lighter color when disabled and unchecked
            '&.Mui-checked': {
                color: '#fff',
            },
            '&.Mui-disabled': {
                color: 'rgba(255, 255, 255, 0.3)',
            },
            opacity: disableSettings ? 0.5 : 1, // Slightly less opacity when disabled and checked
        },
        settingsCheckboxAndRadioGroupTextStyle: {
            color: disableSettings ? '#c0c0c0' : '#fff',  // Lighter color when disabled
            fontSize: '1rem',
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
                // If opponent is not null - show ready buttons
                <>
                    {/* Game X Setup Header for Bo3 mode */}
                    {isBo3Mode && (
                        <Typography variant="h5" sx={styles.gameHeaderStyle}>
                            {currentGameNumber === 1 ? 'Best-of-Three Setup' : `Game ${currentGameNumber} Setup`}
                        </Typography>
                    )}
                    <LobbyReadyButtons
                        readyStatus={readyStatus}
                        isOwner={owner}
                        blockError={blockError}
                        hasDeck={!!(connectedUser && connectedUser.deck)}
                    />
                </>
            )}

            {lobbyState && (
                <>
                    <Divider sx={{ mt: 1, borderColor: '#666' }} />
                    <FormControl component="fieldset" sx={styles.formControlStyle}>
                        <RadioGroup
                            row
                            value={showSavedDecks ? 'Saved Deck' : 'New Deck'}
                            onChange={(
                                e: ChangeEvent<HTMLInputElement>,
                                value: string
                            ) => handleChangeDeckSelectionType(value === 'Saved Deck')}
                        >
                            <FormControlLabel
                                value="Saved Deck"
                                control={<Radio sx={styles.checkboxStyle} />}
                                label={
                                    <Typography sx={styles.checkboxAndRadioGroupTextStyle}>
                                        Saved Deck
                                    </Typography>
                                }
                            />
                            <FormControlLabel
                                value="New Deck"
                                control={<Radio sx={styles.checkboxStyle} />}
                                label={
                                    <Typography sx={styles.checkboxAndRadioGroupTextStyle}>
                                        New Deck
                                    </Typography>
                                }
                            />
                        </RadioGroup>
                    </FormControl>
                    {showSavedDecks && (
                        <FormControl fullWidth sx={styles.formControlStyle}>
                            <Typography variant="body1" sx={styles.labelTextStyle}>Favorite Decks</Typography>
                            <StyledTextField
                                select
                                value={favoriteDeck}
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    setFavoriteDeck(e.target.value as string)
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
                        </FormControl>
                    ) || (
                        <>
                            {/* Deck Link Input */}
                            <FormControl fullWidth sx={styles.formControlStyle}>
                                <Typography variant="body1" sx={styles.labelTextStyle}>
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
                                </Typography>
                                <StyledTextField
                                    type="text"
                                    disabled={readyStatus}
                                    value={deckLink}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                        if (connectedUser?.deckErrors && Object.keys(connectedUser.deckErrors).length > 0) {
                                            setDisplayError(true);

                                            if (hasSomeNonSideboardingErrors(connectedUser.deckErrors)) {
                                                setError('Deck is invalid', connectedUser.deckErrors, 'Deck Validation Error','error');
                                            } else {
                                                setError('Sideboarding restrictions not met');
                                            }
                                        } else {
                                            setDisplayError(false);
                                            clearErrorsFunc();
                                        }
                                        handleJsonDeck(e.target.value);
                                        setDeckLink(e.target.value);
                                    }}
                                />
                            </FormControl>

                            {/* Save Deck To Favourites Checkbox */}
                            <FormControlLabel
                                sx={{ mb: '0.5rem' }}
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
                        {showSavedDecks ? 'Load Deck' : 'Import Deck'}
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
            <Divider sx={{ mt: 1, borderColor: '#666', display: lobbyFormat != 'nextSetPreview' ? 'none' : 'block' }} />
            <Box sx={{ display: lobbyFormat != 'nextSetPreview' ? 'none' : 'block' }}>
                <Button 
                    type="button" 
                    onClick={handleUseLawBase} 
                    variant="contained" 
                    sx={{
                        ...styles.submitButtonStyle,
                        mt: '1em',
                        ml: 0

                    }}
                >
                    Switch to LAW &quot;Ignore Aspect Penalty&quot; Base
                </Button>
                <Typography sx={{ fontSize: '.9em', mt: 1 }}>
                    Replaces your base with a mock LAW base of the same aspect like Daimyo&lsquo;s Palace.
                </Typography>
            </Box>
            {lobbyState.isPrivate && (
                <>
                    <Divider sx={{ mt: 1, borderColor: '#666' }} />
                    <Typography variant="h5" sx={{ fontSize: '1.2rem', fontWeight: '600', color: 'white', mt: 1, mb: 0.5 }}>
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
                                sx={styles.settingsCheckboxStyle}
                                checked={lobbyState.settings.requestUndo}
                                disabled={!owner || readyStatus || opponentReady}
                                onChange={(e: ChangeEvent<HTMLInputElement>, checked: boolean) => 
                                    handleChangeUndoSetting(checked)
                                }
                            />
                        }
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', lineHeight: 1 }}>
                                <span style={{ ...styles.settingsCheckboxAndRadioGroupTextStyle }}>
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

export default DeckSelectionCard;
