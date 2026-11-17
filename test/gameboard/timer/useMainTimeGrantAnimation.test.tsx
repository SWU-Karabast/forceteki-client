import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMainTimeGrantAnimation } from '@/app/_components/_sharedcomponents/Timer/useMainTimeGrantAnimation';
import { IMainTimeGrant, MAIN_TIME_GRANT_ANIMATION_MS } from '@/app/_components/_sharedcomponents/Timer/timerUtils';

interface IPlayerState {
    mainTimeGrant?: IMainTimeGrant;
    mainTimeRemainingSeconds?: number;
}

/** A player's timer fields as a game state carries them; the server leaves `mainTimeGrant` out before any round has ended. */
const playerState = (mainTimeRemainingSeconds: number, grant?: IMainTimeGrant): IPlayerState => ({
    mainTimeRemainingSeconds,
    ...(grant ? { mainTimeGrant: grant } : {}),
});

const renderGrantHook = (initial: IPlayerState | undefined) =>
    renderHook(({ state }: { state: IPlayerState | undefined }) => useMainTimeGrantAnimation(state), { initialProps: { state: initial } });

describe('useMainTimeGrantAnimation', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('shows a new grant, from the main time before it to the main time after', () => {
        const { result, rerender } = renderGrantHook(playerState(90));

        rerender({ state: playerState(100, { round: 1, seconds: 10 }) });

        expect(result.current).toEqual({ round: 1, seconds: 10, fromMs: 90_000, toMs: 100_000 });
    });

    it('stops showing it once the animation is over', () => {
        const { result, rerender } = renderGrantHook(playerState(90));
        rerender({ state: playerState(100, { round: 1, seconds: 10 }) });

        act(() => {
            vi.advanceTimersByTime(MAIN_TIME_GRANT_ANIMATION_MS - 1);
        });
        expect(result.current).not.toBeNull();

        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(result.current).toBeNull();
    });

    it('shows each grant once, however many later states carry it', () => {
        const { result, rerender } = renderGrantHook(playerState(90));
        rerender({ state: playerState(100, { round: 1, seconds: 10 }) });
        act(() => {
            vi.advanceTimersByTime(MAIN_TIME_GRANT_ANIMATION_MS);
        });

        rerender({ state: playerState(80, { round: 1, seconds: 10 }) });

        expect(result.current).toBeNull();
    });

    it('shows the next round\'s grant', () => {
        const { result, rerender } = renderGrantHook(playerState(90));
        rerender({ state: playerState(100, { round: 1, seconds: 10 }) });
        act(() => {
            vi.advanceTimersByTime(MAIN_TIME_GRANT_ANIMATION_MS);
        });

        rerender({ state: playerState(78, { round: 2, seconds: 8 }) });

        expect(result.current).toEqual({ round: 2, seconds: 8, fromMs: 70_000, toMs: 78_000 });
    });

    it('does not replay a grant already in the first state, as after a refresh', () => {
        const { result, rerender } = renderGrantHook(playerState(100, { round: 3, seconds: 10 }));
        expect(result.current).toBeNull();

        rerender({ state: playerState(95, { round: 3, seconds: 10 }) });

        expect(result.current).toBeNull();
    });

    it('waits for a state with the player in it before taking the first one', () => {
        const { result, rerender } = renderGrantHook(undefined);

        rerender({ state: playerState(100, { round: 3, seconds: 10 }) });

        expect(result.current, 'the grant was already there when the game state arrived').toBeNull();
    });

    it('shows nothing for a grant of 0 s, to a player whose main time was full', () => {
        const { result, rerender } = renderGrantHook(playerState(120));

        rerender({ state: playerState(120, { round: 1, seconds: 0 }) });

        expect(result.current).toBeNull();
    });

    it('starts counting rounds again in a new game', () => {
        const { result, rerender } = renderGrantHook(playerState(100, { round: 4, seconds: 10 }));
        rerender({ state: playerState(120) });
        expect(result.current, 'the next game begins').toBeNull();

        rerender({ state: playerState(100, { round: 1, seconds: 10 }) });

        expect(result.current).toEqual({ round: 1, seconds: 10, fromMs: 90_000, toMs: 100_000 });
    });
});
