'use client';

import React, { useEffect, useState } from 'react';
import { Box, Button, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useUser } from '@/app/_contexts/User.context';
import { useCardImageLocaleContext } from '@/app/_contexts/CardImageLocale.context';
import { savePreferencesGeneric } from '@/app/_utils/genericPreferenceFunctions';
import {
    CardImageLocale,
    getSuggestedCardLocaleFromBrowser,
    SuggestableCardLocale,
} from '@/app/_utils/s3Utils';
import { IPreferences } from '@/app/_contexts/UserTypes';

const DISMISSED_STORAGE_KEY = 'swu_cardLanguageSuggestionDismissed';

interface ISuggestionText {
    message: string;
    switchLabel: string;
    dismissLabel: string;
}

/**
 * Banner copy written in each suggestable language, so a native speaker sees
 * the nudge in their own language. English is never suggested (the detector
 * returns `undefined` when English is the top browser preference), so it has
 * no entry here.
 */
const SUGGESTION_TEXT: Record<SuggestableCardLocale, ISuggestionText> = {
    [CardImageLocale.French]: {
        message: 'Afficher les images des cartes en français ? (L\'interface du site reste en anglais.)',
        switchLabel: 'Passer au français',
        dismissLabel: 'Ignorer la suggestion de langue des cartes',
    },
    [CardImageLocale.German]: {
        message: 'Kartenbilder auf Deutsch anzeigen? (Die Website-Oberfläche bleibt auf Englisch.)',
        switchLabel: 'Zu Deutsch wechseln',
        dismissLabel: 'Kartensprachvorschlag schließen',
    },
    [CardImageLocale.Spanish]: {
        message: '¿Ver las imágenes de las cartas en español? (La interfaz del sitio sigue en inglés.)',
        switchLabel: 'Cambiar a español',
        dismissLabel: 'Descartar la sugerencia de idioma de las cartas',
    },
    [CardImageLocale.Italian]: {
        message: 'Mostrare le immagini delle carte in italiano? (L\'interfaccia del sito resta in inglese.)',
        switchLabel: 'Passa all\'italiano',
        dismissLabel: 'Ignora il suggerimento sulla lingua delle carte',
    },
};

/**
 * Returns true if the user has never explicitly picked a card language, in
 * which case we're safe to nudge them toward their browser language. An
 * explicit choice (including deliberately choosing English) suppresses the
 * banner permanently. Authenticated users are read from their preferences;
 * anonymous users are read from raw localStorage (we can't use
 * `loadPreferencesFromLocalStorage`, which defaults `cardLanguage` to English
 * and so can't distinguish "unset" from "chose English").
 */
const hasNeverChosenCardLanguage = (savedLocale: CardImageLocale | undefined): boolean => {
    if (savedLocale) {
        return false;
    }
    if (typeof window === 'undefined') {
        return false;
    }
    try {
        const raw = window.localStorage.getItem('swu_preferences');
        if (!raw) {
            return true;
        }
        const parsed = JSON.parse(raw) as IPreferences;
        return parsed.gameOptions?.cardLanguage == null;
    } catch {
        return true;
    }
};

const isDismissed = (suggested: SuggestableCardLocale): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }
    return window.localStorage.getItem(DISMISSED_STORAGE_KEY) === suggested;
};

const recordDismissal = (suggested: SuggestableCardLocale): void => {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        window.localStorage.setItem(DISMISSED_STORAGE_KEY, suggested);
    } catch {
        // Non-fatal: if we can't persist the dismissal the banner may
        // reappear on a future visit, which is acceptable.
    }
};

/**
 * Home-page-only top bar that appears when the browser's language differs
 * from the (default English) card language and the user has never explicitly
 * chosen a card language. Offers a one-click switch or a dismiss.
 */
const CardLanguageSuggestionBanner: React.FC = () => {
    const { user, updateUserPreferences } = useUser();
    const { locale, setLocale } = useCardImageLocaleContext();

    const [suggested, setSuggested] = useState<SuggestableCardLocale | undefined>(undefined);
    const [isSaving, setIsSaving] = useState(false);

    // Detection runs on the client only (navigator + localStorage access).
    useEffect(() => {
        const savedLocale = user?.preferences?.gameOptions?.cardLanguage;
        const browserSuggestion = getSuggestedCardLocaleFromBrowser();
        if (
            browserSuggestion
            && locale === CardImageLocale.English
            && hasNeverChosenCardLanguage(savedLocale)
            && !isDismissed(browserSuggestion)
        ) {
            setSuggested(browserSuggestion);
        } else {
            setSuggested(undefined);
        }
    }, [user, locale]);

    if (!suggested) {
        return null;
    }

    const text = SUGGESTION_TEXT[suggested];

    const handleSwitch = async () => {
        setIsSaving(true);
        try {
            // Flip the live locale immediately (also persists for anonymous users).
            setLocale(suggested);
            // Persist to the server for authenticated users.
            if (user) {
                await savePreferencesGeneric(
                    user,
                    { gameOptions: { cardLanguage: suggested } },
                    updateUserPreferences,
                );
            }
            recordDismissal(suggested);
            setSuggested(undefined);
        } catch (error) {
            console.error('Failed to switch card language from suggestion banner:', error);
            setIsSaving(false);
        }
    };

    const handleDismiss = () => {
        recordDismissal(suggested);
        setSuggested(undefined);
    };

    const styles = {
        container: {
            // Sit above the fixed navbar (zIndex 1100) so the banner and its
            // buttons aren't overlapped by the ControlHub icons.
            position: 'relative',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            width: '100%',
            px: '1rem',
            py: '0.75rem',
            backgroundColor: 'rgba(19, 42, 66, 0.85)',
            borderBottom: '1px solid #88b0cc',
        },
        message: {
            color: '#88b0cc',
            textAlign: 'center',
        },
        switchButton: {
            color: '#fff',
            borderColor: '#88b0cc',
            textTransform: 'none',
            whiteSpace: 'nowrap',
        },
        closeButton: {
            color: '#88b0cc',
        },
    };

    return (
        <Box sx={styles.container}>
            <Typography variant="body1" sx={styles.message}>
                {text.message}
            </Typography>
            <Button
                variant="outlined"
                size="small"
                onClick={handleSwitch}
                disabled={isSaving}
                sx={styles.switchButton}
            >
                {text.switchLabel}
            </Button>
            <IconButton
                aria-label={text.dismissLabel}
                size="small"
                onClick={handleDismiss}
                sx={styles.closeButton}
            >
                <CloseIcon fontSize="small" />
            </IconButton>
        </Box>
    );
};

export default CardLanguageSuggestionBanner;
