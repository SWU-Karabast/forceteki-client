import { useCallback, useEffect, useRef } from 'react';
import { AnimationManager } from '../animations/AnimationManager';
import type { AnimationQueue } from '../animations/types';
import type { IAnimationPreferences } from '../app/_contexts/UserTypes';

/**
 * React hook for managing game animations.
 * Provides functions to process animations and configure settings.
 */
export function useGameAnimations(animationPreferences?: IAnimationPreferences) {
    const animationManagerRef = useRef<AnimationManager | null>(null);

    // Initialize animation manager on mount
    useEffect(() => {
        animationManagerRef.current = AnimationManager.getInstance();

        // Cleanup on unmount
        return () => {
            animationManagerRef.current?.clear();
        };
    }, []);

    // Update animation preferences when they change
    useEffect(() => {
        if (animationPreferences && animationManagerRef.current) {
            animationManagerRef.current.updatePreferences(animationPreferences);
        }
    }, [animationPreferences]);

    /**
     * Processes an animation queue from the server.
     * Returns a promise that resolves when all animations complete.
     */
    const processAnimations = useCallback(async (animationQueue: AnimationQueue | null): Promise<void> => {
        if (!animationQueue || !animationManagerRef.current) {
            return;
        }

        const manager = animationManagerRef.current;
        manager.enqueue(animationQueue);
        await manager.processQueue();
    }, []);

    /**
     * Clears all pending animations.
     */
    const clearAnimations = useCallback((): void => {
        animationManagerRef.current?.clear();
    }, []);

    /**
     * Checks if animations are currently processing.
     */
    const isAnimating = useCallback((): boolean => {
        return animationManagerRef.current?.isProcessing ?? false;
    }, []);

    return {
        processAnimations,
        clearAnimations,
        isAnimating,
    };
}
