import React from 'react';
import { Box, Popover, Typography } from '@mui/material';
import { useGame } from '@/app/_contexts/Game.context';
import { useConstantEffectHighlight } from '@/app/_contexts/ConstantEffectHighlight.context';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import { useCardImageLocale } from '@/app/_contexts/CardImageLocale.context';
import {
    CardStyle,
    ICardData,
    IConstantEffect,
} from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import useScreenOrientation from '@/app/_utils/useScreenOrientation';


interface IConstantEffectsPanelProps {
    trayPlayer: string;
}

const ConstantEffectsPanel: React.FC<IConstantEffectsPanelProps> = ({ trayPlayer }) => {
    const { connectedPlayer, constantEffects } = useGame();
    const { setHighlightedEffects } = useConstantEffectHighlight();
    const locale = useCardImageLocale();
    const effects: IConstantEffect[] = React.useMemo(
        () => (constantEffects || []).filter((e) => e.source.controllerId === trayPlayer),
        [constantEffects, trayPlayer],
    );

    const { isPortrait } = useScreenOrientation();
    // group effects by source card
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
        // Touch devices open via tap (handleTap)
        if (window.matchMedia('(pointer: coarse)').matches) return;

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

    React.useEffect(() => {
        return () => {
            clearTimeout(hoverTimeout.current);
            setHighlightedEffects([]);
        };
    }, [setHighlightedEffects]);

    const handleTap = (event: React.MouseEvent<HTMLElement>, group: IConstantEffect[]) => {
        // tap is touch-only.
        if (!window.matchMedia('(pointer: coarse)').matches) return;

        const isSameGroup = hoveredGroup?.[0].sourceCardUuid === group[0].sourceCardUuid;
        if (isSameGroup) {
            handlePreviewClose();
        } else {
            setAnchorElement(event.currentTarget);
            setHoveredGroup(group);
            setHighlightedEffects(group);
        }
    };
    const countVisibleTargets = (group: IConstantEffect[]) => new Set(group.flatMap((e) => e.targets)).size;
    const hoveredTargetsCount = hoveredGroup ? countVisibleTargets(hoveredGroup) : 0;

    const styles = {
        panel: {
            display: 'flex',
            position: 'absolute',
            left: '0.5rem',
            maxHeight: '42%',
            ...(isConnectedPlayerPanel ? { top: '51%' } : { bottom: '51%' }),
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'clamp(3px, 0.6vmin, 6px)',
            width: 'clamp(2.75rem, 7vw, 6rem)',
            padding: 'clamp(3px, 0.6vmin, 6px)',
            borderRadius: '6px',
            background: 'rgba(0, 0, 0, 0.35)',
            boxShadow: `0 0 8px ${borderColor}55`,
            overflowY: 'auto',
            overflowX: 'hidden',
            zIndex: 5,
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
            border: `2px solid ${borderColor}`,
            position: 'relative',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        },
        targetCountBadge: {
            position: 'absolute',
            bottom: '-4px',
            right: '-4px',
            minWidth: 'clamp(0.9rem, 2.4vmin, 1.1rem)',
            height: 'clamp(0.9rem, 2.4vmin, 1.1rem)',
            borderRadius: '50%',
            background: 'black',
            border: `1.5px solid ${borderColor}`,
            color: 'white',
            fontSize: 'clamp(0.5rem, 1.4vmin, 0.65rem)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
            padding: '0 3px',
            userSelect: 'none',
        },
        previewCard: {
            maxWidth: 'min(20rem, 80vw)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            padding: '0.75rem',
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
                        locale,
                        CardStyle.Plain,
                    );
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
                            onClick={(e) => handleTap(e, group)}
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
                // Tooltip content takes no focus
                // to avoid aria-hidden warnings when it closes.
                disableAutoFocus
                sx={{ pointerEvents: isPortrait ? 'auto' : 'none' }}
                anchorOrigin={{ vertical: 'center', horizontal: isPortrait ? 'left' : 'right' }}
                transformOrigin={{ vertical: 'center', horizontal: isPortrait ? 'right' : 'left' }}
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
                            {hoveredTargetsCount === 0 ? 'No visible targets' : `Targets (${hoveredTargetsCount})`}
                        </Typography>
                    </Box>
                )}
            </Popover>
        </>
    );
};

export default ConstantEffectsPanel;