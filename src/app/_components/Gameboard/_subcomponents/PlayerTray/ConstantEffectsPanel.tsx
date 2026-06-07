import React from 'react';
import { Box, Popover, Typography } from '@mui/material';
import { useGame } from '@/app/_contexts/Game.context';
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
    const { connectedPlayer, constantEffects, setHighlightedEffect } = useGame();

    const effects: IConstantEffect[] = (constantEffects || []).filter(
        (e) => e.cardData.controllerId === trayPlayer,
    );

    const isConnectedPlayerPanel = trayPlayer === connectedPlayer;
    const borderColor = isConnectedPlayerPanel
        ? 'var(--initiative-blue)'
        : 'var(--initiative-red)';

    const [anchorElement, setAnchorElement] = React.useState<HTMLElement | null>(null);
    const [hoveredEffect, setHoveredEffect] = React.useState<IConstantEffect | null>(null);
    const hoverTimeout = React.useRef<number | undefined>(undefined);

    const handlePreviewOpen = (event: React.MouseEvent<HTMLElement>, effect: IConstantEffect) => {
        const target = event.currentTarget;
        hoverTimeout.current = window.setTimeout(() => {
            setAnchorElement(target);
            setHoveredEffect(effect);
            setHighlightedEffect(effect);
        }, 200);
    };

    const handlePreviewClose = () => {
        clearTimeout(hoverTimeout.current);
        setAnchorElement(null);
        setHoveredEffect(null);
        setHighlightedEffect(null);
    };

    React.useEffect(() => {
        return () => {
            clearTimeout(hoverTimeout.current);
            setHighlightedEffect(null);
        };
    }, [setHighlightedEffect]);

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
        previewTargetItem: {
            fontSize: '0.75rem',
            color: 'white',
            margin: 0,
            paddingLeft: '0.5rem',
        },
    };

    if (effects.length === 0) {
        return (
            <Box sx={styles.panel} data-testid={`constant-effects-${trayPlayer}`}>
                <Typography sx={styles.emptyLabel}>No active effects</Typography>
            </Box>
        );
    }

    return (
        <>
            <Box sx={styles.panel} data-testid={`constant-effects-${trayPlayer}`}>
                {effects.map((effect) => {
                    const imageUrl = s3CardImageURL(
                        { ...effect.cardData } as unknown as ICardData,
                        CardStyle.Plain,
                    );
                    const targetCount = effect.targets.length;
                    return (
                        <Box
                            key={effect.sourceCardUuid}
                            sx={{
                                ...styles.effectThumbnail,
                                backgroundImage: `url(${imageUrl})`,
                            }}
                            onMouseEnter={(e) => handlePreviewOpen(e, effect)}
                            onMouseLeave={handlePreviewClose}
                            data-effect-uuid={effect.sourceCardUuid}
                            data-card-name={effect.cardData.name}
                            aria-label={`Constant effect: ${effect.cardData.effectMetadata.effectTitle}, ${targetCount} target${targetCount === 1 ? '' : 's'}`}
                        >
                        </Box>
                    );
                })}
            </Box>

            <Popover
                open={Boolean(anchorElement) && Boolean(hoveredEffect)}
                anchorEl={anchorElement}
                onClose={handlePreviewClose}
                disableRestoreFocus
                sx={{ pointerEvents: 'none' }}
                anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
                transformOrigin={{ vertical: 'center', horizontal: 'left' }}
                slotProps={{ paper: { sx: { backgroundColor: 'transparent', boxShadow: 'none' } } }}
            >
                {hoveredEffect && (
                    <Box sx={styles.previewCard}>
                        <Typography sx={styles.previewTitle}>
                            {hoveredEffect.cardData.effectMetadata.effectTitle}
                        </Typography>
                        {hoveredEffect.cardData.effectMetadata.effectSubtitle && (
                            <Typography sx={styles.previewSubtitle}>
                                {hoveredEffect.cardData.effectMetadata.effectSubtitle}
                            </Typography>
                        )}
                        {hoveredEffect.cardData.effectMetadata.effectDescription && (
                            <Typography sx={styles.previewDescription}>
                                {hoveredEffect.cardData.effectMetadata.effectDescription}
                            </Typography>
                        )}
                        <Typography sx={styles.previewTargetsHeader}>
                            {hoveredEffect.targets.length === 0
                                ? 'No targets'
                                : `Targets (${hoveredEffect.targets.length})`}
                        </Typography>
                    </Box>
                )}
            </Popover>
        </>
    );
};

export default ConstantEffectsPanel;