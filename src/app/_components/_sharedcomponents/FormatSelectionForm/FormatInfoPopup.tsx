'use client';
import React from 'react';
import {
    Box,
    Typography,
    Dialog,
    DialogContent,
    DialogActions,
    DialogTitle,
} from '@mui/material';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { SwuGameFormat, FormatLabels, CardPool, CardPoolLabels, MatchmakingPreference, MatchmakingPreferenceLabels, getFormatsFromConfig } from '@/app/_constants/constants';
import type { IFormatModeConfig } from '@/app/_constants/constants';

type FormatInfoTopic = 'formats' | 'cardPool' | 'matchmakingPreference';

interface IFormatInfoPopupProps {
    open: boolean;
    onClose: () => void;
    topic: FormatInfoTopic;
    formatConfigs: IFormatModeConfig[];
}

const topicTitles: Record<FormatInfoTopic, string> = {
    formats: 'Game Formats',
    cardPool: 'Card Pools',
    matchmakingPreference: 'Matchmaking Preferences',
};

const formatDescriptions: Record<SwuGameFormat, { summary: string; deckRules: string; notes?: string }> = {
    [SwuGameFormat.Premier]: {
        summary: 'The standard competitive format with a rotating card pool.',
        deckRules: '50-card minimum main deck, 10-card sideboard.',
        notes: 'Includes a suspended cards list. Sets rotate out over time. Sideboard size rules are not enforced with the "Next Set" card pool.',
    },
    [SwuGameFormat.Eternal]: {
        summary: 'The competitive format with an ever-growing card pool — sets never rotate out.',
        deckRules: '50-card minimum main deck, 10-card sideboard.',
        notes: 'Includes a suspended cards list. Sideboard size rules are not enforced with the "Next Set" card pool.',
    },
    [SwuGameFormat.Limited]: {
        summary: 'Simulates draft or sealed gameplay with a restricted card pool.',
        deckRules: '30-card minimum main deck, no sideboard restrictions.',
        notes: 'Card pool is limited to a single set unless "Unlimited" card pool is selected.',
    },
    [SwuGameFormat.Open]: {
        summary: 'A casual playtesting format. All cards are legal with no rotation and no suspended list.',
        deckRules: '50-card minimum main deck, no sideboard restrictions.',
        notes: 'Always uses the "Unlimited" card pool.',
    },
    [SwuGameFormat.FauxSuns]: {
        summary: 'A singleton format where each player has two leaders. All cards are legal.',
        deckRules: '80-card minimum main deck, 1 copy of each card, 2 leaders, no sideboard restrictions.',
        notes: 'A Heroism leader can\'t be paired with a Villainy leader; a leader with neither aspect can pair with either. Uses Plan and Blast counters. Always uses the "Unlimited" card pool.',
    },
};

const cardPoolDescriptions: Record<CardPool, { summary: string; constructed: string; limited: string }> = {
    [CardPool.Current]: {
        summary: 'Play with the cards that are legal right now.',
        constructed: 'Includes only the currently legal sets for your chosen format.',
        limited: 'Uses only the most recent released set.',
    },
    [CardPool.NextSet]: {
        summary: 'Preview what the card pool will look like when the next set drops.',
        constructed: 'Simulates the legal card pool after the next set releases, including any rotation that would apply. Sideboard size rules are not enforced.',
        limited: 'Uses the next unreleased set as the card pool.',
    },
    [CardPool.Unlimited]: {
        summary: 'Opens up the card pool as much as the format allows.',
        constructed: 'All released cards are available with no set restrictions.',
        limited: 'All draft/sealed-legal cards are available. Cards from preconstructed products are still excluded.',
    },
};

const matchmakingPreferenceDescriptions: Record<MatchmakingPreference, string> = {
    [MatchmakingPreference.CompetitiveTesting]: 'Test competitive decks and practice tournament-style play.',
    [MatchmakingPreference.CasualBrewing]: 'Try new deck ideas or play a more relaxed game.',
    [MatchmakingPreference.NoPreference]: 'Search for either kind of game without a preference of your own.',
};

const styles = {
    dialog: {
        '& .MuiDialog-paper': {
            backgroundColor: '#1E2D32',
            borderRadius: '20px',
            maxWidth: '600px',
            width: '100%',
            padding: '20px',
            border: '2px solid transparent',
            background:
                'linear-gradient(#0F1F27, #030C13) padding-box, linear-gradient(to top, #30434B, #50717D) border-box',
        },
    },
    title: {
        color: '#018DC1',
        fontSize: '1.5rem',
        textAlign: 'left',
        padding: '0 0 8px 0',
    },
    sectionTitle: {
        color: '#fff',
        fontSize: '1rem',
        fontWeight: 600,
        marginTop: '12px',
    },
    sectionBody: {
        color: '#B4DCEB',
        fontSize: '0.9rem',
        marginTop: '-10px',
    },
    detailList: {
        marginTop: '-10px',
        paddingLeft: '24px',
        listStyleType: 'disc',
        '& li': { paddingLeft: '2px', marginBottom: '0px' },
        '& li::marker': { color: '#8AACBB' },
    },
    detailLabel: {
        color: '#8AACBB',
        fontSize: '0.85rem',
        fontWeight: 700,
    },
    detailBody: {
        color: '#8AACBB',
        fontSize: '0.85rem',
        fontWeight: 400,
    },
    actions: {
        justifyContent: 'center',
        padding: '16px 0 0 0',
    },
} as const;

const FormatInfoPopup: React.FC<IFormatInfoPopupProps> = ({ open, onClose, topic, formatConfigs }) => {
    const titleId = React.useId();
    const availableFormats = getFormatsFromConfig(formatConfigs);

    return (
        <Dialog
            open={open}
            onClose={(_event, reason) => {
                if (reason === 'backdropClick') {
                    onClose();
                    return;
                }
                onClose();
            }}
            aria-labelledby={titleId}
            sx={styles.dialog}
        >
            <DialogTitle sx={styles.title} id={titleId}>
                {topicTitles[topic]}
            </DialogTitle>
            <DialogContent>
                {topic === 'formats' ? (
                    Object.values(SwuGameFormat).filter((fmt) => availableFormats.includes(fmt)).map((fmt) => {
                        const desc = formatDescriptions[fmt];
                        return (
                            <Box key={fmt}>
                                <Typography sx={styles.sectionTitle}>
                                    {FormatLabels[fmt]}
                                </Typography>
                                <Typography sx={styles.sectionBody}>
                                    {desc.summary}
                                </Typography>
                                <Box component="ul" sx={styles.detailList}>
                                    <Typography component="li" sx={styles.detailBody}>
                                        <Box component="span" sx={styles.detailLabel}>Deck: </Box>
                                        {desc.deckRules}
                                    </Typography>
                                    {desc.notes && (
                                        <Typography component="li" sx={styles.detailBody}>
                                            {desc.notes}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        );
                    })
                ) : topic === 'cardPool' ? (
                    Object.values(CardPool).map((pool) => {
                        const desc = cardPoolDescriptions[pool];
                        return (
                            <Box key={pool}>
                                <Typography sx={styles.sectionTitle}>
                                    {CardPoolLabels[pool]}
                                </Typography>
                                <Typography sx={styles.sectionBody}>
                                    {desc.summary}
                                </Typography>
                                <Box component="ul" sx={styles.detailList}>
                                    <Typography component="li" sx={styles.detailBody}>
                                        <Box component="span" sx={styles.detailLabel}>Constructed: </Box>
                                        {desc.constructed}
                                    </Typography>
                                    <Typography component="li" sx={styles.detailBody}>
                                        <Box component="span" sx={styles.detailLabel}>Limited: </Box>
                                        {desc.limited}
                                    </Typography>
                                </Box>
                            </Box>
                        );
                    })
                ) : (
                    <>
                        {Object.values(MatchmakingPreference).map((preference) => (
                            <Box key={preference}>
                                <Typography sx={styles.sectionTitle}>
                                    {MatchmakingPreferenceLabels[preference]}
                                </Typography>
                                <Typography sx={styles.sectionBody}>
                                    {matchmakingPreferenceDescriptions[preference]}
                                </Typography>
                            </Box>
                        ))}
                        <Typography sx={styles.sectionTitle}>
                            How Matching Works
                        </Typography>
                        <Typography sx={styles.sectionBody}>
                            These are soft preferences, not separate queues. Your search broadens as you wait.
                        </Typography>
                        <Box component="ul" sx={styles.detailList}>
                            <Typography component="li" sx={styles.detailBody}>
                                Competitive and Casual searches start with opponents who chose the same preference.
                            </Typography>
                            <Typography component="li" sx={styles.detailBody}>
                                By default, No Preference opponents are included after 15 seconds, and all preferences are included after 30 seconds.
                            </Typography>
                            <Typography component="li" sx={styles.detailBody}>
                                No Preference is open to all categories immediately, but both players&apos; search windows must allow a match.
                            </Typography>
                        </Box>
                    </>
                )}
            </DialogContent>
            <DialogActions sx={styles.actions}>
                <PreferenceButton buttonFnc={onClose} text="Got it" variant="standard" />
            </DialogActions>
        </Dialog>
    );
};

export default FormatInfoPopup;
