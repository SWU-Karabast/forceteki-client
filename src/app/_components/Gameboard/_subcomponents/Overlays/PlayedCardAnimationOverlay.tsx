'use client';

import React from 'react';
import { Box } from '@mui/material';
import { CardStyle, ICardData } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import { useCardImageLocale } from '@/app/_contexts/CardImageLocale.context';
import { s3CardImageURL } from '@/app/_utils/s3Utils';

type CardLocation = {
    card: ICardData;
    playerId: string;
    zone: string;
}

type AnimationRect = {
    left: number;
    top: number;
    width: number;
    height: number;
}

type AnimationState = {
    key: string;
    imageUrl: string;
    rect: AnimationRect;
    phase: 'entering' | 'presenting' | 'leaving';
}

type PlayerStateLike = {
    cardPiles?: Record<string, ICardData[] | undefined>;
}

type GameStateLike = {
    players?: Record<string, PlayerStateLike>;
    clientUIProperties?: {
        lastPlayedCard?: unknown;
    };
}

const TRACKED_DESTINATION_ZONES = ['discard', 'groundArena', 'spaceArena', 'capturedZone'];
const MOVE_MS = 520;
const PRESENTATION_MS = 650;
const CLEANUP_MS = MOVE_MS * 2 + PRESENTATION_MS + 120;
const PRESENTATION_DRAWER_GAP_PX = 16;

const setIdKey = (card: Pick<ICardData, 'setId'> | undefined): string | null => {
    if (!card?.setId) return null;
    return `${card.setId.set}_${card.setId.number.toString().padStart(3, '0')}`;
};

const normalizeLastPlayedCardId = (lastPlayedCard: unknown): string | null => {
    if (lastPlayedCard && typeof lastPlayedCard === 'object' && 'set' in lastPlayedCard && 'number' in lastPlayedCard) {
        const setId = lastPlayedCard as { set?: unknown; number?: unknown };
        if (typeof setId.set === 'string' && (typeof setId.number === 'number' || typeof setId.number === 'string')) {
            return `${setId.set}_${Number(setId.number).toString().padStart(3, '0')}`;
        }
    }

    if (typeof lastPlayedCard !== 'string') return null;
    const match = lastPlayedCard.match(/^([A-Za-z0-9]+)[_-](\d+)$/);
    if (!match) return lastPlayedCard;
    return `${match[1]}_${Number(match[2]).toString().padStart(3, '0')}`;
};

const flattenTrackedCards = (gameState: GameStateLike | null): CardLocation[] => {
    if (!gameState?.players) return [];

    return Object.entries(gameState.players).flatMap(([playerId, playerState]) => {
        const cardPiles = playerState?.cardPiles ?? {};

        return TRACKED_DESTINATION_ZONES.flatMap((zone) => {
            const cards = cardPiles[zone];
            if (!Array.isArray(cards)) return [];

            return cards
                .filter((card: ICardData | undefined): card is ICardData => !!card?.uuid)
                .map((card: ICardData) => ({ card, playerId, zone }));
        });
    });
};

const findPlayedDestination = (
    gameState: GameStateLike | null,
    previousGameState: GameStateLike | null,
    lastPlayedCard: string | null,
): CardLocation | null => {
    if (!lastPlayedCard || !previousGameState) return null;

    const previousCardIds = new Set(flattenTrackedCards(previousGameState).map(({ card }) => card.uuid));
    const currentCards = flattenTrackedCards(gameState);
    const newlyVisibleCards = currentCards.filter(({ card }) => !previousCardIds.has(card.uuid));
    const matchingNewCard = newlyVisibleCards.find(({ card }) => setIdKey(card) === lastPlayedCard);

    if (matchingNewCard) {
        return matchingNewCard;
    }

    const matchingDiscardCard = currentCards
        .filter(({ zone, card }) => zone === 'discard' && setIdKey(card) === lastPlayedCard)
        .at(-1);

    return matchingDiscardCard ?? null;
};

const presentationRect = (): AnimationRect => {
    const width = Math.min(Math.max(window.innerWidth * 0.14, 120), 230);
    const height = width * 1.4;
    const controlLineElements = Array.from(document.querySelectorAll('[data-gameboard-right-control-line="true"]'));
    const controlLineCenterX = controlLineElements.length > 0
        ? controlLineElements.reduce((sum, element) => {
            const rect = element.getBoundingClientRect();
            return sum + rect.left + rect.width / 2;
        }, 0) / controlLineElements.length
        : null;
    const drawerPaper = document.querySelector('[data-chat-drawer-paper="true"]');
    const drawerRect = drawerPaper?.getBoundingClientRect();
    const drawerIsVisible = !!drawerRect && drawerRect.width > 0 && drawerRect.left < window.innerWidth;
    const maxCenterX = drawerIsVisible
        ? drawerRect.left - PRESENTATION_DRAWER_GAP_PX - width / 2
        : window.innerWidth - PRESENTATION_DRAWER_GAP_PX - width / 2;
    const preferredCenterX = controlLineCenterX ?? window.innerWidth * 0.62;
    const centerX = Math.min(preferredCenterX, maxCenterX);
    const centerY = window.innerHeight * 0.48;

    return {
        left: centerX - width / 2,
        top: centerY - height / 2,
        width,
        height,
    };
};

const cacheCardRects = (): Map<string, AnimationRect> => {
    const rects = new Map<string, AnimationRect>();
    document.querySelectorAll('[data-card-uuid]').forEach((element) => {
        const uuid = element.getAttribute('data-card-uuid');
        if (!uuid) return;
        rects.set(uuid, rectFromElement(element));
    });
    return rects;
};

const rectFromElement = (element: Element): AnimationRect => {
    const rect = element.getBoundingClientRect();
    const width = Math.max(28, Math.min(rect.width, rect.height / 1.4));
    const height = width * 1.4;

    return {
        left: rect.left + rect.width / 2 - width / 2,
        top: rect.top + rect.height / 2 - height / 2,
        width,
        height,
    };
};

const destinationRectFor = (destination: CardLocation): AnimationRect | null => {
    const exactCard = document.querySelector(`[data-card-uuid="${destination.card.uuid}"]`);
    if (exactCard) {
        return rectFromElement(exactCard);
    }

    const zoneTarget = document.querySelector(`[data-zone-target="${destination.playerId}:${destination.zone}"]`);
    if (zoneTarget) {
        return rectFromElement(zoneTarget);
    }

    return null;
};

const handCardsFor = (gameState: GameStateLike | null, playerId: string): ICardData[] => {
    const hand = gameState?.players?.[playerId]?.cardPiles?.hand;
    return Array.isArray(hand) ? hand : [];
};

const removedHandCardStartRect = (
    previousGameState: GameStateLike | null,
    currentGameState: GameStateLike | null,
    destination: CardLocation,
    previousRects: Map<string, AnimationRect>,
): AnimationRect | null => {
    const previousHand = handCardsFor(previousGameState, destination.playerId);
    const currentHandIds = new Set(handCardsFor(currentGameState, destination.playerId).map((card) => card.uuid));
    const removedHandCard = previousHand.find((card) => card.uuid && !currentHandIds.has(card.uuid));

    if (!removedHandCard) return null;
    return previousRects.get(removedHandCard.uuid) ?? null;
};

const PlayedCardAnimationOverlay = () => {
    const { gameState } = useGame();
    const locale = useCardImageLocale();
    const previousGameState = React.useRef<GameStateLike | null>(null);
    const previousCardRects = React.useRef<Map<string, AnimationRect>>(new Map());
    const lastAnimationKey = React.useRef<string | null>(null);
    const timers = React.useRef<number[]>([]);
    const [animation, setAnimation] = React.useState<AnimationState | null>(null);

    React.useEffect(() => {
        return () => {
            timers.current.forEach(window.clearTimeout);
        };
    }, []);

    React.useLayoutEffect(() => {
        const lastPlayedCard = normalizeLastPlayedCardId(gameState?.clientUIProperties?.lastPlayedCard);
        const priorGameState = previousGameState.current;
        const destination = findPlayedDestination(gameState, priorGameState, lastPlayedCard);
        previousGameState.current = gameState;

        if (!destination || !lastPlayedCard) {
            previousCardRects.current = cacheCardRects();
            return;
        }

        const animationKey = `${lastPlayedCard}:${destination.card.uuid}:${destination.zone}`;
        if (lastAnimationKey.current === animationKey) return;

        const destinationRect = destinationRectFor(destination);
        if (!destinationRect) {
            previousCardRects.current = cacheCardRects();
            return;
        }
        const startRect = previousCardRects.current.get(destination.card.uuid)
            ?? removedHandCardStartRect(priorGameState, gameState, destination, previousCardRects.current)
            ?? presentationRect();
        const centerRightRect = presentationRect();

        lastAnimationKey.current = animationKey;
        timers.current.forEach(window.clearTimeout);
        timers.current = [];

        const imageUrl = s3CardImageURL(
            { ...destination.card, setId: destination.card.clonedCardId ?? destination.card.setId },
            locale,
            CardStyle.Plain,
        );

        setAnimation({
            key: animationKey,
            imageUrl,
            rect: startRect,
            phase: 'entering',
        });

        timers.current.push(window.setTimeout(() => {
            setAnimation((current) => current?.key === animationKey
                ? { ...current, rect: centerRightRect, phase: 'presenting' }
                : current);
        }, 0));

        timers.current.push(window.setTimeout(() => {
            setAnimation((current) => current?.key === animationKey
                ? { ...current, rect: destinationRect, phase: 'leaving' }
                : current);
        }, MOVE_MS + PRESENTATION_MS));

        timers.current.push(window.setTimeout(() => {
            setAnimation((current) => current?.key === animationKey ? null : current);
        }, CLEANUP_MS));

        previousCardRects.current = cacheCardRects();
    }, [gameState, locale]);

    if (!animation) return null;

    const prefersReducedMotion = typeof window !== 'undefined'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    return (
        <Box
            aria-hidden="true"
            sx={{
                position: 'fixed',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 1300,
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    left: `${animation.rect.left}px`,
                    top: `${animation.rect.top}px`,
                    width: `${animation.rect.width}px`,
                    height: `${animation.rect.height}px`,
                    borderRadius: '0.5rem',
                    backgroundColor: 'black',
                    backgroundImage: `url(${animation.imageUrl})`,
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: 'cover',
                    boxShadow: animation.phase !== 'leaving'
                        ? '0 18px 42px rgba(0, 0, 0, 0.55), 0 0 26px rgba(255, 255, 255, 0.18)'
                        : '0 8px 18px rgba(0, 0, 0, 0.35)',
                    opacity: animation.phase === 'leaving' ? 0.72 : 1,
                    transform: animation.phase === 'leaving' ? 'scale(0.96)' : 'scale(1)',
                    transition: prefersReducedMotion
                        ? 'opacity 120ms ease'
                        : `left ${MOVE_MS}ms cubic-bezier(0.2, 0.72, 0.2, 1), top ${MOVE_MS}ms cubic-bezier(0.2, 0.72, 0.2, 1), width ${MOVE_MS}ms cubic-bezier(0.2, 0.72, 0.2, 1), height ${MOVE_MS}ms cubic-bezier(0.2, 0.72, 0.2, 1), opacity ${MOVE_MS}ms ease, transform ${MOVE_MS}ms ease, box-shadow ${MOVE_MS}ms ease`,
                }}
            />
        </Box>
    );
};

export default PlayedCardAnimationOverlay;
