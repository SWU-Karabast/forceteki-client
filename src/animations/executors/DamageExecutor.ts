import { AnimationType, type AnimationEvent } from '../types';
import type { AnimationExecutor } from './AnimationExecutor';

/**
 * Executor for damage animations.
 * Creates a red flash overlay and numeric damage indicator that slides up and fades.
 */
export class DamageExecutor implements AnimationExecutor {
    public async execute(element: HTMLElement, event: AnimationEvent): Promise<void> {
        if (!element || event.type !== AnimationType.Damage) {
            throw new Error('Invalid element or event type for damage animation');
        }

        const damageAmount = event.value ?? 0;
        if (damageAmount <= 0) {
            console.warn('Damage animation called with non-positive value:', damageAmount);
            return;
        }

        // Store original position to restore after animation
        const originalPosition = element.style.position;

        // Create animation elements
        const flashElement = this.createFlashElement();
        const labelElement = this.createLabelElement(damageAmount);

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
        flash.className = 'damage-flash';
        return flash;
    }

    private createLabelElement(amount: number): HTMLElement {
        const label = document.createElement('div');
        label.className = 'damage-label';
        label.textContent = `-${amount}`;
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
                    console.warn('Cleanup failed for damage animation element:', error);
                }
            }
        });
    }
}
