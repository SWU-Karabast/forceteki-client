import { AnimationType, type AnimationEvent } from '../types';
import type { AnimationExecutor } from './AnimationExecutor';

/**
 * Executor for heal animations.
 * Creates a blue flash overlay and numeric heal indicator that slides up and fades.
 */
export class HealExecutor implements AnimationExecutor {
    public async execute(element: HTMLElement, event: AnimationEvent): Promise<void> {
        if (!element || event.type !== AnimationType.Heal) {
            throw new Error('Invalid element or event type for heal animation');
        }

        const healAmount = event.value ?? 0;
        if (healAmount <= 0) {
            console.warn('Heal animation called with non-positive value:', healAmount);
            return;
        }

        // Store original position to restore after animation
        const originalPosition = element.style.position;

        // Create animation elements
        const flashElement = this.createFlashElement();
        const labelElement = this.createLabelElement(healAmount);

        // Add to DOM
        element.style.position = element.style.position || 'relative'; // Ensure positioning context
        element.appendChild(flashElement);
        element.appendChild(labelElement);

        // Wait for animations to complete
        await Promise.all([
            this.animateFlash(flashElement),
            this.animateLabel(labelElement)
        ]);

        // Cleanup and restore original state
        this.cleanup(element, originalPosition, flashElement, labelElement);
    }

    private createFlashElement(): HTMLElement {
        const flash = document.createElement('div');
        flash.className = 'heal-flash';
        return flash;
    }

    private createLabelElement(amount: number): HTMLElement {
        const label = document.createElement('div');
        label.className = 'heal-label';
        label.textContent = `+${amount}`;
        return label;
    }

    private animateFlash(element: HTMLElement): Promise<void> {
        return new Promise((resolve) => {
            element.addEventListener('animationend', () => resolve(), { once: true });
        });
    }

    private animateLabel(element: HTMLElement): Promise<void> {
        return new Promise((resolve) => {
            element.addEventListener('animationend', () => resolve(), { once: true });
        });
    }

    private cleanup(
        container: HTMLElement,
        originalPosition: string,
        ...elements: HTMLElement[]
    ): void {
        // Restore original position
        if (originalPosition) {
            container.style.position = originalPosition;
        } else {
            container.style.removeProperty('position');
        }

        // Remove animation elements
        elements.forEach((el) => {
            if (el.parentNode === container) {
                try {
                    container.removeChild(el);
                } catch (error) {
                    console.warn('Cleanup failed for heal animation element:', error);
                }
            }
        });
    }
}
