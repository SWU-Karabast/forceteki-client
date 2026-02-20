import { useRef, useCallback } from 'react';

interface UseLongPressOptions {
    onLongPress: (target: HTMLElement) => void;
    onRelease: () => void;
    delay?: number;
    moveThreshold?: number;
}

export const useLongPress = ({
    onLongPress,
    onRelease,
    delay = 400,
    moveThreshold = 10,
}: UseLongPressOptions) => {
    const timerRef = useRef<number | undefined>(undefined);
    const isLongPressRef = useRef(false);
    const startPosRef = useRef<{ x: number; y: number } | null>(null);

    const onTouchStart = useCallback((e: React.TouchEvent<HTMLElement>) => {
        const touch = e.touches[0];
        const target = e.currentTarget;
        startPosRef.current = { x: touch.clientX, y: touch.clientY };
        isLongPressRef.current = false;

        timerRef.current = window.setTimeout(() => {
            isLongPressRef.current = true;
            onLongPress(target);
        }, delay);
    }, [onLongPress, delay]);

    const onTouchEnd = useCallback((e: React.TouchEvent<HTMLElement>) => {
        clearTimeout(timerRef.current);
        if (isLongPressRef.current) {
            e.preventDefault();
            onRelease();
        }
        isLongPressRef.current = false;
        startPosRef.current = null;
    }, [onRelease]);

    const onTouchMove = useCallback((e: React.TouchEvent<HTMLElement>) => {
        if (!startPosRef.current) return;
        const touch = e.touches[0];
        const dx = touch.clientX - startPosRef.current.x;
        const dy = touch.clientY - startPosRef.current.y;
        if (Math.abs(dx) > moveThreshold || Math.abs(dy) > moveThreshold) {
            clearTimeout(timerRef.current);
            isLongPressRef.current = false;
            startPosRef.current = null;
        }
    }, [moveThreshold]);

    const onContextMenu = useCallback((e: React.MouseEvent<HTMLElement>) => {
        if (window.matchMedia('(pointer: coarse)').matches) {
            e.preventDefault();
        }
    }, []);

    return { onTouchStart, onTouchEnd, onTouchMove, onContextMenu };
};
