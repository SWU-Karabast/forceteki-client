import { AnimationType, type AnimationEvent, type AnimationQueue } from './types';
import type { IAnimationPreferences } from '@/app/_contexts/UserTypes';
import type { AnimationExecutor } from './executors/AnimationExecutor';
import { DamageExecutor } from './executors/DamageExecutor';
import { HealExecutor } from './executors/HealExecutor';
import { DefeatExecutor } from './executors/DefeatExecutor';
import { LoseShieldExecutor } from './executors/LoseShieldExecutor';

// Animation timing constants
const ANIMATION_TIMEOUT_MS = 2000;

// Define which animation types are considered "critical" (damage-related)
const DamageRelatedAnimations = new Set([
    AnimationType.Damage,
    AnimationType.Heal,
]);

/**
 * Manages animation queue and execution on the client.
 * Singleton pattern for global animation management.
 */
export class AnimationManager {
    private static instance: AnimationManager | null = null;
    private _isProcessing = false;
    private _animationPreferences: IAnimationPreferences = {
        disableAnimations: false,
        onlyDamageAnimations: false,
        fastAnimations: false,
    };

    private queue: AnimationEvent[] = [];
    private shouldCancelProcessing = false;
    private executors: Map<AnimationType, AnimationExecutor>;

    private constructor() {
        // Initialize executor registry
        this.executors = new Map();
        this.executors.set(AnimationType.Damage, new DamageExecutor());
        this.executors.set(AnimationType.Heal, new HealExecutor());
        this.executors.set(AnimationType.Defeat, new DefeatExecutor());
        this.executors.set(AnimationType.LoseShield, new LoseShieldExecutor());
        // Additional executors can be registered here
    }

    /**
     * Gets the singleton instance of the AnimationManager.
     */
    public static getInstance(): AnimationManager {
        if (!AnimationManager.instance) {
            AnimationManager.instance = new AnimationManager();
        }
        return AnimationManager.instance;
    }

    /**
     * Checks if animations are currently processing.
     */
    public get isProcessing(): boolean {
        return this._isProcessing;
    }

    /**
     * Gets current animation preferences.
     */
    public get preferences(): IAnimationPreferences {
        return { ...this._animationPreferences };
    }

    /**
     * Determines if a specific animation type should be played based on user preferences.
     * @param animationType - The type of animation to check
     * @returns true if the animation should be played
     */
    private shouldPlayAnimation(animationType: AnimationType): boolean {
        // Check master disable first
        if (this._animationPreferences.disableAnimations) {
            return false;
        }

        // Check selective mode (only damage animations)
        if (this._animationPreferences.onlyDamageAnimations) {
            return DamageRelatedAnimations.has(animationType);
        }

        // Play all animations
        return true;
    }

    /**
     * Enqueues animation events from the server.
     * Filters out animations based on user preferences.
     *
     * @param animationQueue - Animation queue from server
     */
    public enqueue(animationQueue: AnimationQueue | null): void {
        if (!animationQueue || this._animationPreferences.disableAnimations) {
            return;
        }

        // Filter animations based on preferences
        const allowedAnimations = animationQueue.events.filter(event =>
            this.shouldPlayAnimation(event.type)
        );

        this.queue.push(...allowedAnimations);
    }

    /**
     * Processes all animations in the queue.
     * Respects priority ordering and executes simultaneous animations in parallel.
     */
    public async processQueue(): Promise<void> {
        if (this._isProcessing || this.queue.length === 0 || this._animationPreferences.disableAnimations) {
            return;
        }

        this._isProcessing = true;
        this.shouldCancelProcessing = false;

        try {
            // Optimize queue before processing
            this.optimizeQueue();

            // Sort by priority (highest first)
            this.queue.sort((a, b) => b.priority - a.priority);

            // Group animations by simultaneity
            const groups = this.groupSimultaneousAnimations();

            // Process each group - animations within a group execute in parallel,
            // but groups are processed sequentially
            for (const group of groups) {
                // Check if we should cancel processing
                if (this.shouldCancelProcessing) {
                    break;
                }
                await Promise.all(group.map(event => this.executeAnimation(event)));
            }
        } catch (error) {
            console.error('[AnimationManager] Error during animation processing:', error);
            throw error;
        } finally {
            this.queue = [];
            this._isProcessing = false;
            this.shouldCancelProcessing = false;
        }
    }

    /**
     * Groups animations that should execute simultaneously (same groupId).
     * Returns an array of arrays, where each inner array is a group of simultaneous animations.
     * Groups are organized by priority - higher priority groups execute first.
     */
    private groupSimultaneousAnimations(): AnimationEvent[][] {
        // Group by priority level first, then by simultaneity
        const priorityGroups = new Map<number, AnimationEvent[]>();

        for (const event of this.queue) {
            const priority = event.priority;
            if (!priorityGroups.has(priority)) {
                priorityGroups.set(priority, []);
            }
            priorityGroups.get(priority)!.push(event);
        }

        // Sort priorities (highest first) and create groups
        const sortedPriorities = Array.from(priorityGroups.keys()).sort((a, b) => b - a);
        const groups: AnimationEvent[][] = [];

        for (const priority of sortedPriorities) {
            const eventsAtPriority = priorityGroups.get(priority)!;

            // Within the same priority, group by simultaneity
            const groupMap = new Map<string, AnimationEvent[]>();
            const standaloneAnimations: AnimationEvent[] = [];

            for (const event of eventsAtPriority) {
                const groupId = event.metadata?.groupId as string | undefined;
                const isSimultaneous = event.metadata?.isSimultaneous as boolean | undefined;

                if (isSimultaneous && groupId) {
                    if (!groupMap.has(groupId)) {
                        groupMap.set(groupId, []);
                    }
                    groupMap.get(groupId)!.push(event);
                } else {
                    standaloneAnimations.push(event);
                }
            }

            // Add simultaneous groups
            groups.push(...Array.from(groupMap.values()));

            // Add standalone animations
            standaloneAnimations.forEach(event => groups.push([event]));
        }

        return groups;
    }

    /**
     * Optimizes the queue by combining duplicate events.
     */
    private optimizeQueue(): void {
        const damageMap = new Map<string, AnimationEvent>();
        const otherEvents: AnimationEvent[] = [];

        for (const event of this.queue) {
            if (event.type === AnimationType.Damage) {
                const existing = damageMap.get(event.targetId);
                if (existing && event.value !== undefined) {
                    // Combine damage values
                    existing.value = (existing.value ?? 0) + event.value;
                } else {
                    damageMap.set(event.targetId, { ...event });
                }
            } else {
                otherEvents.push(event);
            }
        }

        this.queue = [...Array.from(damageMap.values()), ...otherEvents];
    }

    /**
     * Executes a single animation event with timeout protection.
     */
    private async executeAnimation(event: AnimationEvent): Promise<void> {
        const executor = this.executors.get(event.type);
        if (!executor) {
            console.warn(`No executor registered for animation type: ${event.type}`);
            return;
        }

        // Find target element
        const element = this.findTargetElement(event.targetId);
        if (!element) {
            console.warn(`[AnimationManager] Target element not found for: ${event.targetId}`);
            // Silently skip - this is expected for upgrades that are detached before animation arrives
            return;
        }

        try {
            // Adjust animation duration based on speed preferences
            const speedMultiplier = this._animationPreferences.fastAnimations ? 0.5 : 1;
            const adjustedEvent = {
                ...event,
                durationMs: event.durationMs * speedMultiplier,
            };

            // Execute with timeout protection
            await Promise.race([
                executor.execute(element, adjustedEvent),
                this.createTimeout(ANIMATION_TIMEOUT_MS)
            ]);
        } catch (error) {
            console.error(`Animation execution failed for ${event.type}:`, error);
        }
    }

    /**
     * Create a timeout promise that rejects after the specified duration.
     */
    private createTimeout(ms: number): Promise<never> {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Animation timeout after ${ms}ms`)), ms);
        });
    }

    /**
     * Finds the DOM element for the given target ID.
     * For deployed leaders, prioritizes finding them in the arena over the base zone.
     */
    private findTargetElement(targetId: string): HTMLElement | null {
        const selector = `[data-card-uuid="${targetId}"]`;
        const allMatches = document.querySelectorAll<HTMLElement>(selector);

        if (allMatches.length === 0) {
            return null;
        }

        if (allMatches.length === 1) {
            return allMatches[0];
        }

        // Multiple matches - likely a deployed leader that exists in both base zone and arena
        // Exclude the deployed placeholder (the empty outline in the base zone)
        for (const element of Array.from(allMatches)) {
            const isDeployedPlaceholder = element.getAttribute('data-is-deployed-placeholder');

            // Skip the deployed placeholder, return the actual card in the arena
            if (isDeployedPlaceholder !== 'true') {
                return element;
            }
        }

        // Fallback to first match (shouldn't reach here if logic is correct)
        return allMatches[0];
    }

    /*
     * Updates animation preferences.
     */
    public updatePreferences(preferences: Partial<IAnimationPreferences>): void {
        this._animationPreferences = { ...this._animationPreferences, ...preferences };
    }

    /**
     * Clears all pending animations and cancels any in-progress processing.
     */
    public clear(): void {
        this.queue = [];
        this.shouldCancelProcessing = true;
    }
}

// Export singleton instance getter as default
export default AnimationManager.getInstance;
