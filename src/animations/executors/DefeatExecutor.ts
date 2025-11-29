import { AnimationType, type AnimationEvent } from '../types';
import type { AnimationExecutor } from './AnimationExecutor';

// Animation duration constants (matching server-side durations)
const UPGRADE_DEFEAT_DURATION_MS = 300;
const UNIT_DEFEAT_DURATION_MS = 450;

/**
 * Executor for defeat animations.
 * Handles the visual feedback when units or upgrades are defeated and removed from play.
 */
export class DefeatExecutor implements AnimationExecutor {
    public async execute(element: HTMLElement, event: AnimationEvent): Promise<void> {
        if (!element || event.type !== AnimationType.Defeat) {
            throw new Error('Invalid element or event type for defeat animation');
        }

        const hasUpgrades = event.metadata?.hasUpgrades === true;
        const upgradeIds = (event.metadata?.upgradeIds as string[]) || [];
        const isStandaloneUpgrade = event.metadata?.isUpgrade === true;

        // Store original styles to restore on cleanup (in case animation is cancelled)
        const originalTransform = element.style.transform;
        const originalOpacity = element.style.opacity;
        const originalPointerEvents = element.style.pointerEvents;

        try {
            // If this is a standalone upgrade being defeated (not part of a unit defeat)
            if (isStandaloneUpgrade) {
                await this.animateDefeat(element, true); // true = is upgrade
                return;
            }

            // If this is a unit with upgrades, animate upgrades first
            if (hasUpgrades && upgradeIds.length > 0) {
                await this.animateUpgrades(upgradeIds);
            }

            // Then animate the unit/card itself
            await this.animateDefeat(element, false); // false = is unit
        } catch (error) {
            // Restore original styles if animation fails
            element.style.transform = originalTransform;
            element.style.opacity = originalOpacity;
            element.style.pointerEvents = originalPointerEvents;
            throw error;
        }
    }

    private async animateUpgrades(upgradeIds: string[]): Promise<void> {
        const upgradeElements = upgradeIds
            .map((id) => document.querySelector(`[data-card-uuid="${id}"]`) as HTMLElement)
            .filter((el) => el !== null);

        if (upgradeElements.length === 0) {
            return;
        }

        // Animate all upgrades simultaneously
        const animationPromises = upgradeElements.map((element) => {
            element.classList.add('defeat-upgrade');
            return this.waitForAnimation(element, UPGRADE_DEFEAT_DURATION_MS);
        });

        await Promise.all(animationPromises);

        // Clean up upgrade elements
        upgradeElements.forEach((element) => {
            element.classList.remove('defeat-upgrade');
        });
    }

    private async animateDefeat(element: HTMLElement, isUpgrade: boolean): Promise<void> {
        // For upgrades being defeated standalone, animate the element directly (don't go to parent)
        // For units, the element is the inner card box, but we need to animate the parent container
        // which has the black background
        const targetElement = isUpgrade ? element : (element.parentElement || element);

        // Add appropriate defeat animation class (upgrade or unit)
        const animationClass = isUpgrade ? 'defeat-upgrade' : 'defeat-unit';
        const duration = isUpgrade ? UPGRADE_DEFEAT_DURATION_MS : UNIT_DEFEAT_DURATION_MS;

        targetElement.classList.add(animationClass);

        // Disable pointer events during animation
        targetElement.style.pointerEvents = 'none';

        await this.waitForAnimation(targetElement, duration);

        // Hide the element completely to prevent glitches
        targetElement.style.visibility = 'hidden';
        targetElement.style.display = 'none';

        // Clean up animation class
        targetElement.classList.remove(animationClass);
    }

    private waitForAnimation(element: HTMLElement, duration: number): Promise<void> {
        return new Promise<void>((resolve) => {
            let resolved = false;

            const handleAnimationEnd = () => {
                if (!resolved) {
                    resolved = true;
                    element.removeEventListener('animationend', handleAnimationEnd);
                    resolve();
                }
            };

            element.addEventListener('animationend', handleAnimationEnd, { once: true });

            // Fallback timeout in case animationend doesn't fire
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    element.removeEventListener('animationend', handleAnimationEnd);
                    resolve();
                }
            }, duration + 50);
        });
    }
}
