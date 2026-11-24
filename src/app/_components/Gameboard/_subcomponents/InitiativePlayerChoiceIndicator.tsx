import React from 'react';
import Image from 'next/image';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/system';
import PanToolRoundedIcon from '@mui/icons-material/PanToolRounded';
import ShuffleRoundedIcon from '@mui/icons-material/ShuffleRounded';
import { s3TokenImageURL } from '@/app/_utils/s3Utils';
import { IInitiativePlayerChoice, InitiativePlayerChoiceIcon } from './InitiativePlayerChoice';

interface IInitiativePlayerChoiceIndicatorProps {
    choice: IInitiativePlayerChoice;
}

// shown beside the label while the initiative player is still choosing: the player may act without waiting for them
const CHOOSING_HINT = 'You can choose now or wait for them to decide';

// a portrait board is too narrow for the label and the hint side by side, and has the height for two lines
const PORTRAIT = '@media (orientation: portrait)';

// the prompt's own text shadow, which the row keeps so it reads as part of the prompt
const PROMPT_TEXT_SHADOW = '1px 1px 6px black';

const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

// played once when the initiative player's choice arrives, so a player who is waiting for it notices
const announce = keyframes`
    0% {
        transform: scale(0.9);
        opacity: 0;
        text-shadow: ${PROMPT_TEXT_SHADOW};
    }
    40% {
        transform: scale(1.12);
        opacity: 1;
        text-shadow: 0 0 12px rgba(255, 255, 255, 0.95);
    }
    100% {
        transform: scale(1);
        opacity: 1;
        text-shadow: ${PROMPT_TEXT_SHADOW};
    }
`;

const dotBounce = keyframes`
    0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.4;
    }
    30% {
        transform: translateY(-0.22em);
        opacity: 1;
    }
`;

/**
 * In the mulligan and the resource steps the player with the initiative chooses first. This shows the other player what
 * they have done so far: still choosing, or what they chose (never which cards they resourced). It is drawn inside the
 * prompt, as a row under the prompt's text, so it is styled as part of the prompt: the same white text, with an icon for
 * the choice.
 */
const InitiativePlayerChoiceIndicator: React.FC<IInitiativePlayerChoiceIndicatorProps> = ({ choice }) => {
    const decided = choice.icon !== undefined;
    const noResource = choice.icon === InitiativePlayerChoiceIcon.NoResource;

    // ----------------Styles----------------//
    const styles = {
        indicator: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.7em',
            color: 'white',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            textShadow: PROMPT_TEXT_SHADOW,
            animation: `${decided ? announce : fadeIn} ${decided ? '0.9s' : '0.3s'} ease-out`,
            '@media (prefers-reduced-motion: reduce)': {
                animation: 'none',
            },
            [PORTRAIT]: {
                flexDirection: 'column',
                gap: 0,
            },
        },
        mainLine: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5em',
        },
        label: {
            fontSize: '1em',
            fontWeight: 600,
            lineHeight: 1.3,
            color: 'inherit',
        },
        hint: {
            fontSize: '1em',
            fontWeight: 400,
            lineHeight: 1.3,
            color: 'rgba(255, 255, 255, 0.9)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.6)',
            paddingLeft: '0.7em',
            [PORTRAIT]: {
                borderLeft: 'none',
                paddingLeft: 0,
            },
        },
        dots: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.22em',
        },
        dot: (index: number) => ({
            width: '0.36em',
            height: '0.36em',
            borderRadius: '50%',
            backgroundColor: 'currentColor',
            animation: `${dotBounce} 1.2s ease-in-out ${index * 0.15}s infinite`,
            '@media (prefers-reduced-motion: reduce)': {
                animation: 'none',
            },
        }),
        iconWrapper: {
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            // a line through the resource icon when no card was resourced
            '&::after': {
                display: noResource ? 'block' : 'none',
                content: '""',
                position: 'absolute',
                left: '-25%',
                right: '-25%',
                top: '50%',
                height: '2px',
                backgroundColor: 'currentColor',
                // a dark edge keeps the line visible where it crosses the icon
                boxShadow: '0 0 2px 0.5px rgba(0, 0, 0, 0.9)',
                transform: 'translateY(-50%) rotate(-40deg)',
            },
        },
        resourceIcon: {
            height: '1.1em',
            width: 'auto',
            aspectRatio: '1 / 1.4',
            // faded when no card was resourced
            filter: noResource ? 'grayscale(1)' : 'none',
            opacity: noResource ? 0.55 : 1,
        },
        mulliganIcon: {
            fontSize: '1.1em',
            filter: 'drop-shadow(1px 1px 3px black)',
        },
    };

    const renderIcon = () => {
        switch (choice.icon) {
            case InitiativePlayerChoiceIcon.Resource:
            case InitiativePlayerChoiceIcon.NoResource:
                return (
                    <Image
                        src={s3TokenImageURL('resource-icon')}
                        alt=""
                        style={styles.resourceIcon}
                        height={72}
                        width={54}
                    />
                );
            case InitiativePlayerChoiceIcon.Mulligan:
                return <ShuffleRoundedIcon sx={styles.mulliganIcon} />;
            case InitiativePlayerChoiceIcon.Keep:
                return <PanToolRoundedIcon sx={styles.mulliganIcon} />;
            default:
                return null;
        }
    };

    return (
        // keyed by the choice so the entrance animation plays again each time it changes
        <Box
            key={choice.label}
            sx={styles.indicator}
            role="status"
            aria-label={decided ? choice.label : `${choice.label}. ${CHOOSING_HINT}`}
            data-testid="initiative-player-choice"
            data-choice={choice.icon ?? 'choosing'}
        >
            <Box sx={styles.mainLine}>
                {decided ? (
                    <Box sx={styles.iconWrapper} aria-hidden>
                        {renderIcon()}
                    </Box>
                ) : (
                    <Box sx={styles.dots} aria-hidden>
                        {[0, 1, 2].map((index) => <Box key={index} sx={styles.dot(index)} />)}
                    </Box>
                )}
                <Typography component="span" sx={styles.label}>{choice.label}</Typography>
            </Box>
            {!decided && <Typography component="span" sx={styles.hint}>{CHOOSING_HINT}</Typography>}
        </Box>
    );
};

export default InitiativePlayerChoiceIndicator;
