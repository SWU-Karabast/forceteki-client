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
    CircularProgress,
} from '@mui/material';
import { Info } from '@mui/icons-material';
import { useGame } from '@/app/_contexts/Game.context';
import { ILobbyUserProps, IDeckSelectionCardProps } from '@/app/_components/Lobby/LobbyTypes';
import LobbyReadyButtons from '@/app/_components/Lobby/_subcomponents/LobbyReadyButtons/LobbyReadyButtons';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';
import { fetchDeckData, determineDeckSource, DeckSource } from '@/app/_utils/fetchDeckData';
import {
    IDeckValidationFailures,
    DeckValidationFailureReason,
} from '@/app/_validators/DeckValidation/DeckValidationTypes';
import { ErrorModal } from '@/app/_components/_sharedcomponents/Error/ErrorModal';
import { parseInputAsDeckData } from '@/app/_utils/checkJson';

import {
    getUserPayload,
    saveDeckToLocalStorage,
    saveDeckToServer
} from '@/app/_utils/ServerAndLocalStorageUtils';
import { useUser } from '@/app/_contexts/User.context';
import { GamesToWinMode, IMatchConfiguration, SupportedDeckSources, SwuGameFormat } from '@/app/_constants/constants';
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
        fetchDecks,
        // SWU Stats integration
        swuStatsDecks,
        isSwuStatsLinked,
        useSwuStatsDecks,
        setSwuStatsDeckSource,
        isLoadingSwuStatsDecks,
        swuStatsDecksError,
    } = useDeckManagement();
    
    const { showSavedDecks, favoriteDeck, saveDeck } = deckPreferences;
    const { setShowSavedDecks, setFavoriteDeck, setSaveDeck } = deckPreferencesHandlers;
    
    const [showTooltip, setShowTooltip] = useState(false);
    const [deckImportErrorsSeen, setDeckImportErrorsSeen] = useState(false);
    
    const opponentUser = lobbyState ? lobbyState.users.find((u: ILobbyUserProps) => u.id !== connectedPlayer) : null;
    const connectedUser = lobbyState ? lobbyState.users.find((u: ILobbyUserProps) => u.id === connectedPlayer) : null;
    
    const matchConfig: IMatchConfiguration = {
        format: lobbyState?.gameFormat || deckPreferences.matchConfig.format,
        cardPool: lobbyState?.cardPool || deckPreferences.matchConfig.cardPool,
        gamesToWinMode: lobbyState?.winHistory.gamesToWinMode || deckPreferences.matchConfig.gamesToWinMode,
    }

    // Bo3 state from lobbyState
    const winHistory = lobbyState?.winHistory || null;
    const gamesToWinMode = winHistory?.gamesToWinMode || GamesToWinMode.BestOfOne;
    const currentGameNumber = winHistory?.currentGameNumber || 1;
    const isBo3Mode = gamesToWinMode === GamesToWinMode.BestOfThree;

    // Lobby settings
    const requestUndo = lobbyState?.settings.requestUndo || false;
    const allowSpectators = lobbyState?.settings.allowSpectators || false;
    const customSetup = lobbyState?.settings.customSetup || null;
    const customSetupServerJson: string | null = customSetup?.json ?? null;
    const customSetupErrors: { path: string; message: string }[] = customSetup?.errors ?? [];
    const customSetupValid: boolean = !!customSetup?.valid;

    // For deck error display
    const { errorState, setError, clearErrorsFunc, setIsJsonDeck, setModalOpen } = useDeckErrors();
    const [displayError, setDisplayError] = useState(false);
    const [blockError, setBlockError] = useState(false);

    // Custom setup textarea (owner only; mirrors server state but allows local edits before applying).
    // Pre-populated with a skeleton so users only have to fill card names — they don't have to remember the shape.
    const customSetupTemplate = JSON.stringify({
        phase: 'action',
        player1: {
            hand: [],
            groundArena: [],
            spaceArena: [],
            discard: [],
            resources: [],
        },
        player2: {
            hand: [],
            groundArena: [],
            spaceArena: [],
            discard: [],
            resources: [],
        },
    }, null, 2);

    // A fully-populated reference JSON showing every supported field with
    // realistic values. Read-only; surfaced behind a "Show syntax" toggle so
    // owners can see what each property does without leaving the lobby.
    //
    // Card identifiers are internalName slugs. Cards with a subtitle (most
    // unique units and all leaders) use the format `title#subtitle`, e.g.
    // `maul#revenge-at-last`. Cards without a subtitle are just the slug,
    // e.g. `pyke-sentinel`.
    const customSetupExample = JSON.stringify({
        phase: 'action',
        player1: {
            hasInitiative: true,
            hasForceToken: true,
            credits: 3,
            leader: {
                deployed: true,
                damage: 0,
                exhausted: false,
                flipped: false,
            },
            base: {
                damage: 5,
            },
            hand: ['pyke-sentinel', 'maul#revenge-at-last'],
            groundArena: [
                'pyke-sentinel',
                {
                    card: 'maul#revenge-at-last',
                    damage: 2,
                    exhausted: true,
                    upgrades: ['academy-training', 'shield', 'experience'],
                },
            ],
            spaceArena: [
                { card: 'cartel-spacer', damage: 0, exhausted: false },
            ],
            discard: ['the-emperors-legion'],
            // Cards listed here remain on top of the deck (in order); anything
            // mentioned elsewhere is moved to that zone; everything else is
            // removed from play. Omit this key to keep the rest of the deck.
            deck: ['wampa', 'atst'],
            // Number of resource cards from the deck (or list specific cards).
            resources: 5,
        },
        player2: {
            hand: ['rebel-pathfinder'],
            groundArena: [],
            spaceArena: [],
            discard: [],
            // resources can also be an array of specific cards, optionally exhausted
            resources: [
                'wilderness-fighter',
                { card: 'rebel-pathfinder', exhausted: true },
            ],
        },
    }, null, 2);

    const [customSetupDraft, setCustomSetupDraft] = useState<string>(customSetupServerJson ?? customSetupTemplate);
    const [customSetupExpanded, setCustomSetupExpanded] = useState<boolean>(false);
    const [showSyntax, setShowSyntax] = useState<boolean>(false);
    useEffect(() => {
        // Sync from server when the server value changes (e.g. another tab applied it, or it was cleared due to deck change).
        // When the server has nothing saved, fall back to the template instead of an empty textarea.
        setCustomSetupDraft(customSetupServerJson ?? customSetupTemplate);
        // customSetupTemplate is a constant per render; no need to depend on it.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customSetupServerJson]);

    const opponentReady = opponentUser?.ready;
    const disableSettings = !owner || readyStatus || opponentReady;

    // ------------------------Additional functions------------------------//
    const handleChangeUndoSetting = async (checked: boolean) => {
        sendLobbyMessage(['updateSetting', 'requestUndo', checked]);
    };

    const handleChangeAllowSpectators = (checked: boolean) => {
        sendLobbyMessage(['updateSetting', 'allowSpectators', checked]);
    };

    const handleApplyCustomSetup = () => {
        sendLobbyMessage(['setCustomSetupState', customSetupDraft]);
    };

    const handleClearCustomSetup = () => {
        setCustomSetupDraft('');
        sendLobbyMessage(['setCustomSetupState', null]);
    };

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

    const handleChangeDeckSelectionType = (value: string) => {
        if (value === 'SWU Stats Deck') {
            setShowSavedDecks(true);
            setSwuStatsDeckSource(true);
        } else if (value === 'Saved Deck') {
            setShowSavedDecks(true);
            setSwuStatsDeckSource(false);
        } else {
            setShowSavedDecks(false);
            setSwuStatsDeckSource(false);
        }
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
            if (useSwuStatsDecks && isSwuStatsLinked) {
                // Use SWU Stats deck
                const selectedSwuStatsDeck = swuStatsDecks.find(deck => deck.id.toString() === favoriteDeck);
                if (selectedSwuStatsDeck?.deckLink) {
                    userDeck = selectedSwuStatsDeck.deckLink;
                }
            } else {
                // Use saved deck from Karabast
                const selectedDeck = savedDecks.find(deck => deck.deckID === favoriteDeck);
                if (selectedDeck?.deckLink) {
                    userDeck = selectedDeck?.deckLink
                }
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
                    // SWU Stats decks are not stored in our DB
                    deckData.isPresentInDb = (useSwuStatsDecks && isSwuStatsLinked) ? false : !!user;
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

            const lobbyIdForRequest = lobbyState?.id;
            if (!lobbyIdForRequest) {
                throw new Error('Lobby id not available for change-deck request');
            }

            const changeDeckResponse = await fetch(
                `${process.env.NEXT_PUBLIC_ROOT_URL}/api/lobby/${lobbyIdForRequest}/change-deck`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ deck: deckData, user: getUserPayload(user) }),
                }
            );
            if (!changeDeckResponse.ok) {
                let bodyError: string | undefined;
                let bodyErrorCode: string | undefined;
                try {
                    const errBody = await changeDeckResponse.json();
                    bodyError = errBody?.error;
                    bodyErrorCode = errBody?.errorCode;
                } catch {
                    // ignore json parse errors
                }
                if (bodyErrorCode === 'NotLobbyMember') {
                    throw new Error('NotLobbyMember: ' + (bodyError || 'Not a player in this lobby'));
                }
                if (changeDeckResponse.status === 403) {
                    throw new Error('403: deck is private');
                }
                throw new Error(bodyError || `Failed to change deck (status ${changeDeckResponse.status})`);
            }
        }catch (error){
            setDisplayError(true);
            clearErrorsFunc();
            setModalOpen(true)
            if(error instanceof Error){
                if(error.message.includes('NotLobbyMember')) {
                    setError('Couldn\'t change deck. Your lobby session was lost. Please refresh the page.',
                        undefined,
                        'Lobby Error', 'error');
                }else if(error.message.includes('403')) {
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
        // SWU Stats integration styles
        deckSourceLabel: {
            color: '#aaa',
            fontSize: '0.85rem',
        },
        loadingContainer: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
        }
    }

    // Render SWU Stats decks dropdown
    const renderSwuStatsDecksDropdown = () => {
        if (isLoadingSwuStatsDecks) {
            return (
                <Box sx={styles.loadingContainer}>
                    <CircularProgress size={20} sx={{ color: '#fff', mr: 1 }} />
                    <Typography sx={{ color: '#aaa' }}>Loading SWU Stats decks...</Typography>
                </Box>
            );
        }

        // Sort decks with favorites first
        const sortedSwuStatsDecks = [...swuStatsDecks].sort((a, b) => {
            if (a.isFavorite && !b.isFavorite) return -1;
            if (!a.isFavorite && b.isFavorite) return 1;
            return a.name.localeCompare(b.name);
        });

        const emptyMessage = swuStatsDecksError ? 'Error retrieving SWU Stats decks' : 'No decks found on SWU Stats';

        return (
            <StyledTextField
                select
                value={favoriteDeck}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFavoriteDeck(e.target.value as string)
                }
                placeholder="SWU Stats Decks"
                SelectProps={{
                    displayEmpty: true,
                    renderValue: sortedSwuStatsDecks.length === 0
                        ? () => <span style={{ color: swuStatsDecksError ? 'var(--initiative-red)' : '#aaa' }}>{emptyMessage}</span>
                        : undefined,
                }}
            >
                {sortedSwuStatsDecks.length === 0 ? (
                    <MenuItem value="" disabled>
                        {emptyMessage}
                    </MenuItem>
                ) : (
                    sortedSwuStatsDecks.map((deck) => (
                        <MenuItem key={deck.id} value={deck.id.toString()}>
                            {deck.isFavorite ? '★ ' : ''}{deck.name}
                        </MenuItem>
                    ))
                )}
            </StyledTextField>
        );
    };

    // Render Karabast saved decks dropdown
    const renderKarabastDecksDropdown = () => (
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
    );

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
                            value={showSavedDecks ? (useSwuStatsDecks && isSwuStatsLinked ? 'SWU Stats Deck' : 'Saved Deck') : 'New Deck'}
                            onChange={(
                                e: ChangeEvent<HTMLInputElement>,
                                value: string
                            ) => handleChangeDeckSelectionType(value)}
                        >
                            {isSwuStatsLinked && (
                                <FormControlLabel
                                    value="SWU Stats Deck"
                                    control={<Radio sx={styles.checkboxStyle} />}
                                    label={
                                        <Typography sx={styles.checkboxAndRadioGroupTextStyle}>
                                            SWU Stats Deck
                                        </Typography>
                                    }
                                />
                            )}
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
                    {showSavedDecks && !useSwuStatsDecks && (
                        <FormControl fullWidth sx={styles.formControlStyle}>
                            {renderKarabastDecksDropdown()}
                        </FormControl>
                    )}
                    {showSavedDecks && useSwuStatsDecks && isSwuStatsLinked && (
                        <FormControl fullWidth sx={styles.formControlStyle}>
                            {renderSwuStatsDecksDropdown()}
                            
                            <Button
                                href="https://swustats.net"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Manage&nbsp;Decks&nbsp;on&nbsp;SWU&nbsp;Stats
                            </Button>
                        </FormControl>
                    )}
                    {!showSavedDecks && (
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
                    matchConfig={matchConfig}
                    modalType={errorState.modalType}
                />
            )}
            {lobbyState.isPrivate && (
                <>
                    <Divider sx={{ mt: 1, borderColor: '#666' }} />
                    <Typography variant="h5" sx={{ fontSize: '1.2rem', fontWeight: '600', color: 'white', mt: 1, mb: 0.5 }}>
                        Game Settings
                    </Typography>
                    <FormControlLabel
                        control={
                            <Checkbox
                                sx={styles.settingsCheckboxStyle}
                                checked={requestUndo}
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
                    <FormControlLabel
                        control={
                            <Checkbox
                                sx={styles.settingsCheckboxStyle}
                                checked={allowSpectators}
                                disabled={!owner || readyStatus || opponentReady}
                                onChange={(e: ChangeEvent<HTMLInputElement>, checked: boolean) =>
                                    handleChangeAllowSpectators(checked)
                                }
                            />
                        }
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', lineHeight: 1 }}>
                                <span style={{ ...styles.settingsCheckboxAndRadioGroupTextStyle }}>
                                    Allow Spectators
                                </span>
                                <Tooltip title="When enabled, allows other players to spectate your game using a shareable link. Find the link in the settings menu when the game starts.">
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
                    <Box sx={{ mt: 1 }}>
                        <Box
                            onClick={() => setCustomSetupExpanded((v) => !v)}
                            sx={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}
                        >
                            <span style={{ ...styles.settingsCheckboxAndRadioGroupTextStyle }}>
                                {customSetupExpanded ? '▾' : '▸'} Custom Starting Board (JSON)
                            </span>
                            {customSetupValid && (
                                <span style={{ color: '#4caf50', fontSize: '0.8rem' }}>● active</span>
                            )}
                            <Tooltip title="Optional. Owner-only. Define the exact starting board state with a JSON blob (player1 = lobby owner, player2 = opponent). When set, the mulligan and resource-2 prompts are skipped. Cards must come from each player's loaded deck.">
                                <Info sx={{ fontSize: '14px', color: '#1976d2', backgroundColor: '#fff', borderRadius: '50%', cursor: 'help' }} />
                            </Tooltip>
                        </Box>
                        {customSetupExpanded && (
                            <Box sx={{ mt: 1, ml: 1 }}>
                                {owner ? (
                                    <>
                                        <TextField
                                            multiline
                                            minRows={12}
                                            maxRows={24}
                                            fullWidth
                                            value={customSetupDraft}
                                            disabled={readyStatus || opponentReady}
                                            onChange={(e) => setCustomSetupDraft(e.target.value)}
                                            sx={{
                                                '& .MuiInputBase-root': {
                                                    fontFamily: 'monospace',
                                                    fontSize: '0.8rem',
                                                    color: '#fff',
                                                    backgroundColor: 'rgba(0,0,0,0.3)',
                                                },
                                            }}
                                        />
                                        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                disabled={readyStatus || opponentReady}
                                                onClick={handleApplyCustomSetup}
                                            >
                                                Apply
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                disabled={readyStatus || opponentReady || (!customSetupValid && !customSetupServerJson)}
                                                onClick={handleClearCustomSetup}
                                            >
                                                Clear
                                            </Button>
                                            <Button
                                                variant="text"
                                                size="small"
                                                onClick={() => setShowSyntax((v) => !v)}
                                                sx={{ color: '#90caf9' }}
                                            >
                                                {showSyntax ? 'Hide syntax' : 'Show syntax'}
                                            </Button>
                                        </Box>
                                        {showSyntax && (
                                            <Box sx={{ mt: 1 }}>
                                                <Box
                                                    component="dl"
                                                    sx={{
                                                        m: 0,
                                                        mb: 0.5,
                                                        display: 'grid',
                                                        gridTemplateColumns: 'max-content 1fr',
                                                        columnGap: 1.5,
                                                        rowGap: 0.5,
                                                        color: '#bbb',
                                                        fontSize: '0.75rem',
                                                        lineHeight: 1.4,
                                                        '& dt': { fontWeight: 600, color: '#e0e0e0', m: 0 },
                                                        '& dd': { m: 0 },
                                                        '& code': { color: '#cfd8dc' },
                                                    }}
                                                >
                                                    <Box component="dt">Required</Box>
                                                    <Box component="dd">
                                                        <code>player1</code> and <code>player2</code>. All other fields are optional.
                                                    </Box>

                                                    <Box component="dt">Card names</Box>
                                                    <Box component="dd">
                                                        <code>"pyke-sentinel"</code> or <code>"maul#revenge-at-last"</code> for subtitled units.
                                                    </Box>

                                                    <Box component="dt">String form</Box>
                                                    <Box component="dd">
                                                        Just the card name. Used in <code>hand</code>, <code>discard</code>, <code>deck</code>, and as a shorthand in arenas/resources for default state.
                                                    </Box>

                                                    <Box component="dt">Object form</Box>
                                                    <Box component="dd">
                                                        Usable in <code>groundArena</code>, <code>spaceArena</code>, and <code>resources</code> to override defaults: 
                                                        <br/><code>{'{ "card": "pyke-sentinel", "damage": 2, "exhausted": true, "upgrades": ["shield"] }'}</code>
                                                    </Box>
                                                    
                                                    <Box component="dt">Resources</Box>
                                                    <Box component="dd">
                                                        If given a number, will resource top N cards of deck. Accepts an array of cards as well.
                                                    </Box>
                                                </Box>
                                                <TextField
                                                    multiline
                                                    minRows={12}
                                                    maxRows={28}
                                                    fullWidth
                                                    value={customSetupExample}
                                                    InputProps={{ readOnly: true }}
                                                    sx={{
                                                        '& .MuiInputBase-root': {
                                                            fontFamily: 'monospace',
                                                            fontSize: '0.75rem',
                                                            color: '#cfd8dc',
                                                            backgroundColor: 'rgba(0,0,0,0.45)',
                                                        },
                                                    }}
                                                />
                                            </Box>
                                        )}
                                        {customSetupErrors.length > 0 && (
                                            <Box sx={{ mt: 1, p: 1, backgroundColor: 'rgba(244,67,54,0.15)', borderRadius: 1 }}>
                                                <Typography sx={{ color: '#f44336', fontSize: '0.8rem', fontWeight: 600 }}>
                                                    {customSetupErrors.length} validation error{customSetupErrors.length === 1 ? '' : 's'}:
                                                </Typography>
                                                {customSetupErrors.slice(0, 20).map((err, i) => (
                                                    <Typography key={i} sx={{ color: '#ffcdd2', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                                                        {err.path ? `${err.path}: ` : ''}{err.message}
                                                    </Typography>
                                                ))}
                                                {customSetupErrors.length > 20 && (
                                                    <Typography sx={{ color: '#ffcdd2', fontSize: '0.75rem' }}>
                                                        ...and {customSetupErrors.length - 20} more
                                                    </Typography>
                                                )}
                                            </Box>
                                        )}
                                    </>
                                ) : (
                                    <Typography sx={{ color: '#bbb', fontSize: '0.8rem' }}>
                                        {customSetupValid
                                            ? 'The lobby owner has configured a custom starting board. The mulligan and resource phase will be skipped.'
                                            : 'No custom starting board configured.'}
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </Box>
                </>
            )}
        </Card>
    )
};

export default DeckSelectionCard;
