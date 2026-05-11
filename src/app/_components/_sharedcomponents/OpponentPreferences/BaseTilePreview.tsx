import React from 'react';
import { Box } from '@mui/material';
import { BASE_ASPECTS, aspectHasIcon, aspectIconUrl } from './utils';

export type BaseTileKind = 'force' | 'splash' | 'standard' | 'unknown' | 'aspect' | 'any';

interface IBaseTilePreviewProps {
    kind: BaseTileKind;
    aspects: string[];
}

// Inner icon layout for a base-type preview. Sizes are in `em` units so the
// parent's `font-size` controls the scale — used at small size in the list
// row and at larger size in the edit dialog.
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
