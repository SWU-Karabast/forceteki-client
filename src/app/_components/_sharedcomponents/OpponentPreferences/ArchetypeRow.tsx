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
            sx={{ ...styles.row(isSelected), ...(isEnabled ? null : styles.rowDisabled) }}
            onClick={onToggleSelection}
        >
            <Box sx={styles.toggle} onClick={stop}>
                <Checkbox
                    checked={isEnabled}
                    onChange={(e) => onToggleEnabled(e.target.checked)}
                    sx={styles.checkbox}
                    inputProps={{ 'aria-label': isEnabled ? 'Disable archetype' : 'Enable archetype' }}
                />
            </Box>
            <Box sx={styles.content}>
                <Box sx={styles.section}>
                    {leaderImageUrl ? (
                        <Box sx={{ ...styles.thumb, backgroundImage: `url(${leaderImageUrl})` }} />
                    ) : (
                        <Box sx={{ ...styles.thumb, ...styles.thumbPlaceholder }} />
                    )}
                    <Box sx={styles.textStack}>
                        <Typography sx={styles.title}>
                            {leader ? leader.name : 'Unknown leader'}
                        </Typography>
                        {leader?.subtitle && (
                            <Typography sx={styles.subtitle}>{leader.subtitle}</Typography>
                        )}
                    </Box>
                </Box>
                <Box sx={styles.section}>
                    {uniqueBaseImageUrl ? (
                        <Box sx={{ ...styles.baseTile, backgroundImage: `url(${uniqueBaseImageUrl})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }} />
                    ) : (
                        <Box sx={styles.baseTile}>
                            <BaseTilePreview kind={tileKind} aspects={baseAspects} />
                        </Box>
                    )}
                    <Box sx={styles.textStack}>
                        <Typography sx={styles.title}>{baseTitle}</Typography>
                    </Box>
                </Box>
            </Box>
            <Box sx={styles.editSlot} onClick={stop}>
                <PreferenceButton variant="standard" text="Edit" buttonFnc={onEdit} />
            </Box>
            <Box
                sx={{ ...styles.selectionCheckmark, visibility: isSelected ? 'visible' : 'hidden' }}
                aria-hidden={!isSelected}
            >
                <Typography sx={styles.checkmarkSymbol}>✓</Typography>
            </Box>
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
