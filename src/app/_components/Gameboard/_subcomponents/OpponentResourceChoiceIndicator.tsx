import React from 'react';
import Image from 'next/image';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/system';
import { OpponentResourceChoice } from '@/app/_constants/constants';
import { s3TokenImageURL } from '@/app/_utils/s3Utils';

interface IOpponentResourceChoiceIndicatorProps {
    choice: OpponentResourceChoice;
}

const OPPONENT_COLOR = 'var(--initiative-red)';
// the same neutral the board uses for a counter nobody holds yet
const UNDECIDED_COLOR = 'rgba(255, 255, 255, 0.7)';

const choiceLabel: Record<OpponentResourceChoice, string> = {
    [OpponentResourceChoice.NotChosen]: 'Initiative player is choosing',
    [OpponentResourceChoice.Resourced]: 'Initiative player resourced a card',
    [OpponentResourceChoice.Passed]: 'Initiative player skipped resourcing',
};

// shown under the label while the initiative player is still choosing: the player may act without waiting for them
const CHOOSING_HINT = 'You can choose now or wait for them to decide';

// the same query the board's prompt uses to save room on a phone in landscape
const MOBILE_LANDSCAPE = '@media (orientation: landscape) and (max-width: 932px)';

const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

// played once when the opponent's choice arrives, so a player who is waiting for it notices
const announce = keyframes`
    0% {
        transform: scale(0.85);
        opacity: 0;
        box-shadow: 0 0 0 0 rgba(255, 50, 49, 0);
    }
    40% {
        transform: scale(1.08);
        opacity: 1;
        box-shadow: 0 0 18px 4px rgba(255, 50, 49, 0.9);
    }
    100% {
        transform: scale(1);
        opacity: 1;
        box-shadow: 0 0 0 0 rgba(255, 50, 49, 0);
    }
`;

const dotBounce = keyframes`
    0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.35;
    }
    30% {
        transform: translateY(-0.22em);
        opacity: 1;
    }
`;

/**
 * In the regroup phase's resource step the player with the initiative chooses first. This shows the other player what
 * they have done so far: still choosing, resourced a card (never which one), or skipped. It is built like the board's
 * Initiative indicator, in the opponent's colour, and fills in when the opponent has put a card down.
 */
const OpponentResourceChoiceIndicator: React.FC<IOpponentResourceChoiceIndicatorProps> = ({ choice }) => {
    const decided = choice !== OpponentResourceChoice.NotChosen;
    const resourced = choice === OpponentResourceChoice.Resourced;
    const color = decided ? OPPONENT_COLOR : UNDECIDED_COLOR;

    // ----------------Styles----------------//
    const styles = {
        indicator: {
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: decided ? '0.2em 0.9em' : '0.2em 1.1em 0.3em',
            borderRadius: '20px',
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: color,
            backgroundColor: resourced ? color : 'rgba(0, 0, 0, 0.5)',
            color: resourced ? 'black' : color,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            textShadow: 'none',
            animation: `${decided ? announce : fadeIn} ${decided ? '0.9s' : '0.3s'} ease-out`,
            '@media (prefers-reduced-motion: reduce)': {
                animation: 'none',
            },
            // On a phone in landscape the bases sit right under the prompt, and a second line would cover the damage
            // counter of the player's base, so the hint goes beside the label instead of below it.
            [MOBILE_LANDSCAPE]: {
                flexDirection: 'row',
                gap: '0.7em',
                padding: '0.2em 0.9em',
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
            lineHeight: 1.4,
            color: 'inherit',
        },
        hint: {
            fontSize: '0.85em',
            fontWeight: 500,
            lineHeight: 1.25,
            color: 'inherit',
            [MOBILE_LANDSCAPE]: {
                borderLeft: '1px solid currentColor',
                paddingLeft: '0.7em',
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
                display: resourced ? 'none' : 'block',
                content: '""',
                position: 'absolute',
                left: '-25%',
                right: '-25%',
                top: '50%',
                height: '2px',
                backgroundColor: 'currentColor',
                transform: 'translateY(-50%) rotate(-40deg)',
            },
        },
        icon: {
            height: '1.25em',
            width: 'auto',
            aspectRatio: '1 / 1.4',
            filter: resourced ? 'none' : 'grayscale(1)',
            opacity: resourced ? 1 : 0.6,
        },
    };

    return (
        // keyed by the choice so the entrance animation plays again each time it changes
        <Box
            key={choice}
            sx={styles.indicator}
            role="status"
            aria-label={decided ? choiceLabel[choice] : `${choiceLabel[choice]}. ${CHOOSING_HINT}`}
            data-testid="opponent-resource-choice"
            data-choice={choice}
        >
            <Box sx={styles.mainLine}>
                {decided ? (
                    <Box sx={styles.iconWrapper} aria-hidden>
                        <Image
                            src={s3TokenImageURL('resource-icon')}
                            alt=""
                            style={styles.icon}
                            height={72}
                            width={54}
                        />
                    </Box>
                ) : (
                    <Box sx={styles.dots} aria-hidden>
                        {[0, 1, 2].map((index) => <Box key={index} sx={styles.dot(index)} />)}
                    </Box>
                )}
                <Typography component="span" sx={styles.label}>{choiceLabel[choice]}</Typography>
            </Box>
            {!decided && <Typography component="span" sx={styles.hint}>{CHOOSING_HINT}</Typography>}
        </Box>
    );
};

export default OpponentResourceChoiceIndicator;
