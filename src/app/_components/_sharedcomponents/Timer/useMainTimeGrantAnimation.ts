import { useEffect, useRef, useState } from 'react';
import {
    IMainTimeGrant,
    IMainTimeGrantAnimation,
    MAIN_TIME_GRANT_ANIMATION_MS,
    MAX_MAIN_TIME,
    secondsToMilliseconds,
} from './timerUtils';

/** The fields of a player's game state this hook reads. */
interface IPlayerTimerState {
    mainTimeGrant?: IMainTimeGrant;
    mainTimeRemainingSeconds?: number;
}

/**
 * Returns the end-of-round grant of main time to show for a player, for {@link MAIN_TIME_GRANT_ANIMATION_MS} after a game
 * state brings a new one, and null otherwise.
 *
 * The server sends a player's latest grant with every game state, so a grant is new only when its round differs from the
 * one last seen. The first state seen sets that round without showing anything, so a refresh or reconnect does not replay
 * a grant from earlier in the game. A round lower than the one last seen means a new game (the next one in a Bo3), whose
 * rounds count from the start again. An undo never changes the grant, because the time given is kept. A grant of 0 seconds,
 * to a player whose main time was full, shows nothing.
 */
export const useMainTimeGrantAnimation = (playerState: IPlayerTimerState | undefined): IMainTimeGrantAnimation | null => {
    const [animation, setAnimation] = useState<IMainTimeGrantAnimation | null>(null);

    // null until the first game state with this player in it
    const lastSeenRoundRef = useRef<number | null>(null);

    const round = playerState ? (playerState.mainTimeGrant?.round ?? 0) : null;
    const seconds = playerState?.mainTimeGrant?.seconds ?? 0;
    const mainTimeRemainingSeconds = playerState?.mainTimeRemainingSeconds;

    useEffect(() => {
        if (round == null || round === lastSeenRoundRef.current) {
            return;
        }

        const lastSeenRound = lastSeenRoundRef.current;
        lastSeenRoundRef.current = round;
        if (lastSeenRound == null || round < lastSeenRound || seconds <= 0) {
            return;
        }

        const toMs = secondsToMilliseconds(mainTimeRemainingSeconds ?? MAX_MAIN_TIME);
        setAnimation({ round, seconds, toMs, fromMs: Math.max(0, toMs - secondsToMilliseconds(seconds)) });
    }, [round, seconds, mainTimeRemainingSeconds]);

    useEffect(() => {
        if (!animation) {
            return;
        }

        const timeout = setTimeout(() => setAnimation(null), MAIN_TIME_GRANT_ANIMATION_MS);
        return () => clearTimeout(timeout);
    }, [animation]);

    return animation;
};
