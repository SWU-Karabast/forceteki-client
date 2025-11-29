import { AnimationEvent, AnimationType } from '../types';
import { AnimationExecutor } from './AnimationExecutor';

export class LoseShieldExecutor implements AnimationExecutor {
    private static readonly DURATION = 600; // Increased for crack/shatter animation

    async execute(element: HTMLElement, event: AnimationEvent): Promise<void> {
        if (!element || event.type !== AnimationType.LoseShield) {
            throw new Error('Invalid element or event type for lose shield animation');
        }

        // Find shield icon within the unit element
        // Use shieldIndex if provided (for simultaneous animations), otherwise use shieldUuid
        const shieldIndex = event.metadata?.shieldIndex as number | undefined;
        const shieldUuid = event.metadata?.shieldUuid as string | undefined;
        const shieldIcon = this.findShieldIcon(element, shieldIndex, shieldUuid);
        if (!shieldIcon) {
            console.warn('Shield icon not found for lose animation:', event.targetId, 'shieldIndex:', shieldIndex, 'shieldUuid:', shieldUuid);
            return;
        }

        // Store original styles
        const originalTransform = shieldIcon.style.transform;
        const originalOpacity = shieldIcon.style.opacity;
        const originalFilter = shieldIcon.style.filter;
        const originalPointerEvents = shieldIcon.style.pointerEvents;

        try {
            await this.animateShieldDefeat(shieldIcon);
        } catch (error) {
            // Restore original styles if animation fails
            shieldIcon.style.transform = originalTransform;
            shieldIcon.style.opacity = originalOpacity;
            shieldIcon.style.filter = originalFilter;
            shieldIcon.style.pointerEvents = originalPointerEvents;
            throw error;
        }
    }

    private findShieldIcon(unitElement: HTMLElement, shieldIndex?: number, shieldUuid?: string): HTMLElement | null {
        // Shield icons are in a Grid container within the unit card
        const gridContainer = unitElement.querySelector('.MuiGrid2-root.MuiGrid2-container');
        if (!gridContainer) {
            return null;
        }

        const shieldIcons = Array.from(gridContainer.children) as HTMLElement[];
        if (shieldIcons.length === 0) {
            console.warn('[LoseShieldExecutor] No shield icons found in grid container');
            return null;
        }

        // If shieldIndex is provided, target that specific shield position (for simultaneous animations like Saboteur)
        if (shieldIndex !== undefined && shieldIndex >= 0 && shieldIndex < shieldIcons.length) {
            return shieldIcons[shieldIndex];
        }

        // Try to find shield by UUID (most reliable for sequential animations)
        if (shieldUuid) {
            const shieldByUuid = shieldIcons.find((icon) => icon.getAttribute('data-shield-uuid') === shieldUuid);
            if (shieldByUuid) {
                return shieldByUuid;
            }
        }

        // Fallback: find the first shield that hasn't been animated yet
        // Skip shields that already have the 'shield-animated' class
        for (let i = 0; i < shieldIcons.length; i++) {
            if (!shieldIcons[i].classList.contains('shield-animated')) {
                return shieldIcons[i];
            }
        }

        console.warn('[LoseShieldExecutor] All shields already animated or shieldIndex out of bounds');
        return null;
    }

    private async animateShieldDefeat(element: HTMLElement): Promise<void> {
        // Mark this shield as animated so subsequent animations skip it
        element.classList.add('shield-animated');
        element.classList.add('shield-fade-out');
        element.style.pointerEvents = 'none';

        // Create 4 shrapnel pieces that fly outward
        const topLeft = this.createShrapnelPiece(element, 'shield-shrapnel-top-left');
        const topRight = this.createShrapnelPiece(element, 'shield-shrapnel-top-right');
        const bottomLeft = this.createShrapnelPiece(element, 'shield-shrapnel-bottom-left');
        const bottomRight = this.createShrapnelPiece(element, 'shield-shrapnel-bottom-right');

        await this.waitForAnimation(topLeft, LoseShieldExecutor.DURATION);

        // Remove all the dynamically created shrapnel pieces
        topLeft.remove();
        topRight.remove();
        bottomLeft.remove();
        bottomRight.remove();

        element.classList.remove('shield-fade-out');

        // DO NOT remove the element from DOM - let React handle that
        // Just keep it invisible so it doesn't flash when React re-renders
        element.style.visibility = 'hidden';
        element.style.pointerEvents = '';
    }

    private createShrapnelPiece(sourceElement: HTMLElement, className: string): HTMLElement {
        const piece = document.createElement('div');
        piece.className = className;

        // Get the exact position and size of the source element
        const rect = sourceElement.getBoundingClientRect();
        const parentRect = sourceElement.parentElement?.getBoundingClientRect();

        // Copy computed styles from source element to match appearance
        const computedStyle = window.getComputedStyle(sourceElement);
        piece.style.background = computedStyle.background;
        piece.style.backgroundColor = computedStyle.backgroundColor;
        piece.style.backgroundImage = computedStyle.backgroundImage;
        piece.style.borderRadius = computedStyle.borderRadius;
        piece.style.width = computedStyle.width;
        piece.style.height = computedStyle.height;

        // Position it exactly where the source element is
        if (parentRect) {
            piece.style.position = 'absolute';
            piece.style.left = `${rect.left - parentRect.left}px`;
            piece.style.top = `${rect.top - parentRect.top}px`;
        }

        // Insert at the parent level so it can be positioned absolutely
        sourceElement.parentElement?.appendChild(piece);

        return piece;
    }

    private waitForAnimation(element: HTMLElement, duration: number): Promise<void> {
        return new Promise<void>((resolve) => {
            const handleAnimationEnd = () => {
                element.removeEventListener('animationend', handleAnimationEnd);
                resolve();
            };

            element.addEventListener('animationend', handleAnimationEnd, { once: true });

            // Fallback timeout in case animationend doesn't fire
            setTimeout(() => {
                element.removeEventListener('animationend', handleAnimationEnd);
                resolve();
            }, duration + 50);
        });
    }
}
