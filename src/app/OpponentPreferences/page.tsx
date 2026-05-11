'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import ConfirmationDialog from '@/app/_components/_sharedcomponents/DeckPage/ConfirmationDialog';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import EditArchetypeDialog from '@/app/_components/_sharedcomponents/OpponentPreferences/EditArchetypeDialog';
import ArchetypeRow from '@/app/_components/_sharedcomponents/OpponentPreferences/ArchetypeRow';
import {
    archetypesEqual,
    aspectHasIcon,
    baseTypeDisplayName,
    LeaderOption,
    leaderLabel,
} from '@/app/_components/_sharedcomponents/OpponentPreferences/utils';
import {
    Aspect,
    BaseConstraint,
    IBaseTypeOption,
    OpponentArchetype,
    MatchPreferences,
} from '@/app/_constants/constants';
import { loadMatchPreferences, saveMatchPreferences } from '@/app/_utils/matchPreferences';

const OpponentPreferencesPage: React.FC = () => {
    const [prefs, setPrefs] = useState<MatchPreferences>(() => loadMatchPreferences());
    const [leaders, setLeaders] = useState<LeaderOption[]>([]);
    const [baseTypes, setBaseTypes] = useState<IBaseTypeOption[]>([]);
    const [loaded, setLoaded] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingDraft, setEditingDraft] = useState<OpponentArchetype | null>(null);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const [leadersRes, baseTypesRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/all-leaders`),
                    fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/all-base-types`),
                ]);
                if (!leadersRes.ok || !baseTypesRes.ok) {
                    throw new Error(`Failed to load leaders/base types (${leadersRes.status}/${baseTypesRes.status})`);
                }
                const leadersData: LeaderOption[] = await leadersRes.json();
                const baseTypesData: IBaseTypeOption[] = await baseTypesRes.json();
                if (cancelled) {
                    return;
                }
                leadersData.sort((a, b) => leaderLabel(a).localeCompare(leaderLabel(b)));
                baseTypesData.sort((a, b) => {
                    const aspectCmp = (a.aspects ?? []).join('+').localeCompare((b.aspects ?? []).join('+'));
                    if (aspectCmp !== 0) return aspectCmp;
                    return baseTypeDisplayName(a).localeCompare(baseTypeDisplayName(b));
                });
                setLeaders(leadersData);
                setBaseTypes(baseTypesData);
                setLoaded(true);
            } catch (err) {
                if (cancelled) {
                    return;
                }
                setError(err instanceof Error ? err.message : 'Failed to load leader/base data');
            }
        };
        void load();
        return () => {
            cancelled = true;
        };
    }, []);

    const leaderById = useMemo(() => new Map(leaders.map((l) => [l.id, l])), [leaders]);
    const baseTypesByJoinedIds = useMemo(() => {
        const map = new Map<string, IBaseTypeOption>();
        for (const baseType of baseTypes) {
            map.set(baseType.baseIds.slice().sort().join('|'), baseType);
        }
        return map;
    }, [baseTypes]);

    const persist = (next: MatchPreferences) => {
        setPrefs(next);
        saveMatchPreferences(next);
    };

    const addArchetype = () => {
        setEditingIndex(null);
        setEditingDraft({ leaderId: '' });
    };

    const openEditDialog = (index: number) => {
        setEditingIndex(index);
        setEditingDraft({ ...prefs.allowedArchetypes[index] });
    };

    const closeEditDialog = () => {
        setEditingIndex(null);
        setEditingDraft(null);
    };

    const commitEditDialog = () => {
        if (editingDraft === null) {
            closeEditDialog();
            return;
        }
        let updated: OpponentArchetype[];
        if (editingIndex === null) {
            updated = [...prefs.allowedArchetypes, editingDraft];
        } else {
            updated = prefs.allowedArchetypes.slice();
            updated[editingIndex] = editingDraft;
        }
        persist({ ...prefs, allowedArchetypes: updated });
        closeEditDialog();
    };

    const draftIsDuplicate = editingDraft !== null && prefs.allowedArchetypes.some(
        (other, i) => i !== editingIndex && archetypesEqual(other, editingDraft),
    );

    const toggleSelection = (index: number) => {
        setSelectedIndices((prev) => (
            prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
        ));
    };

    const deleteSelected = () => {
        const removeSet = new Set(selectedIndices);
        const updated = prefs.allowedArchetypes.filter((_, i) => !removeSet.has(i));
        persist({ ...prefs, allowedArchetypes: updated });
        setSelectedIndices([]);
        setDeleteDialogOpen(false);
    };

    const setArchetypeEnabled = (index: number, enabled: boolean) => {
        const updated = prefs.allowedArchetypes.slice();
        updated[index] = { ...updated[index], enabled };
        persist({ ...prefs, allowedArchetypes: updated });
    };

    function resolveBaseType(constraint: BaseConstraint | undefined): IBaseTypeOption | null {
        if (constraint?.kind !== 'baseType') {
            return null;
        }
        return baseTypesByJoinedIds.get(constraint.baseIds.slice().sort().join('|')) ?? null;
    }

    function rowBaseAspects(constraint: BaseConstraint | undefined, baseType: IBaseTypeOption | null): Aspect[] {
        if (constraint?.kind === 'aspect') {
            return [constraint.aspect];
        }
        return (baseType?.aspects ?? []).filter(aspectHasIcon);
    }

    const enabledCount = prefs.allowedArchetypes.filter((a) => a.enabled !== false).length;
    const disabledCount = prefs.allowedArchetypes.length - enabledCount;

    // ----------------------Styles-----------------------------//
    const styles = {
        container: {
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            color: '#fff',
        },
        content: {
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            overflow: 'hidden',
        },
        pageHeading: {
            fontWeight: 600,
            marginBottom: '0.25rem',
        },
        intro: {
            color: '#cccccc',
            marginBottom: '1rem',
            maxWidth: '720px',
        },
        muted: {
            color: '#bbbbbb',
        },
        error: {
            color: '#ff8080',
        },
        emptyState: {
            padding: '2rem',
            borderRadius: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
            border: '1px dashed rgba(255, 255, 255, 0.18)',
            textAlign: 'center',
        },
        header: {
            width: '100%',
            flexDirection: 'row',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
        },
        toolbarSlot: {
            minWidth: '200px',
        },
        summary: {
            color: '#cccccc',
            fontSize: '0.95em',
            textAlign: 'center' as const,
            flex: '1 1 auto',
        },
        rowList: {
            mt: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(24rem, 1fr))',
            gap: '8px 12px',
            overflowY: 'auto',
            maxHeight: '84%',
        },
    };

    return (
        <Box sx={styles.container}>
            <Box sx={styles.content}>
                <Typography variant="h4" sx={styles.pageHeading}>Opponent Match Preferences</Typography>
                <Typography sx={styles.intro}>
                    Choose the leader and base combinations you{'’'}re willing to play against in
                    the public queue. The default ({'“'}Any Opponent{'”'}) matches you against
                    anyone, like Karabast normally does.
                </Typography>

                {error && <Typography sx={styles.error}>{error}</Typography>}
                {!loaded && !error && <Typography sx={styles.muted}>Loading leaders and bases…</Typography>}

                {loaded && (
                    <Box sx={styles.header}>
                        <Box sx={styles.toolbarSlot}>
                            <PreferenceButton
                                variant="standard"
                                text="Add archetype"
                                buttonFnc={addArchetype}
                                disabled={leaders.length === 0}
                            />
                        </Box>
                        {prefs.allowedArchetypes.length > 0 && (
                            <Typography sx={styles.summary}>
                                {enabledCount} enabled · {disabledCount} disabled
                            </Typography>
                        )}
                        <Box sx={styles.toolbarSlot}>
                            <PreferenceButton
                                variant="concede"
                                text={'Delete archetype(s)'}
                                buttonFnc={() => setDeleteDialogOpen(true)}
                                disabled={selectedIndices.length === 0}
                            />
                        </Box>
                    </Box>
                )}

                {loaded && prefs.allowedArchetypes.length === 0 && (
                    <Box sx={styles.emptyState}>
                        <Typography sx={styles.muted}>
                            No archetypes added yet. Click {'“'}Add archetype{'”'} above to start filtering.
                        </Typography>
                    </Box>
                )}

                {loaded && prefs.allowedArchetypes.length > 0 && (
                    <Box sx={styles.rowList}>
                        {prefs.allowedArchetypes.map((archetype, index) => {
                            const baseType = resolveBaseType(archetype.baseConstraint);
                            return (
                                <ArchetypeRow
                                    key={index}
                                    archetype={archetype}
                                    isSelected={selectedIndices.includes(index)}
                                    leader={leaderById.get(archetype.leaderId) ?? null}
                                    baseType={baseType}
                                    baseAspects={rowBaseAspects(archetype.baseConstraint, baseType)}
                                    onToggleSelection={() => toggleSelection(index)}
                                    onToggleEnabled={(enabled) => setArchetypeEnabled(index, enabled)}
                                    onEdit={() => openEditDialog(index)}
                                />
                            );
                        })}
                    </Box>
                )}
            </Box>
            <ConfirmationDialog
                open={deleteDialogOpen}
                title="Delete Archetypes"
                message={`Are you sure you want to delete ${selectedIndices.length} archetype${selectedIndices.length === 1 ? '' : 's'}? This action cannot be undone.`}
                onCancel={() => setDeleteDialogOpen(false)}
                onConfirm={deleteSelected}
                confirmButtonText="Delete"
            />
            {editingDraft !== null && (
                <EditArchetypeDialog
                    draft={editingDraft}
                    leaders={leaders}
                    baseTypes={baseTypes}
                    baseTypesByJoinedIds={baseTypesByJoinedIds}
                    leaderById={leaderById}
                    setDraft={setEditingDraft}
                    onCancel={closeEditDialog}
                    onCommit={commitEditDialog}
                    isDuplicate={draftIsDuplicate}
                />
            )}
        </Box>
    );
};

export default OpponentPreferencesPage;
