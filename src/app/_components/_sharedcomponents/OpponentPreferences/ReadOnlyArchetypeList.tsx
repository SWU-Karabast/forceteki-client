import React from 'react';
import { Box } from '@mui/material';
import ArchetypeRow from './ArchetypeRow';
import { archetypeRowBaseAspects, resolveBaseType } from './utils';
import { OpponentArchetype } from '@/app/_constants/constants';
import { IArchetypeLookup } from '@/app/_utils/archetypeLookup';

interface IReadOnlyArchetypeListProps {
    archetypes: OpponentArchetype[];
    lookup: IArchetypeLookup | null;
    maxHeight?: string;
}

/**
 * Grid of read-only ArchetypeRow entries. Used by both the lobby browser's
 * "Allowed Archetypes" detail modal and the JoinFilteredLobbyModal.
 */
const ReadOnlyArchetypeList: React.FC<IReadOnlyArchetypeListProps> = ({ archetypes, lookup, maxHeight = '60vh' }) => {
    const styles = {
        list: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(18rem, 1fr))',
            gap: '6px 10px',
            maxHeight,
            overflowY: 'auto' as const,
        },
    };

    return (
        <Box sx={styles.list}>
            {archetypes.map((arch, i) => {
                const baseType = resolveBaseType(arch.baseConstraint, lookup?.baseTypesByJoinedIds ?? new Map());
                return (
                    <ArchetypeRow
                        key={i}
                        archetype={arch}
                        isSelected={false}
                        leader={lookup?.leaderById.get(arch.leaderId) ?? null}
                        baseType={baseType}
                        baseAspects={archetypeRowBaseAspects(arch.baseConstraint, baseType)}
                        onToggleSelection={() => undefined}
                        onToggleEnabled={() => undefined}
                        onEdit={() => undefined}
                        isReadOnly
                    />
                );
            })}
        </Box>
    );
};

export default ReadOnlyArchetypeList;
