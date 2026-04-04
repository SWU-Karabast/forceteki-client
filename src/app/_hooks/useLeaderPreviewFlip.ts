import { useEffect, useState, useMemo } from 'react';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import { CardStyle } from '@/app/_components/_sharedcomponents/Cards/CardTypes';

interface UseLeaderCardFlipPreviewReturn {
    // style properties
    aspectRatio: string;
    width: string;
}

interface UseLeaderCardFlipPreviewParams {
    anchorElement: HTMLElement | null;
    cardId: string | undefined;
    setPreviewImage: (url: string | null) => void;
    frontCardStyle: CardStyle;
    backCardStyle: CardStyle;
    isDeployed?: boolean;
    isLeader: boolean;
    // Card object for starting side logic
    card?: {
        onStartingSide?: boolean;
        id?: string;
    };
}

/**
 * Hook to handle flipping a leader card preview using CTRL and calculate layout dimensions.
 */
export function useLeaderCardFlipPreview(params: UseLeaderCardFlipPreviewParams): UseLeaderCardFlipPreviewReturn {
    const {
        anchorElement,
        cardId,
        setPreviewImage,
        frontCardStyle,
        backCardStyle,
        isDeployed = false,
        isLeader = false,
        card,
    } = params;

    // set starting side internally (handles Chancellor Palpatine special case)
    const startingSide = useMemo(() => {
        if (!card) return undefined;

        let StartingSide = card.onStartingSide;
        // TODO fix this when we refactor S3utils and gamecard - this is for chancellor palpatine
        if (StartingSide === undefined && card.id === 'TWI_017') {
            StartingSide = true;
        }
        return StartingSide;
    }, [card]);

    // Internal states
    const [internalIsCtrl, setInternalIsCtrl] = useState(false);

    // Calculate style properties
    const styleSetter = useMemo(() => {
        if(!isLeader){
            if(anchorElement?.getAttribute('data-card-type') === 'base'){
                return {
                    aspectRatio: '1.4 / 1',
                    width: 'clamp(280px, 80vw, 24rem)',
                };
            }

            // Non-leader and non-base cards: always portrait mode.
            return {
                aspectRatio: '1 / 1.4',
                width: 'clamp(200px, 60vw, 16rem)',
            };
        }
        const isLeaderActive = isLeader && isDeployed;
        const hasDefinedStartingSide = startingSide !== undefined;
        const usePortraitMode = !hasDefinedStartingSide && ((isLeaderActive && !internalIsCtrl) || (!isLeaderActive && internalIsCtrl));
        return {
            aspectRatio: usePortraitMode ? '1 / 1.4' : '1.4 / 1',
            width: usePortraitMode ? 'clamp(200px, 60vw, 15rem)' : 'clamp(280px, 80vw, 24rem)',
        };
    }, [isLeader, isDeployed, internalIsCtrl, startingSide, anchorElement]);

    useEffect(() => {
        if (!anchorElement || !cardId) return;

        if (!isLeader) return;

        let frontURL, backURL;

        // Handle special cards like Chancellor Palpatine using startingSide
        if (startingSide !== undefined) {
            frontURL = s3CardImageURL({
                id: cardId,
                count: 0,
                types: 'leader',
                onStartingSide: startingSide
            }, frontCardStyle);
            backURL = s3CardImageURL({
                id: cardId,
                count: 0,
                types: 'leader',
                onStartingSide: !startingSide
            }, frontCardStyle);
        } else {
            frontURL = s3CardImageURL({
                id: cardId,
                count: 0,
            }, frontCardStyle);
            backURL = s3CardImageURL({
                id: cardId,
                count: 0,
            }, backCardStyle);
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Control') {
                setInternalIsCtrl(true);
                setPreviewImage(`url(${backURL})`);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Control') {
                setInternalIsCtrl(false);
                setPreviewImage(`url(${frontURL})`);
            }
        };
        setPreviewImage(`url(${frontURL})`);
        setInternalIsCtrl(false);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [anchorElement, backCardStyle, cardId, frontCardStyle, isLeader, setPreviewImage, startingSide]);

    return {
        // Calculated style properties
        aspectRatio: styleSetter.aspectRatio,
        width: styleSetter.width,
    };
}