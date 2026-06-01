import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Alert, Divider, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import PreferenceOption from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceOption';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import CardLanguageNoticeDialog from '@/app/_components/_sharedcomponents/CardLanguageNoticeDialog';
import { useUser } from '@/app/_contexts/User.context';
import { savePreferencesGeneric } from '@/app/_utils/genericPreferenceFunctions';
import { CARD_IMAGE_LOCALE_LABELS, CardImageLocale, SUPPORTED_CARD_IMAGE_LOCALES } from '@/app/_utils/s3Utils';
import { loadPreferencesFromLocalStorage } from '@/app/_utils/ServerAndLocalStorageUtils';
import { useCardImageLocaleContext } from '@/app/_contexts/CardImageLocale.context';

enum SaveStatus {
    NoChange = 'noChange',
    Success = 'success',
    Error = 'error',
}

function GameOptionsTab({ setHasNewChanges }: { setHasNewChanges?: (has: boolean) => void }) {
    const { user, updateUserPreferences } = useUser();
    const { setLocale } = useCardImageLocaleContext();

    const [muteChatEnabled, setMuteChatEnabled] = useState<boolean>(false);
    const [originalMuteChat, setOriginalMuteChat] = useState<boolean>(false);

    const [cardLanguage, setCardLanguage] = useState<CardImageLocale>(CardImageLocale.English);
    const [originalCardLanguage, setOriginalCardLanguage] = useState<CardImageLocale>(CardImageLocale.English);

    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>(SaveStatus.NoChange);
    const [saveMessage, setSaveMessage] = useState('');
    const [showLanguageInfo, setShowLanguageInfo] = useState(false);

    useEffect(() => {
        const currentMuteChat = user?.preferences?.gameOptions?.muteChat ?? false;
        setMuteChatEnabled(currentMuteChat);
        setOriginalMuteChat(currentMuteChat);

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
        const unsaved = muteChatEnabled !== originalMuteChat || cardLanguage !== originalCardLanguage;
        setHasChanges(unsaved);
        if (setHasNewChanges) {
            setHasNewChanges(unsaved);
        }
    }, [muteChatEnabled, originalMuteChat, cardLanguage, originalCardLanguage]);

    const handleMuteChatChange = (value: boolean) => {
        setMuteChatEnabled(value);
        setSaveStatus(SaveStatus.NoChange);
    };

    const handleCardLanguageChange = (event: SelectChangeEvent<CardImageLocale>) => {
        setCardLanguage(event.target.value as CardImageLocale);
        setSaveStatus(SaveStatus.NoChange);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveStatus(SaveStatus.NoChange);
        const previousCardLanguage = originalCardLanguage;
        try {
            const result = await savePreferencesGeneric(
                user,
                { gameOptions: { muteChat: muteChatEnabled, cardLanguage } },
                updateUserPreferences
            );
            if (result.success) {
                setOriginalMuteChat(muteChatEnabled);
                setOriginalCardLanguage(cardLanguage);
                // Flip the live image locale immediately so all cards re-render
                // without waiting on the UserContext round-trip (also covers the
                // anonymous path, which doesn't go through UserContext at all).
                setLocale(cardLanguage);
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

            {user && (
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
                        />
                    </Box>
                </Box>
            )}

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