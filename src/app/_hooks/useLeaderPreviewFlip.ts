import { useEffect, useState, useMemo, useCallback } from 'react';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import { CardStyle } from '@/app/_components/_sharedcomponents/Cards/CardTypes';

interface UseLeaderCardFlipPreviewReturn {
    // State values
    isCtrl: boolean;
    isLeader: boolean;

    // State setters (optional - only called if provided)
    setIsCtrl?: (state: boolean) => void;
    setIsLeader?: (state: boolean) => void;
    setLeaderSecondSide?: (state: boolean) => void;

    // Calculated style properties
    aspectRatio: string;
    width: string;
}

interface UseLeaderCardFlipPreviewParams {
    anchorElement: HTMLElement | null;
    cardId: string | undefined;
    setPreviewImage: (url: string | null) => void;
    frontCardStyle: CardStyle;
    backCardStyle: CardStyle;
    setIsCtrl?: (state: boolean) => void;
    setIsLeader?: (state: boolean) => void;
    setLeaderSecondSide?: (state: boolean) => void;
    // New parameters for calculations
    isDeployed?: boolean;
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
        setIsCtrl: externalSetIsCtrl,
        setIsLeader: externalSetIsLeader,
        setLeaderSecondSide: externalSetLeaderSecondSide,
        isDeployed = false,
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

    // Internal state
    const [internalIsCtrl, setInternalIsCtrl] = useState(false);
    const [internalIsLeader, setInternalIsLeader] = useState(false);

    // Use external setters if provided, otherwise use internal state
    const isCtrl = internalIsCtrl;
    const isLeader = internalIsLeader;

    const setIsCtrl = useCallback((value: boolean) => {
        setInternalIsCtrl(value);
        externalSetIsCtrl?.(value);
    }, [externalSetIsCtrl]);

    const setIsLeader = useCallback((value: boolean) => {
        setInternalIsLeader(value);
        externalSetIsLeader?.(value);
    }, [externalSetIsLeader]);

    const setLeaderSecondSide = useCallback((value: boolean) => {
        externalSetLeaderSecondSide?.(value);
    }, [externalSetLeaderSecondSide]);

    // Calculate style properties
    const styleCalculations = useMemo(() => {
        if(!isLeader){
            if(anchorElement?.getAttribute('data-card-type') === 'base'){
                return {
                    aspectRatio: '1.4 / 1',
                    width: '24rem',
                };
            }

            // Non-leader and non-base cards: always portrait mode.
            return {
                aspectRatio: '1 / 1.4',
                width: '16rem',
            };
        }
        const isLeaderActive = isLeader && isDeployed;
        const hasDefinedStartingSide = startingSide !== undefined;
        const usePortraitMode = !hasDefinedStartingSide && ((isLeaderActive && !isCtrl) || (!isLeaderActive && isCtrl));
        return {
            aspectRatio: usePortraitMode ? '1 / 1.4' : '1.4 / 1',
            width: usePortraitMode ? '15rem' : '24rem',

            // Internal flags for debugging/testing
            isLeaderActive,
            hasDefinedStartingSide,
            usePortraitMode,
        };
    }, [isLeader, isDeployed, isCtrl, startingSide,anchorElement]);

    useEffect(() => {
        if (!anchorElement || !cardId) return;

        const isLeaderHovered = anchorElement.getAttribute('data-card-type') === 'leader';
        if (!isLeaderHovered) return;

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
                setLeaderSecondSide(true);
                setIsCtrl(true);
                setPreviewImage(`url(${backURL})`);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Control') {
                setLeaderSecondSide(false);
                setIsCtrl(false);
                setPreviewImage(`url(${frontURL})`);
            }
        };

        setIsLeader(true);
        setPreviewImage(`url(${frontURL})`);

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            setIsLeader(false);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [
        anchorElement,
        backCardStyle,
        cardId,
        frontCardStyle,
        setIsCtrl,
        setIsLeader,
        setLeaderSecondSide,
        setPreviewImage,
        startingSide
    ]);

    return {
        // State values
        isCtrl,
        isLeader,

        // State setters (only include if external setters were provided)
        ...(externalSetIsCtrl && { setIsCtrl }),
        ...(externalSetIsLeader && { setIsLeader }),
        ...(externalSetLeaderSecondSide && { setLeaderSecondSide }),

        // Calculated style properties
        aspectRatio: styleCalculations.aspectRatio,
        width: styleCalculations.width,
    };
}