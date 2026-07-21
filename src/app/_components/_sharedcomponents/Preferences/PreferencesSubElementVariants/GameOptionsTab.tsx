import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Alert, Divider, FormControl, FormControlLabel, MenuItem, Radio, RadioGroup, Select, SelectChangeEvent } from '@mui/material';
import PreferenceOption from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceOption';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import CardLanguageNoticeDialog from '@/app/_components/_sharedcomponents/CardLanguageNoticeDialog';
import { useUser } from '@/app/_contexts/User.context';
import { useGameOptional } from '@/app/_contexts/Game.context';
import { savePreferencesGeneric } from '@/app/_utils/genericPreferenceFunctions';
import { CARD_IMAGE_LOCALE_LABELS, CardImageLocale, SUPPORTED_CARD_IMAGE_LOCALES } from '@/app/_utils/s3Utils';
import { loadPreferencesFromLocalStorage } from '@/app/_utils/ServerAndLocalStorageUtils';
import { useCardImageLocaleContext } from '@/app/_contexts/CardImageLocale.context';
import { TimerVisibility } from '@/app/_contexts/UserTypes';
import { DEFAULT_TIMER_VISIBILITY, useTimerVisibilityContext } from '@/app/_contexts/TimerVisibility.context';
import TimerPreview from '@/app/_components/_sharedcomponents/Timer/TimerPreview';

enum SaveStatus {
    NoChange = 'noChange',
    Success = 'success',
    Error = 'error',
}

const TIMER_VISIBILITY_OPTIONS: Array<{ value: TimerVisibility, label: string, description: string }> = [
    {
        value: TimerVisibility.Standard,
        label: 'Standard',
        description: 'Show the animated turn timer and each player\'s main times.',
    },
    {
        value: TimerVisibility.HideTurnTimer,
        label: 'Hide turn timer',
        description: 'Show each player\'s main time, but hide the animated turn timer.',
    },
    {
        value: TimerVisibility.HideAll,
        label: 'Hide all timers',
        description: 'Hide everything. A warning icon appears when your main time is low and actively running.',
    },
];

function GameOptionsTab({ variant, setHasNewChanges }: { variant?: 'gameBoard' | 'homePage', setHasNewChanges?: (has: boolean) => void }) {
    const { user, updateUserPreferences } = useUser();
    const { setLocale } = useCardImageLocaleContext();
    const { setTimerVisibility: setTimerVisibilityContext } = useTimerVisibilityContext();
    // Only present when this tab is rendered inside a game (GameProvider); undefined on the home page.
    const game = useGameOptional();

    const [muteChatEnabled, setMuteChatEnabled] = useState<boolean>(false);
    const [originalMuteChat, setOriginalMuteChat] = useState<boolean>(false);

    const [autoSingleTargetEnabled, setAutoSingleTargetEnabled] = useState<boolean>(false);
    const [originalAutoSingleTarget, setOriginalAutoSingleTarget] = useState<boolean>(false);

    const [cardLanguage, setCardLanguage] = useState<CardImageLocale>(CardImageLocale.English);
    const [originalCardLanguage, setOriginalCardLanguage] = useState<CardImageLocale>(CardImageLocale.English);

    const [timerVisibility, setTimerVisibility] = useState<TimerVisibility>(DEFAULT_TIMER_VISIBILITY);
    const [originalTimerVisibility, setOriginalTimerVisibility] = useState<TimerVisibility>(DEFAULT_TIMER_VISIBILITY);

    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>(SaveStatus.NoChange);
    const [saveMessage, setSaveMessage] = useState('');
    const [showLanguageInfo, setShowLanguageInfo] = useState(false);

    useEffect(() => {
        const currentMuteChat = user?.preferences?.gameOptions?.muteChat ?? false;
        setMuteChatEnabled(currentMuteChat);
        setOriginalMuteChat(currentMuteChat);

        const currentAutoSingleTarget = user?.preferences?.gameOptions?.autoSingleTarget ?? false;
        setAutoSingleTargetEnabled(currentAutoSingleTarget);
        setOriginalAutoSingleTarget(currentAutoSingleTarget);

        let currentTimerVisibility: TimerVisibility;
        if (user?.preferences?.gameOptions?.timerVisibility) {
            currentTimerVisibility = user.preferences.gameOptions.timerVisibility;
        } else {
            currentTimerVisibility = loadPreferencesFromLocalStorage().gameOptions?.timerVisibility
                ?? DEFAULT_TIMER_VISIBILITY;
        }
        setTimerVisibility(currentTimerVisibility);
        setOriginalTimerVisibility(currentTimerVisibility);

        let currentLanguage: CardImageLocale;
        if (user?.preferences?.gameOptions?.cardLanguage) {
            currentLanguage = user.preferences.gameOptions.cardLanguage;
        } else {
            currentLanguage = loadPreferencesFromLocalStorage().gameOptions?.cardLanguage
                ?? CardImageLocale.English;
        }
        setCardLanguage(currentLanguage);
        setOriginalCardLanguage(currentLanguage);
    }, [user]);

    useEffect(() => {
        const unsaved = muteChatEnabled !== originalMuteChat || cardLanguage !== originalCardLanguage || timerVisibility !== originalTimerVisibility || autoSingleTargetEnabled !== originalAutoSingleTarget;
        setHasChanges(unsaved);
        if (setHasNewChanges) {
            setHasNewChanges(unsaved);
        }
    }, [muteChatEnabled, originalMuteChat, cardLanguage, originalCardLanguage, timerVisibility, originalTimerVisibility, autoSingleTargetEnabled, originalAutoSingleTarget, setHasNewChanges]);

    const handleMuteChatChange = (value: boolean) => {
        setMuteChatEnabled(value);
        setSaveStatus(SaveStatus.NoChange);
    };

    const handleAutoSingleTargetChange = (value: boolean) => {
        setAutoSingleTargetEnabled(value);
        setSaveStatus(SaveStatus.NoChange);
    };

    const handleCardLanguageChange = (event: SelectChangeEvent<CardImageLocale>) => {
        setCardLanguage(event.target.value as CardImageLocale);
        setSaveStatus(SaveStatus.NoChange);
    };

    const handleTimerVisibilityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTimerVisibility(event.target.value as TimerVisibility);
        setSaveStatus(SaveStatus.NoChange);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveStatus(SaveStatus.NoChange);
        const previousCardLanguage = originalCardLanguage;
        const autoSingleTargetChanged = autoSingleTargetEnabled !== originalAutoSingleTarget;
        try {
            const result = await savePreferencesGeneric(
                user,
                { gameOptions: { muteChat: muteChatEnabled, cardLanguage, timerVisibility, autoSingleTarget: autoSingleTargetEnabled } },
                updateUserPreferences
            );
            if (result.success) {
                setOriginalMuteChat(muteChatEnabled);
                setOriginalCardLanguage(cardLanguage);
                setOriginalAutoSingleTarget(autoSingleTargetEnabled);
                // The server reads autoSingleTarget when the game is created, so a mid-game change
                // must also be pushed to the running game to take effect this game.
                if (autoSingleTargetChanged && variant === 'gameBoard') {
                    game?.sendGameMessage(['toggleOptionSetting', 'autoSingleTarget', autoSingleTargetEnabled]);
                }
                // Flip the live image locale immediately so all cards re-render
                // without waiting on the UserContext round-trip (also covers the
                // anonymous path, which doesn't go through UserContext at all).
                setLocale(cardLanguage);
                // Flip the live timer visibility immediately so the game
                // timer re-renders without waiting on the UserContext
                // round-trip (also covers the anonymous path).
                setTimerVisibilityContext(timerVisibility);
                setOriginalTimerVisibility(timerVisibility);
                setSaveStatus(SaveStatus.Success);
                setSaveMessage('Game options saved successfully.');
                setTimeout(() => setSaveStatus(SaveStatus.NoChange), 3000);
                setHasChanges(false);
                if (setHasNewChanges) {
                    setHasNewChanges(false);
                }
                if (
                    cardLanguage !== previousCardLanguage
                    && cardLanguage !== CardImageLocale.English
                ) {
                    setShowLanguageInfo(true);
                }
            } else {
                setSaveStatus(SaveStatus.Error);
                setSaveMessage('Failed to save game options to server.');
            }
        } catch (error) {
            console.error('Failed to save game options:', error);
            if (error instanceof Error) {
                setSaveMessage(error.message);
            } else {
                setSaveMessage('Unknown Server Error');
            }
            setSaveStatus(SaveStatus.Error);
        } finally {
            setIsSaving(false);
        }
    };

    const styles = {
        typographyContainer: {
            mb: '0.5rem',
        },
        functionContainer: {
            mb: '3.5rem',
        },
        rowContainer: {
            mb: '1.5rem',
        },
        languageRow: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            mb: '1.5rem',
        },
        languageLabel: {
            flex: 1,
        },
        languageSelect: {
            minWidth: '180px',
        },
        languageDescription: {
            color: '#aaa',
            fontSize: '0.85rem',
            mb: '1rem',
        },
        saveButtonContainer: {
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            mt: '2rem',
        },
        saveButton: {
            minWidth: '140px',
        },
        radio: {
            color: '#fff',
            '&.Mui-checked': {
                color: '#fff',
            },
        },
        radioLabel: {
            color: '#fff',
            fontSize: '1.1rem',
            fontWeight: 600,
        },
        radioDescription: {
            color: '#878787',
            fontSize: '0.95rem',
            ml: '2rem',
            mt: '-0.25rem',
            mb: '0.5rem',
        },
        radioRow: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
            mb: '1rem',
        },
        radioRowText: {
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minWidth: 0,
        },
        radioPreview: {
            flexShrink: 0,
        },
    };

    return (
        <>
            <Box sx={styles.functionContainer}>
                <Typography sx={styles.typographyContainer} variant={'h2'}>Card Language</Typography>
                <Divider sx={{ mb: '20px' }} />
                <Typography sx={styles.languageDescription}>
                    Language used to render card images
                </Typography>
                <Box sx={styles.languageRow}>
                    <Select
                        value={cardLanguage}
                        onChange={handleCardLanguageChange}
                        size="small"
                        sx={styles.languageSelect}
                    >
                        {SUPPORTED_CARD_IMAGE_LOCALES.map((loc) => (
                            <MenuItem key={loc} value={loc}>
                                {CARD_IMAGE_LOCALE_LABELS[loc]}
                            </MenuItem>
                        ))}
                    </Select>
                </Box>
            </Box>

            {variant !== 'gameBoard' && (
                <Box sx={styles.functionContainer}>
                    <Typography sx={styles.typographyContainer} variant={'h2'}>Chat</Typography>
                    <Divider sx={{ mb: '20px' }} />
                    <Box sx={{ mb: '10px' }}>
                        <PreferenceOption
                            option={'Mute Chat'}
                            optionDescription={'Mute chat in all games.'}
                            iconType="checkbox"
                            onChange={handleMuteChatChange}
                            defaultChecked={muteChatEnabled}
                            disabled={!user}
                        />
                    </Box>
                    {!user && (
                        <Typography sx={{ ml: '1rem', color: '#888', fontSize: '0.85rem' }}>
                            Log in to save game options.
                        </Typography>
                    )}
                </Box>
            )}

            {user && (
                <Box sx={styles.functionContainer}>
                    <Typography sx={styles.typographyContainer} variant={'h2'}>Gameplay</Typography>
                    <Divider sx={{ mb: '20px' }} />
                    <Box sx={{ mb: '10px' }}>
                        <PreferenceOption
                            option={'Auto-resolve single targets'}
                            optionDescription={'When an effect has only one legal target, resolve it automatically instead of prompting you to choose.'}
                            iconType="checkbox"
                            onChange={handleAutoSingleTargetChange}
                            defaultChecked={autoSingleTargetEnabled}
                        />
                    </Box>
                </Box>
            )}

            <Box sx={styles.functionContainer}>
                <Typography sx={styles.typographyContainer} variant={'h2'}>Timer Visibility</Typography>
                <Divider sx={{ mb: '20px' }} />
                <Typography sx={{ mb: '1rem', color: '#aaa', fontSize: '0.9rem' }}>
                    Customize the visibility of the game timer. These settings only affect what you see. Timers are <strong>always enabled in public games</strong> and always disabled in private games.
                </Typography>
                <FormControl component="fieldset">
                    <RadioGroup
                        value={timerVisibility}
                        onChange={handleTimerVisibilityChange}
                    >
                        {TIMER_VISIBILITY_OPTIONS.map((opt) => (
                            <Box key={opt.value} sx={styles.radioRow}>
                                <Box sx={styles.radioRowText}>
                                    <FormControlLabel
                                        value={opt.value}
                                        control={<Radio sx={styles.radio} />}
                                        label={<Typography sx={styles.radioLabel}>{opt.label}</Typography>}
                                    />
                                    <Typography sx={styles.radioDescription}>{opt.description}</Typography>
                                </Box>
                                <Box sx={styles.radioPreview}>
                                    <TimerPreview visibility={opt.value} />
                                </Box>
                            </Box>
                        ))}
                    </RadioGroup>
                </FormControl>
            </Box>

            <Box sx={styles.saveButtonContainer}>
                <PreferenceButton
                    variant="standard"
                    buttonFnc={handleSave}
                    disabled={!hasChanges || isSaving}
                    text={'Save Changes'}
                    sx={styles.saveButton}
                />
                {saveStatus === SaveStatus.Success && (
                    <Alert severity="success" sx={{ flexGrow: 1, background: 'none', color: 'green' }}>
                        {saveMessage}
                    </Alert>
                )}
                {saveStatus === SaveStatus.Error && (
                    <Alert severity="error" sx={{ flexGrow: 1, background: 'none', color: 'red' }}>
                        {saveMessage}
                    </Alert>
                )}
            </Box>

            <CardLanguageNoticeDialog
                open={showLanguageInfo}
                onClose={() => setShowLanguageInfo(false)}
            />
        </>
    );
}

export default GameOptionsTab;
