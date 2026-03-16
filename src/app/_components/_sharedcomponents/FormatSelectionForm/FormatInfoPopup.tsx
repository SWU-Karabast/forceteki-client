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
import { SwuGameFormat, FormatLabels, CardPool, CardPoolLabels } from '@/app/_constants/constants';

type FormatInfoTopic = 'formats' | 'cardPool';

interface IFormatInfoPopupProps {
    open: boolean;
    onClose: () => void;
    topic: FormatInfoTopic;
}

const formatDescriptions: Record<SwuGameFormat, { summary: string; deckRules: string; notes?: string }> = {
    [SwuGameFormat.Premier]: {
        summary: 'The standard competitive format with a rotating card pool.',
        deckRules: '50-card minimum main deck, 10-card sideboard.',
        notes: 'Includes a suspended cards list. Sets rotate out over time.',
    },
    [SwuGameFormat.Eternal]: {
        summary: 'The competitive format with an ever-growing card pool — sets never rotate out.',
        deckRules: '50-card minimum main deck, 10-card sideboard.',
        notes: 'Includes a suspended cards list.',
    },
    [SwuGameFormat.Limited]: {
        summary: 'Simulates draft or sealed gameplay with a restricted card pool.',
        deckRules: '30-card minimum main deck, no sideboard restrictions.',
        notes: 'Card pool is limited to a single set unless Unlimited card pool is selected.',
    },
    [SwuGameFormat.Open]: {
        summary: 'A casual playtesting format. All cards are legal with no rotation and no suspended list.',
        deckRules: '50-card minimum main deck, no sideboard restrictions.',
        notes: 'Always uses the Unlimited card pool.',
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
        constructed: 'Simulates the legal card pool after the next set releases, including any rotation that would apply.',
        limited: 'Uses the next unreleased set as the card pool.',
    },
    [CardPool.Unlimited]: {
        summary: 'Opens up the card pool as much as the format allows.',
        constructed: 'All released cards are available with no set restrictions.',
        limited: 'All draft/sealed-legal cards are available. Cards from preconstructed products are still excluded.',
    },
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

const FormatInfoPopup: React.FC<IFormatInfoPopupProps> = ({ open, onClose, topic }) => {
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
            aria-labelledby="format-info-dialog-title"
            sx={styles.dialog}
        >
            <DialogTitle sx={styles.title} id="format-info-dialog-title">
                {topic === 'formats' ? 'Game Formats' : 'Card Pools'}
            </DialogTitle>
            <DialogContent>
                {topic === 'formats' ? (
                    Object.values(SwuGameFormat).map((fmt) => {
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
                ) : (
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
                )}
            </DialogContent>
            <DialogActions sx={styles.actions}>
                <PreferenceButton buttonFnc={onClose} text="Got it" variant="standard" />
            </DialogActions>
        </Dialog>
    );
};

export default FormatInfoPopup;
