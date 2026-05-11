import React from 'react';
import { Box } from '@mui/material';
import { aspectHasIcon, aspectIconUrl } from './utils';

export type BaseTileKind = 'force' | 'splash' | 'vanilla' | 'themed' | 'aspect' | 'any';

interface IBaseTilePreviewProps {
    kind: BaseTileKind;
    aspects: string[];
}

const BASE_ASPECTS = ['aggression', 'command', 'cunning', 'vigilance'];

// Renders the inner icon layout for a base-type preview. All sizes are in
// `em` units so the parent's `font-size` controls the scale — the list row
// passes a small font-size and the edit dialog passes a larger one, but the
// arrangement (force-token overlap, splash tiered layout, 4-aspect cluster)
// stays identical between the two surfaces.
const BaseTilePreview: React.FC<IBaseTilePreviewProps> = ({ kind, aspects }) => {
    const renderableAspects = aspects.filter(aspectHasIcon);

    if (kind === 'any') {
        return (
            <Box sx={styles.anyWrap} aria-hidden>
                <Box sx={styles.anyCluster}>
                    {BASE_ASPECTS.map((aspect) => (
                        <Box
                            key={aspect}
                            component="img"
                            src={aspectIconUrl(aspect)}
                            alt=""
                            sx={styles.anyIcon}
                        />
                    ))}
                </Box>
            </Box>
        );
    }

    if (kind === 'force') {
        return (
            <Box sx={styles.forceTile}>
                {renderableAspects.map((aspect) => (
                    <Box
                        key={aspect}
                        component="img"
                        src={aspectIconUrl(aspect)}
                        alt={aspect}
                        sx={styles.mainAspectIcon}
                    />
                ))}
                <Box
                    component="img"
                    src="/ForceTokenHeroism.png"
                    alt=""
                    sx={styles.forceBadge}
                />
            </Box>
        );
    }

    if (kind === 'splash') {
        const others = BASE_ASPECTS.filter((a) => !renderableAspects.includes(a));
        return (
            <Box sx={styles.splashTile}>
                <Box sx={styles.splashRow}>
                    {renderableAspects.map((aspect) => (
                        <Box
                            key={aspect}
                            component="img"
                            src={aspectIconUrl(aspect)}
                            alt={aspect}
                            sx={styles.mainAspectIcon}
                        />
                    ))}
                </Box>
                <Box sx={styles.splashRow}>
                    {others.map((aspect) => (
                        <Box
                            key={aspect}
                            component="img"
                            src={aspectIconUrl(aspect)}
                            alt=""
                            sx={styles.splashOtherIcon}
                        />
                    ))}
                </Box>
            </Box>
        );
    }

    // vanilla / themed / aspect-only constraint: just the aspect icon(s)
    return (
        <Box sx={styles.aspectRow}>
            {renderableAspects.map((aspect) => (
                <Box
                    key={aspect}
                    component="img"
                    src={aspectIconUrl(aspect)}
                    alt={aspect}
                    sx={styles.mainAspectIcon}
                />
            ))}
        </Box>
    );
};

const styles = {
    aspectRow: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.1em',
    },
    mainAspectIcon: {
        width: '1.5em',
        height: '1.5em',
        objectFit: 'contain' as const,
    },
    forceTile: {
        width: '100%',
        height: '100%',
        position: 'relative' as const,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.1em',
    },
    forceBadge: {
        // Partial overlap with the centred aspect icon — badge sits at the
        // lower-right and bites into the icon's bottom-right quadrant.
        position: 'absolute' as const,
        width: '1.1em',
        height: '1.1em',
        right: '0.65em',
        bottom: '0.2em',
        objectFit: 'contain' as const,
    },
    splashTile: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.1em',
    },
    splashRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.1em',
    },
    splashOtherIcon: {
        width: '0.45em',
        height: '0.45em',
        objectFit: 'contain' as const,
    },
    anyWrap: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    anyCluster: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.05em',
    },
    anyIcon: {
        width: '0.85em',
        height: '0.85em',
        objectFit: 'contain' as const,
    },
};

export default BaseTilePreview;
