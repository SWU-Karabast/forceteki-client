'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Box, FormControl, FormControlLabel, MenuItem, Radio, RadioGroup, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useUser } from '@/app/_contexts/User.context';
import { getUserPayload, loadDecks, loadSavedDecks } from '@/app/_utils/ServerAndLocalStorageUtils';
import { fetchDeckData } from '@/app/_utils/fetchDeckData';
import { parseInputAsDeckData } from '@/app/_utils/checkJson';
import OverlayDialog from '@/app/_components/_sharedcomponents/OverlayDialog/OverlayDialog';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';
import { StoredDeck } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import { ILobby } from '@/app/_components/HomePage/HomePageTypes';
import { Aspect, OpponentArchetype } from '@/app/_constants/constants';
import { useArchetypeLookup } from '@/app/_utils/archetypeLookup';
import ReadOnlyArchetypeList from '@/app/_components/_sharedcomponents/OpponentPreferences/ReadOnlyArchetypeList';

interface IJoinFilteredLobbyModalProps {
    lobby: ILobby;
    onClose: () => void;
}

type DeckSourceMode = 'saved' | 'new';

const JoinFilteredLobbyModal: React.FC<IJoinFilteredLobbyModalProps> = ({ lobby, onClose }) => {
    const router = useRouter();
    const { user } = useUser();
    const { data: session } = useSession();
    const lookup = useArchetypeLookup();

    const [savedDecks, setSavedDecks] = useState<StoredDeck[]>([]);
    const [deckSourceMode, setDeckSourceMode] = useState<DeckSourceMode>('saved');
    const [selectedSavedDeckId, setSelectedSavedDeckId] = useState<string>('');
    const [deckInput, setDeckInput] = useState<string>('');
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const sessionUser = session?.user as { userId?: string } | undefined;
                const decks = sessionUser?.userId && user
                    ? await loadDecks(user)
                    : loadSavedDecks();
                if (cancelled) return;
                const sorted = [...decks].sort((a, b) => {
                    if (a.favourite && !b.favourite) return -1;
                    if (!a.favourite && b.favourite) return 1;
                    return 0;
                });
                setSavedDecks(sorted);
                if (sorted.length > 0) {
                    setSelectedSavedDeckId((prev) => prev || sorted[0].deckID);
                }
            } catch (err) {
                if (cancelled) return;
                console.error('JoinFilteredLobbyModal: error loading decks', err);
            }
        })();
        return () => { cancelled = true; };
    }, [session?.user, user]);

    const activeArchetypes = useMemo(
        () => (lobby.archetypeFilter ?? []).filter((a) => a.enabled !== false),
        [lobby.archetypeFilter],
    );

    const baseIdToAspects = useMemo(() => {
        const map = new Map<string, Aspect[]>();
        if (lookup) {
            for (const bt of lookup.baseTypesByJoinedIds.values()) {
                for (const id of bt.baseIds) {
                    map.set(id, bt.aspects ?? []);
                }
            }
        }
        return map;
    }, [lookup]);

    const archetypeMatches = (arch: OpponentArchetype, leaderId: string, baseId: string): boolean => {
        if (arch.leaderId !== leaderId) return false;
        const c = arch.baseConstraint;
        if (!c) return true;
        if (c.kind === 'baseType') return c.baseIds.includes(baseId);
        if (c.kind === 'aspect') {
            return (baseIdToAspects.get(baseId) ?? []).includes(c.aspect);
        }
        return false;
    };

    const deckMatchesFilter = (deck: StoredDeck): boolean => {
        if (!lookup) return true; // optimistic until lookup loads
        return activeArchetypes.some((a) => archetypeMatches(a, deck.leader.id, deck.base.id));
    };

    const handleSubmit = async () => {
        let source = '';
        if (deckSourceMode === 'saved') {
            const selected = savedDecks.find((d) => d.deckID === selectedSavedDeckId);
            if (!selected?.deckLink) {
                setErrorMsg('Please select a saved deck.');
                return;
            }
            source = selected.deckLink;
        } else {
            source = deckInput.trim();
            if (!source) {
                setErrorMsg('Please paste a deck link or JSON.');
                return;
            }
        }
        setSubmitting(true);
        setErrorMsg(null);
        try {
            const parsed = parseInputAsDeckData(source);
            let deckData;
            if (parsed.type === 'url') {
                deckData = await fetchDeckData(source, false);
            } else if (parsed.type === 'json') {
                deckData = parsed.data;
            } else {
                setErrorMsg('Could not parse deck — please paste a valid SWU deck link or JSON.');
                setSubmitting(false);
                return;
            }
            const payload = {
                lobbyId: lobby.id,
                user: getUserPayload(user),
                deck: deckData,
            };
            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/join-lobby`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include',
            });
            const result = await response.json();
            if (!response.ok) {
                setErrorMsg(result.message || 'Could not join lobby.');
                setSubmitting(false);
                return;
            }
            router.push('/lobby');
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : 'Error joining lobby.');
            setSubmitting(false);
        }
    };

    const decksWithMatchStatus = useMemo(() => {
        const enriched = savedDecks.map((deck) => ({ deck, matches: deckMatchesFilter(deck) }));
        enriched.sort((a, b) => {
            if (a.matches !== b.matches) return a.matches ? -1 : 1;
            if (a.deck.favourite !== b.deck.favourite) return a.deck.favourite ? -1 : 1;
            return a.deck.name.localeCompare(b.deck.name);
        });
        return enriched;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [savedDecks, lookup, activeArchetypes]);

    // Reset selection to first matching deck when lookup becomes available, in case
    // the initial auto-selection landed on a non-matching deck before the filter was known.
    useEffect(() => {
        if (!lookup || decksWithMatchStatus.length === 0) return;
        const current = decksWithMatchStatus.find((d) => d.deck.deckID === selectedSavedDeckId);
        if (current?.matches) return;
        const firstMatching = decksWithMatchStatus.find((d) => d.matches);
        setSelectedSavedDeckId(firstMatching ? firstMatching.deck.deckID : '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lookup, decksWithMatchStatus]);

    const submitDisabled = submitting
        || (deckSourceMode === 'saved' && !selectedSavedDeckId)
        || (deckSourceMode === 'new' && deckInput.trim().length === 0);

    const styles = {
        heading: { fontWeight: 600, color: '#fff', paddingRight: '2rem' },
        lobbyName: { color: '#cccccc', fontSize: '0.95rem' },
        sectionHeading: {
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.95rem',
            marginTop: '0.25rem',
        },
        radioGroupText: { color: '#fff', fontSize: '0.9rem' },
        error: { color: '#ff8080', fontSize: '0.85rem' },
        actions: {
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            marginTop: '0.5rem',
        },
    };

    return (
        <OverlayDialog onClose={onClose}>
            <Typography variant="h5" sx={styles.heading}>Join Filtered Lobby</Typography>
            <Typography sx={styles.lobbyName}>{lobby.name}</Typography>

            <Typography sx={styles.sectionHeading}>Allowed archetypes ({activeArchetypes.length})</Typography>
            <ReadOnlyArchetypeList archetypes={activeArchetypes} lookup={lookup} maxHeight="40vh" />

            <Typography sx={styles.sectionHeading}>Your deck</Typography>
            <FormControl component="fieldset">
                <RadioGroup
                    row
                    value={deckSourceMode}
                    onChange={(_, v) => setDeckSourceMode(v as DeckSourceMode)}
                >
                    <FormControlLabel
                        value="saved"
                        control={<Radio sx={{ color: '#fff', '&.Mui-checked': { color: '#fff' }, '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.35)' } }} />}
                        label={<Typography sx={styles.radioGroupText}>Saved deck</Typography>}
                    />
                    <FormControlLabel
                        value="new"
                        control={<Radio sx={{ color: '#fff', '&.Mui-checked': { color: '#fff' }, '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.35)' } }} />}
                        label={<Typography sx={styles.radioGroupText}>New deck link / JSON</Typography>}
                    />
                </RadioGroup>
            </FormControl>

            {deckSourceMode === 'saved' && (
                <StyledTextField
                    select
                    value={selectedSavedDeckId}
                    onChange={(e) => setSelectedSavedDeckId(e.target.value as string)}
                    disabled={submitting}
                    placeholder="Favorite Decks"
                    SelectProps={{ displayEmpty: true }}
                >
                    {decksWithMatchStatus.length === 0 ? (
                        <MenuItem value="" disabled>No saved decks found</MenuItem>
                    ) : (
                        decksWithMatchStatus.map(({ deck, matches }) => (
                            <MenuItem key={deck.deckID} value={deck.deckID} disabled={!matches}>
                                {deck.favourite ? '★ ' : ''}{deck.name}
                                {!matches && (
                                    <span style={{ marginLeft: '0.5rem', color: '#999', fontSize: '0.85em' }}>
                                        — doesn{'’'}t match filter
                                    </span>
                                )}
                            </MenuItem>
                        ))
                    )}
                </StyledTextField>
            )}

            {deckSourceMode === 'new' && (
                <StyledTextField
                    value={deckInput}
                    onChange={(e) => setDeckInput(e.target.value)}
                    placeholder="https://swudb.com/deck/..."
                    multiline
                    minRows={2}
                    maxRows={4}
                    disabled={submitting}
                />
            )}

            {errorMsg && <Typography sx={styles.error}>{errorMsg}</Typography>}

            <Box sx={styles.actions}>
                <PreferenceButton text="Cancel" buttonFnc={onClose} variant="standard" />
                <PreferenceButton
                    text={submitting ? 'Joining…' : 'Join'}
                    buttonFnc={handleSubmit}
                    variant="standard"
                    disabled={submitDisabled}
                />
            </Box>
        </OverlayDialog>
    );
};

export default JoinFilteredLobbyModal;
