import { useEffect } from 'react';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import { CardStyle } from '@/app/_components/_sharedcomponents/Cards/CardTypes';

/**
 * Hook to handle flipping a leader card preview using CTRL.
 *
 * @param anchorElement Element currently hovered
 * @param cardId Unique leader card ID (e.g., deckData.leader or leaderCardId)
 * @param setPreviewImage State setter for image URL
 * @param frontCardStyle Which CardStyle is for front
 * @param backCardStyle Which CardStyle is for back
 * @param setIsCtrl Optional setter for whether CTRL is pressed
 * @param setIsLeader Optional setter for whether hovering a leader card
 * @param setLeaderSecondSide Optional setter for whether hovering a leader card
 */
export function useLeaderCardFlipPreview(
    anchorElement: HTMLElement | null,
    cardId: string | undefined,
    setPreviewImage: (url: string | null) => void,
    frontCardStyle: CardStyle,
    backCardStyle: CardStyle,
    setIsCtrl?: (state: boolean) => void,
    setIsLeader?: (state: boolean) => void,
    setLeaderSecondSide?: (state: boolean) => void,

) {
    useEffect(() => {
        if (!anchorElement || !cardId) return;
        const isLeaderHovered = anchorElement.getAttribute('data-card-type') === 'leader';
        if (!isLeaderHovered) return;
        const frontURL = s3CardImageURL({ id: cardId, count: 0 }, frontCardStyle);
        const backURL = s3CardImageURL({ id: cardId, count: 0 }, backCardStyle);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Control') {
                setLeaderSecondSide?.(true);
                setIsCtrl?.(true);
                setPreviewImage(`url(${backURL})`);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Control') {
                setLeaderSecondSide?.(false);
                setIsCtrl?.(false);
                setPreviewImage(`url(${frontURL})`);
            }
        };

        setIsLeader?.(true);
        setPreviewImage(`url(${frontURL})`);

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            setIsLeader?.(false);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [anchorElement, backCardStyle, cardId, frontCardStyle, setIsCtrl, setIsLeader, setLeaderSecondSide, setPreviewImage]);
}
