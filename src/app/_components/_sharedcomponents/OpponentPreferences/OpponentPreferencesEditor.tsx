'use client';
import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import ConfirmationDialog from '@/app/_components/_sharedcomponents/DeckPage/ConfirmationDialog';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import EditArchetypeDialog from '@/app/_components/_sharedcomponents/OpponentPreferences/EditArchetypeDialog';
import ArchetypeRow from '@/app/_components/_sharedcomponents/OpponentPreferences/ArchetypeRow';
import {
    archetypeRowBaseAspects,
    archetypesEqual,
    resolveBaseType,
} from '@/app/_components/_sharedcomponents/OpponentPreferences/utils';
import {
    MatchPreferences,
    OpponentArchetype,
} from '@/app/_constants/constants';
import { loadMatchPreferences, saveMatchPreferences } from '@/app/_utils/matchPreferences';
import { useArchetypeLookup } from '@/app/_utils/archetypeLookup';

/**
 * Body of the opponent-preferences UI. Reads/writes localStorage and owns its
 * own edit state. Leader / base reference data comes from the shared
 * useArchetypeLookup hook so the create-lobby modal doesn't pay a second fetch.
 */
const OpponentPreferencesEditor: React.FC = () => {
    const lookup = useArchetypeLookup();
    const [prefs, setPrefs] = useState<MatchPreferences>(() => loadMatchPreferences());
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingDraft, setEditingDraft] = useState<OpponentArchetype | null>(null);

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

    const totalCount = prefs.allowedArchetypes.length;
    const enabledCount = prefs.allowedArchetypes.filter((a) => a.enabled !== false).length;
    const allEnabled = totalCount > 0 && enabledCount === totalCount;
    const setAllEnabled = (enabled: boolean) => {
        persist({
            ...prefs,
            allowedArchetypes: prefs.allowedArchetypes.map((a) => ({ ...a, enabled })),
        });
    };

    const styles = {
        container: {
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            color: '#fff',
        },
        muted: {
            color: '#bbbbbb',
        },
        emptyState: {
            padding: '2rem',
            borderRadius: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
            border: '1px dashed rgba(255, 255, 255, 0.18)',
            textAlign: 'center',
        },
        toolbar: {
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap' as const,
        },
        toolbarGroup: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap' as const,
        },
        bulkActionButton: {
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            fontSize: '0.85rem',
            pt: '6px',
            pb: '6px',
            '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                boxShadow: 'none',
            },
        },
        bulkEnableStatus: {
            color: '#cccccc',
            fontSize: '0.9em',
        },
        rowList: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(24rem, 1fr))',
            gap: '8px 12px',
            overflowY: 'auto',
            maxHeight: '60vh',
        },
    };

    if (!lookup) {
        return (
            <Box sx={styles.container}>
                <Typography sx={styles.muted}>Loading leaders and bases…</Typography>
            </Box>
        );
    }

    return (
        <Box sx={styles.container}>
            <Box sx={styles.toolbar}>
                <Box sx={styles.toolbarGroup}>
                    <PreferenceButton
                        variant="standard"
                        text="Add archetype"
                        buttonFnc={addArchetype}
                        disabled={lookup.leaders.length === 0}
                    />
                    {totalCount > 0 && (
                        <>
                            <PreferenceButton
                                variant="standard"
                                text="Enable all"
                                buttonFnc={() => setAllEnabled(true)}
                                disabled={allEnabled}
                                sx={styles.bulkActionButton}
                            />
                            <PreferenceButton
                                variant="standard"
                                text="Disable all"
                                buttonFnc={() => setAllEnabled(false)}
                                disabled={enabledCount === 0}
                                sx={styles.bulkActionButton}
                            />
                            <Typography sx={styles.bulkEnableStatus}>
                                {enabledCount} of {totalCount} enabled
                            </Typography>
                        </>
                    )}
                </Box>
                {totalCount > 0 && (
                    <PreferenceButton
                        variant="concede"
                        text={'Delete archetype(s)'}
                        buttonFnc={() => setDeleteDialogOpen(true)}
                        disabled={selectedIndices.length === 0}
                    />
                )}
            </Box>

            {prefs.allowedArchetypes.length === 0 ? (
                <Box sx={styles.emptyState}>
                    <Typography sx={styles.muted}>
                        No archetypes added yet. Click {'“'}Add archetype{'”'} above to start filtering.
                    </Typography>
                </Box>
            ) : (
                <Box sx={styles.rowList}>
                    {prefs.allowedArchetypes.map((archetype, index) => {
                        const baseType = resolveBaseType(archetype.baseConstraint, lookup.baseTypesByJoinedIds);
                        return (
                            <ArchetypeRow
                                key={index}
                                archetype={archetype}
                                isSelected={selectedIndices.includes(index)}
                                leader={lookup.leaderById.get(archetype.leaderId) ?? null}
                                baseType={baseType}
                                baseAspects={archetypeRowBaseAspects(archetype.baseConstraint, baseType)}
                                onToggleSelection={() => toggleSelection(index)}
                                onToggleEnabled={(enabled) => setArchetypeEnabled(index, enabled)}
                                onEdit={() => openEditDialog(index)}
                            />
                        );
                    })}
                </Box>
            )}

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
                    leaders={lookup.leaders}
                    baseTypes={lookup.baseTypes}
                    baseTypesByJoinedIds={lookup.baseTypesByJoinedIds}
                    leaderById={lookup.leaderById}
                    setDraft={setEditingDraft}
                    onCancel={closeEditDialog}
                    onCommit={commitEditDialog}
                    isDuplicate={draftIsDuplicate}
                />
            )}
        </Box>
    );
};

export default OpponentPreferencesEditor;
