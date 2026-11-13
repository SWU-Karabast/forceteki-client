import React, { useCallback, useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useGame } from '@/app/_contexts/Game.context';

/** Which side of the board a counter sits on: with the connected player, with the opponent, or unclaimed in between */
type CounterSide = 'player' | 'opponent' | 'unclaimed';

interface IClaimCounter {
    label: string;
    side: CounterSide;
    claimedThisRound: boolean;
}

interface IClaimCounterIndicatorsProps {
    playerId: string;
    opponentId: string;
}

// height of one indicator plus the gap to the next one, used to stack indicators that share a side
const INDICATOR_STEP = '2.4rem';
// gap between an indicator and the board's right edge
const INDICATOR_RIGHT = '5px';
// Unclaimed indicators sit just left of the chat drawer toggle, centred on it. In landscape the board ends left of the
// toggle, but in portrait the board runs under it, so there they move left by the toggle's visible width plus a gap.
const UNCLAIMED_RIGHT_PORTRAIT = '34px';

/**
 * The chat drawer toggle is fixed to the viewport's vertical middle, which is a little below the board's middle.
 * Returns how far (in px) the viewport's middle is below the middle of the element the indicators are positioned in,
 * so unclaimed indicators can centre on the toggle. Clamped so they never leave the middle half of the board.
 */
const useViewportCenterOffset = (container: HTMLElement | null) => {
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        if (!container) {
            return;
        }

        const update = () => {
            const rect = container.getBoundingClientRect();
            const limit = rect.height / 4;
            const centerOffset = window.innerHeight / 2 - (rect.top + rect.height / 2);
            setOffset(Math.round(Math.max(-limit, Math.min(limit, centerOffset))));
        };

        update();
        const resizeObserver = new ResizeObserver(update);
        resizeObserver.observe(container);
        window.addEventListener('resize', update);
        window.addEventListener('scroll', update, true);
        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', update);
            window.removeEventListener('scroll', update, true);
        };
    }, [container]);

    return offset;
};

const sideColor: Record<CounterSide, string> = {
    player: 'var(--initiative-blue)',
    opponent: 'var(--initiative-red)',
    unclaimed: 'rgba(255, 255, 255, 0.7)',
};

const getClaimedSide = (playerClaimed: boolean, opponentClaimed: boolean): CounterSide => {
    if (playerClaimed) {
        return 'player';
    }
    return opponentClaimed ? 'opponent' : 'unclaimed';
};

/**
 * Faux Suns replacement for the board's Initiative indicator. Shows Initiative, Plan and Blast, each moved to the
 * side of the player who holds it and filled in if it was claimed this round. Plan and Blast reset every round, so
 * when unclaimed they wait in the middle; Initiative always stays with whoever claimed it last.
 */
const ClaimCounterIndicators: React.FC<IClaimCounterIndicatorsProps> = ({ playerId, opponentId }) => {
    const { gameState } = useGame();
    // the element all indicators are positioned in, found through the first indicator once it is in the DOM
    const [container, setContainer] = useState<HTMLElement | null>(null);
    const anchorRef = useCallback((element: HTMLDivElement | null) => setContainer(element?.parentElement ?? null), []);
    const viewportCenterOffset = useViewportCenterOffset(container);
    const player = gameState.players[playerId];
    const opponent = gameState.players[opponentId];

    const planSide = getClaimedSide(!!player?.hasClaimedPlan, !!opponent?.hasClaimedPlan);
    const blastSide = getClaimedSide(!!player?.hasClaimedBlast, !!opponent?.hasClaimedBlast);

    const counters: IClaimCounter[] = [
        { label: 'Initiative', side: player?.hasInitiative ? 'player' : 'opponent', claimedThisRound: !!gameState.initiativeClaimed },
        { label: 'Plan', side: planSide, claimedThisRound: planSide !== 'unclaimed' },
        { label: 'Blast', side: blastSide, claimedThisRound: blastSide !== 'unclaimed' },
    ];

    const unclaimedCount = counters.filter((counter) => counter.side === 'unclaimed').length;

    const getPosition = (counter: IClaimCounter, index: number) => {
        // indicators sharing a side stack outward from the board edge (or around the middle) in a fixed order
        const slot = counters.slice(0, index).filter((other) => other.side === counter.side).length;

        switch (counter.side) {
            case 'player':
                return { top: '100%', transform: `translateY(calc(-115% - ${slot} * ${INDICATOR_STEP}))` };
            case 'opponent':
                return { top: '5px', transform: `translateY(calc(${slot} * ${INDICATOR_STEP}))` };
            default:
                // stacked around the chat drawer toggle's middle, just left of it (see UNCLAIMED_RIGHT_PORTRAIT)
                return {
                    top: '50%',
                    transform: `translateY(calc(-50% + ${viewportCenterOffset}px + ${slot - (unclaimedCount - 1) / 2} * ${INDICATOR_STEP}))`,
                };
        }
    };

    const getDescription = (counter: IClaimCounter) => {
        if (counter.side === 'unclaimed') {
            return `${counter.label}: unclaimed`;
        }
        const holder = counter.side === 'player' ? player?.user?.username : opponent?.user?.username;
        return counter.claimedThisRound ? `${counter.label}: claimed by ${holder}` : `${counter.label}: held by ${holder}`;
    };

    // ----------------Styles----------------//
    const getIndicatorStyle = (counter: IClaimCounter, index: number) => {
        const color = sideColor[counter.side];
        return {
            ...getPosition(counter, index),
            position: 'absolute',
            right: INDICATOR_RIGHT,
            '@media (orientation: portrait)': {
                right: counter.side === 'unclaimed' ? UNCLAIMED_RIGHT_PORTRAIT : INDICATOR_RIGHT,
            },
            transition: 'transform .7s, top .7s, right .7s, background-color .3s, border-color .3s',
            borderRadius: '20px',
            borderWidth: '2px',
            borderStyle: 'solid',
            height: '2rem',
            width: 'auto',
            backgroundColor: counter.claimedThisRound ? color : 'rgba(0, 0, 0, 0.5)',
            borderColor: color,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            h4: {
                margin: '0.2rem 1rem 0',
                textAlign: 'center',
                display: 'block',
                fontSize: '1em',
                fontWeight: 600,
                userSelect: 'none',
                color: counter.claimedThisRound ? 'black' : color,
            },
        };
    };

    return (
        <>
            {counters.map((counter, index) => (
                <Box
                    key={counter.label}
                    ref={index === 0 ? anchorRef : undefined}
                    sx={getIndicatorStyle(counter, index)}
                    role="status"
                    aria-label={getDescription(counter)}
                    data-testid={`claim-counter-${counter.label.toLowerCase()}`}
                >
                    <Typography variant={'h4'}>{counter.label}</Typography>
                </Box>
            ))}
        </>
    );
};

export default ClaimCounterIndicators;
