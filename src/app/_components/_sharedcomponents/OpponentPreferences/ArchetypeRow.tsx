import React from 'react';
import { Box, Checkbox, Typography } from '@mui/material';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { CardStyle } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import { Aspect, IBaseTypeOption, OpponentArchetype } from '@/app/_constants/constants';
import BaseTilePreview from './BaseTilePreview';
import {
    LeaderOption,
    baseTileKindFor,
    cardImageUrl,
    formatBaseTitle,
} from './utils';

interface IArchetypeRowProps {
    archetype: OpponentArchetype;
    isSelected: boolean;
    leader: LeaderOption | null;
    baseType: IBaseTypeOption | null;
    baseAspects: Aspect[];
    onToggleSelection: () => void;
    onToggleEnabled: (enabled: boolean) => void;
    onEdit: () => void;
    isReadOnly?: boolean;
}

const ArchetypeRow: React.FC<IArchetypeRowProps> = ({
    archetype,
    isSelected,
    leader,
    baseType,
    baseAspects,
    onToggleSelection,
    onToggleEnabled,
    onEdit,
    isReadOnly = false,
}) => {
    const isEnabled = archetype.enabled !== false;
    const tileKind = baseTileKindFor(archetype.baseConstraint, baseType);
    const baseTitle = formatBaseTitle(archetype.baseConstraint, baseType);
    const leaderImageUrl = leader ? cardImageUrl(leader.id, CardStyle.PlainLeader) : null;
    const uniqueBaseImageUrl = baseType && baseType.baseIds.length === 1
        ? cardImageUrl(baseType.id)
        : null;
    const stop = (e: React.MouseEvent) => e.stopPropagation();

    return (
        <Box
            sx={{
                ...styles.row(isSelected && !isReadOnly),
                ...(isEnabled ? null : styles.rowDisabled),
                ...(isReadOnly ? styles.rowReadOnly : null),
            }}
            onClick={isReadOnly ? undefined : onToggleSelection}
        >
            {!isReadOnly && (
                <Box sx={styles.toggle} onClick={stop}>
                    <Checkbox
                        checked={isEnabled}
                        onChange={(e) => onToggleEnabled(e.target.checked)}
                        sx={styles.checkbox}
                        inputProps={{ 'aria-label': isEnabled ? 'Disable archetype' : 'Enable archetype' }}
                    />
                </Box>
            )}
            <Box sx={{ ...styles.content, ...(isReadOnly ? styles.contentReadOnly : null) }}>
                <Box sx={{ ...styles.section, ...(isReadOnly ? styles.sectionReadOnly : null) }}>
                    {leaderImageUrl ? (
                        <Box sx={{ ...styles.thumb, ...(isReadOnly ? styles.thumbReadOnly : null), backgroundImage: `url(${leaderImageUrl})` }} />
                    ) : (
                        <Box sx={{ ...styles.thumb, ...(isReadOnly ? styles.thumbReadOnly : null), ...styles.thumbPlaceholder }} />
                    )}
                    <Box sx={styles.textStack}>
                        <Typography sx={{ ...styles.title, ...(isReadOnly ? styles.titleReadOnly : null) }}>
                            {leader ? leader.name : 'Unknown leader'}
                        </Typography>
                        {leader?.subtitle && (
                            <Typography sx={styles.subtitle}>{leader.subtitle}</Typography>
                        )}
                    </Box>
                </Box>
                <Box sx={{ ...styles.section, ...(isReadOnly ? styles.sectionReadOnly : null) }}>
                    {uniqueBaseImageUrl ? (
                        <Box sx={{ ...styles.baseTile, ...(isReadOnly ? styles.thumbReadOnly : null), backgroundImage: `url(${uniqueBaseImageUrl})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }} />
                    ) : (
                        <Box sx={{ ...styles.baseTile, ...(isReadOnly ? styles.thumbReadOnly : null) }}>
                            <BaseTilePreview kind={tileKind} aspects={baseAspects} />
                        </Box>
                    )}
                    <Box sx={styles.textStack}>
                        <Typography sx={{ ...styles.title, ...(isReadOnly ? styles.titleReadOnly : null) }}>{baseTitle}</Typography>
                    </Box>
                </Box>
            </Box>
            {!isReadOnly && (
                <Box sx={styles.editSlot} onClick={stop}>
                    <PreferenceButton variant="standard" text="Edit" buttonFnc={onEdit} />
                </Box>
            )}
            {!isReadOnly && (
                <Box
                    sx={{ ...styles.selectionCheckmark, visibility: isSelected ? 'visible' : 'hidden' }}
                    aria-hidden={!isSelected}
                >
                    <Typography sx={styles.checkmarkSymbol}>✓</Typography>
                </Box>
            )}
        </Box>
    );
};

const styles = {
    row: (isSelected: boolean) => ({
        background: isSelected ? '#2F7DB680' : '#20344280',
        borderRadius: '5px',
        border: '2px solid transparent',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
        position: 'relative' as const,
        '&:hover': { backgroundColor: '#2F7DB680' },
    }),
    rowDisabled: { opacity: 0.55 },
    rowReadOnly: {
        cursor: 'default',
        padding: '4px 8px',
        gap: '8px',
        containerType: 'inline-size' as const,
        '&:hover': { backgroundColor: '#20344280' },
    },
    // In read-only mode, the row's content is a flex container that switches
    // from row to column when the row's own width drops below 22rem. This is
    // a CSS container query — it reacts to the row's container width (set via
    // containerType above), not the viewport — so each row independently
    // decides whether leader/base sit inline or stack.
    contentReadOnly: {
        flexWrap: 'nowrap' as const,
        flexDirection: 'row' as const,
        gap: '6px 10px',
        '@container (max-width: 22rem)': {
            flexDirection: 'column' as const,
            alignItems: 'flex-start' as const,
        },
    },
    sectionReadOnly: {
        flex: '1 1 0',
        minWidth: 0,
        '@container (max-width: 22rem)': {
            flex: 'none',
            width: '100%',
        },
    },
    thumbReadOnly: { width: '3rem', height: '2.15rem' },
    titleReadOnly: {
        fontSize: '0.95em',
        whiteSpace: 'normal' as const,
        overflow: 'visible',
        textOverflow: 'clip' as const,
    },
    toggle: {
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
    },
    checkbox: {
        flexShrink: 0,
        color: '#fff',
        '&.Mui-checked': { color: '#fff' },
    },
    content: {
        display: 'flex',
        flexWrap: 'wrap' as const,
        alignItems: 'center',
        gap: '8px 16px',
        flex: '1 1 auto',
        minWidth: 0,
    },
    section: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flex: '1 1 16rem',
        minWidth: 0,
    },
    thumb: {
        width: '4rem',
        height: '2.85rem',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        borderRadius: '4px',
        flexShrink: 0,
    },
    thumbPlaceholder: { border: '1px dashed rgba(255, 255, 255, 0.18)' },
    baseTile: {
        width: '4rem',
        height: '2.85rem',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: '4px',
        flexShrink: 0,
        fontSize: '1rem',
    },
    textStack: {
        display: 'flex',
        flexDirection: 'column' as const,
        minWidth: 0,
        flex: '1 1 auto',
        overflow: 'hidden',
    },
    title: {
        color: '#fff',
        fontSize: '1.1em',
        fontWeight: 600,
        margin: 0,
        lineHeight: 1.25,
        whiteSpace: 'nowrap' as const,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    subtitle: {
        color: '#bbbbbb',
        fontSize: '0.85em',
        margin: 0,
        lineHeight: 1.25,
        whiteSpace: 'nowrap' as const,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    editSlot: {
        display: 'flex',
        flexShrink: 0,
    },
    selectionCheckmark: {
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        backgroundColor: '#66E5FF',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    checkmarkSymbol: {
        color: '#1E2D32',
        fontWeight: 'bold',
        fontSize: '13px',
        lineHeight: 1,
    },
};

export default ArchetypeRow;
