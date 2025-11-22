import type { AnimationEvent } from '../types';

/**
 * Interface for animation executors.
 * Each animation type should have its own executor implementation.
 */
export interface AnimationExecutor {

    /**
     * Executes the animation on the target element.
     *
     * @param element - The DOM element to animate
     * @param event - The animation event containing animation parameters
     * @returns Promise that resolves when the animation completes
     */
    execute(element: HTMLElement, event: AnimationEvent): Promise<void>;
}
