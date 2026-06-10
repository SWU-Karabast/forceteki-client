import React from 'react';
import { Box, Popover, Typography } from '@mui/material';
import { useGame } from '@/app/_contexts/Game.context';
import { useConstantEffectHighlight } from '@/app/_contexts/ConstantEffectHighlight.context';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import {
    CardStyle,
    ICardData,
    IConstantEffect,
} from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import { debugBorder } from '@/app/_utils/debug';

interface IConstantEffectsPanelProps {
    trayPlayer: string;
}

const ConstantEffectsPanel: React.FC<IConstantEffectsPanelProps> = ({ trayPlayer }) => {
    const { connectedPlayer, constantEffects } = useGame();
    const { setHighlightedEffects } = useConstantEffectHighlight();

    const effects: IConstantEffect[] = React.useMemo(
        () => (constantEffects || []).filter((e) => e.source.controllerId === trayPlayer),
        [constantEffects, trayPlayer],
    );

    // One panel entry per source card; a card with multiple constant
    // effects gets a single thumbnail whose hover highlights all of them.
    const effectGroups: IConstantEffect[][] = React.useMemo(() => {
        const bySource = new Map<string, IConstantEffect[]>();
        for (const effect of effects) {
            const group = bySource.get(effect.sourceCardUuid);
            if (group) {
                group.push(effect);
            } else {
                bySource.set(effect.sourceCardUuid, [effect]);
            }
        }
        return [...bySource.values()];
    }, [effects]);

    const isConnectedPlayerPanel = trayPlayer === connectedPlayer;
    const borderColor = isConnectedPlayerPanel
        ? 'var(--initiative-blue)'
        : 'var(--initiative-red)';

    const [anchorElement, setAnchorElement] = React.useState<HTMLElement | null>(null);
    const [hoveredGroup, setHoveredGroup] = React.useState<IConstantEffect[] | null>(null);
    const hoverTimeout = React.useRef<number | undefined>(undefined);

    const handlePreviewOpen = (event: React.MouseEvent<HTMLElement>, group: IConstantEffect[]) => {
        const target = event.currentTarget;
        hoverTimeout.current = window.setTimeout(() => {
            setAnchorElement(target);
            setHoveredGroup(group);
            setHighlightedEffects(group);
        }, 200);
    };

    const handlePreviewClose = () => {
        clearTimeout(hoverTimeout.current);
        setAnchorElement(null);
        setHoveredGroup(null);
        setHighlightedEffects([]);
    };

    // Clear any lingering highlight if the panel unmounts mid-hover
    // (game end, orientation change, etc.)
    React.useEffect(() => {
        return () => {
            clearTimeout(hoverTimeout.current);
            setHighlightedEffects([]);
        };
    }, [setHighlightedEffects]);

    const styles = {
        panel: {
            ...debugBorder('cyan'),
            display: 'flex',
            position: 'absolute',
            ...(isConnectedPlayerPanel ? { bottom: '16rem' } : { top: '14rem' }),
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: '4px',
            minWidth: '3.5rem',
            padding: '4px',
            borderRadius: '6px',
            border: `2px solid ${borderColor}`,
            background: 'rgba(0, 0, 0, 0.35)',
            boxShadow: `0 0 8px ${borderColor}55`,
            overflowY: 'auto',
            overflowX: 'hidden',
            zIndex: '5',
            '&::-webkit-scrollbar': { width: '2px' },
            '&::-webkit-scrollbar-thumb': { backgroundColor: `${borderColor}88` },
        },
        emptyLabel: {
            fontSize: '0.55rem',
            color: 'rgba(255, 255, 255, 0.5)',
            textAlign: 'center',
            padding: '4px',
            userSelect: 'none',
        },
        effectThumbnail: {
            width: '100%',
            aspectRatio: '1.4 / 1',
            borderRadius: '4px',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: '25% 25%',
            border: `1px solid ${borderColor}`,
            position: 'relative',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: `0 0 6px ${borderColor}`,
                zIndex: 2,
            },
        },
        targetCountBadge: {
            position: 'absolute',
            bottom: '-4px',
            right: '-4px',
            minWidth: '1.1rem',
            height: '1.1rem',
            borderRadius: '50%',
            background: 'black',
            border: `1.5px solid ${borderColor}`,
            color: 'white',
            fontSize: '0.65rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
            padding: '0 4px',
            userSelect: 'none',
        },
        previewCard: {
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            padding: '0.75rem',
            maxWidth: '20rem',
            background: 'rgba(15, 20, 30, 0.95)',
            border: `1px solid ${borderColor}`,
            borderRadius: '6px',
            color: 'white',
            backdropFilter: 'blur(8px)',
        },
        previewTitle: {
            fontSize: '0.95rem',
            fontWeight: 700,
            color: borderColor,
            margin: 0,
        },
        previewSubtitle: {
            fontSize: '0.75rem',
            fontStyle: 'italic',
            color: 'rgba(255, 255, 255, 0.7)',
            margin: 0,
            marginTop: '-0.25rem',
        },
        previewDescription: {
            fontSize: '0.8rem',
            lineHeight: 1.4,
            color: 'rgba(255, 255, 255, 0.85)',
            margin: 0,
        },
        previewTargetsHeader: {
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'rgba(255, 255, 255, 0.55)',
            marginTop: '0.25rem',
        },
    };

    if (effectGroups.length === 0) {
        return (
            <Box sx={styles.panel} data-testid={`constant-effects-${trayPlayer}`}>
                <Typography sx={styles.emptyLabel}>No active effects</Typography>
            </Box>
        );
    }

    return (
        <>
            <Box sx={styles.panel} data-testid={`constant-effects-${trayPlayer}`}>
                {effectGroups.map((group) => {
                    const source = group[0].source;
                    const imageUrl = s3CardImageURL(
                        { setId: source.setId, type: source.type } as ICardData,
                        CardStyle.Plain,
                    );
                    // Same card can be targeted by several of this source's
                    // effects — dedupe so the badge shows distinct cards.
                    const uniqueTargetCount = new Set(group.flatMap((e) => e.targets)).size;
                    return (
                        <Box
                            key={group[0].sourceCardUuid}
                            sx={{
                                ...styles.effectThumbnail,
                                backgroundImage: `url(${imageUrl})`,
                            }}
                            onMouseEnter={(e) => handlePreviewOpen(e, group)}
                            onMouseLeave={handlePreviewClose}
                            data-effect-uuid={group[0].sourceCardUuid}
                            data-card-name={source.sourceTitle}
                            aria-label={`Constant effects from ${source.sourceTitle}: ${group.length} effect${group.length === 1 ? '' : 's'}, ${uniqueTargetCount} visible target${uniqueTargetCount === 1 ? '' : 's'}`}
                        >
                            {uniqueTargetCount > 0 && (
                                <Box sx={styles.targetCountBadge}>{uniqueTargetCount}</Box>
                            )}
                        </Box>
                    );
                })}
            </Box>

            <Popover
                open={Boolean(anchorElement) && Boolean(hoveredGroup)}
                anchorEl={anchorElement}
                onClose={handlePreviewClose}
                disableRestoreFocus
                sx={{ pointerEvents: 'none' }}
                anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
                transformOrigin={{ vertical: 'center', horizontal: 'left' }}
                slotProps={{ paper: { sx: { backgroundColor: 'transparent', boxShadow: 'none' } } }}
            >
                {hoveredGroup && (
                    <Box sx={styles.previewCard}>
                        <Typography sx={styles.previewTitle}>
                            {hoveredGroup[0].source.sourceTitle}
                        </Typography>
                        {hoveredGroup[0].source.sourceSubtitle && (
                            <Typography sx={styles.previewSubtitle}>
                                {hoveredGroup[0].source.sourceSubtitle}
                            </Typography>
                        )}
                        {hoveredGroup.map((effect, i) => (
                            <Typography key={i} sx={styles.previewDescription}>
                                {hoveredGroup.length > 1 ? '\u2022 ' : ''}
                                {effect.source.effectDescription ?? 'Active effect'}
                            </Typography>
                        ))}
                        <Typography sx={styles.previewTargetsHeader}>
                            {(() => {
                                const count = new Set(hoveredGroup.flatMap((e) => e.targets)).size;
                                return count === 0
                                    ? 'No visible targets'
                                    : `Targets (${count})`;
                            })()}
                        </Typography>
                    </Box>
                )}
            </Popover>
        </>
    );
};

export default ConstantEffectsPanel;