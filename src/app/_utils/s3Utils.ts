import {
    ICardData,
    IServerCardData,
    ISetCode,
    CardStyle,
    IPreviewCard,
    LeaderBaseCardStyle
} from '../_components/_sharedcomponents/Cards/CardTypes';
import {
    isGameCard,
    isPreviewCard,
    isSetCodeCard,
    parseSetId
} from '@/app/_components/_sharedcomponents/Cards/cardUtils';
import { CARD_IMAGE_CACHE_VERSION } from '@/app/_constants/constants';

export const s3ImageURL = (path: string) => {
    const s3Bucket = 'https://karabast-data.s3.amazonaws.com/';
    return s3Bucket + path;
};

/**
 * Token cards in the S3 image pipeline use numeric ids (e.g. `3941784506`)
 * stored under `cards/_tokens/...`, while regular cards always have an
 * `SET_NNN` id (e.g. `LOF_003`). When card data lacks an explicit `type`
 * field (e.g. deck-builder rows that only carry `{ id, count }`), we fall
 * back to recognizing tokens by this id shape.
 */
const isTokenCardId = (id: string | undefined): boolean =>
    !!id && /^\d+$/.test(id);

/**
 * Card image locales supported by the S3 image pipeline. The S3 layout is
 * `cards/{SET}/{locale}/{format}/{size}/{cardNumber}.webp` and
 * `cards/_tokens/{locale}/{format}/{numericId}.webp`. When a non-English
 * locale lacks a localized image, the pipeline fills the gap with a copy of
 * the English webp, so every locale URL is guaranteed to resolve.
 */
export enum CardImageLocale {
    English = 'en',
    French = 'fr',
    German = 'de',
    Spanish = 'es',
    Italian = 'it',
}

export const SUPPORTED_CARD_IMAGE_LOCALES: readonly CardImageLocale[] = Object.values(CardImageLocale);

export const CARD_IMAGE_LOCALE_LABELS: Record<CardImageLocale, string> = {
    [CardImageLocale.English]: 'English',
    [CardImageLocale.French]: 'Français',
    [CardImageLocale.German]: 'Deutsch',
    [CardImageLocale.Spanish]: 'Español',
    [CardImageLocale.Italian]: 'Italiano',
};

export function s3CardImageURL(
    card: ICardData | ISetCode | IServerCardData | IPreviewCard,
    locale: CardImageLocale,
    cardStyle: CardStyle | LeaderBaseCardStyle = CardStyle.Plain,
    cardback?: string,
): string {
    const isGameOrSetCard = isGameCard(card) || isSetCodeCard(card) || isPreviewCard(card);
    if ((isGameOrSetCard && !card?.setId) && !card?.id) {
        return cardback ? cardback : s3ImageURL('game/swu-cardback.webp');
    }
    const setId = isGameOrSetCard ? card.setId : parseSetId(card.id);
    // check if the card has a type
    let cardType: string | undefined;
    if ('type' in card && card.type) {
        cardType = card.type;
    } else if ('types' in card && card.types != null) {
        cardType = Array.isArray(card.types) ? card.types.join() : card.types;
    }
    const format = cardStyle === CardStyle.InPlay ? 'truncated' : 'standard';

    // Game/preview/set-coded cards carry a numeric engine `id` alongside
    // their `setId`, so the shape-based fallback is only safe for cards
    // that have no `setId` (e.g. deck-builder rows of shape `{ id, count }`
    // that lack a `type` field).
    const isToken = cardType?.includes('token')
        || (!isGameOrSetCard && isTokenCardId(card.id));
    if (isToken) {
        return s3ImageURL(`cards/_tokens/${locale}/${format}/${card.id}.webp?v=${CARD_IMAGE_CACHE_VERSION}`);
    }

    let cardNumber = setId.number.toString().padStart(3, '0')

    if ((isGameCard(card) && cardType === 'leader' && (card.zone === 'base')) ||
        (cardStyle === CardStyle.PlainLeader)) {
        cardNumber += '-base';
    }
    if (cardType === 'leader' && 'onStartingSide' in card && !card.onStartingSide) {
        cardNumber += '2';
    }

    return s3ImageURL(`cards/${setId.set}/${locale}/${format}/large/${cardNumber}.webp?v=${CARD_IMAGE_CACHE_VERSION}`);
};

/**
 * Human-readable identifier for the image a card would resolve to, used by
 * the debug "<CODE> IMAGE NOT FOUND" overlay. Mirrors the logic in
 * `s3CardImageURL` but stops at the filename stem and appends the locale.
 *
 * Examples: `LOF_003_EN`, `LOF_003_FR`, `TOKEN_3941784506_EN`.
 */
export function cardImageLabel(
    card: ICardData | ISetCode | IServerCardData | IPreviewCard,
    locale: CardImageLocale,
): string {
    const localeSuffix = locale.toUpperCase();
    const isGameOrSetCard = isGameCard(card) || isSetCodeCard(card) || isPreviewCard(card);
    if ((isGameOrSetCard && !card?.setId) && !card?.id) {
        return `UNKNOWN_${localeSuffix}`;
    }

    let cardType: string | undefined;
    if ('type' in card && card.type) {
        cardType = card.type;
    } else if ('types' in card && card.types != null) {
        cardType = Array.isArray(card.types) ? card.types.join() : card.types;
    }

    if (cardType?.includes('token') || (!isGameOrSetCard && isTokenCardId(card.id))) {
        return `TOKEN_${card.id}_${localeSuffix}`;
    }

    const setId = isGameOrSetCard ? card.setId : parseSetId(card.id);
    const num = setId.number.toString().padStart(3, '0');
    return `${setId.set}_${num}_${localeSuffix}`;
}


export const s3TokenImageURL = (token_name: string) =>{
    return s3ImageURL(`game/${token_name}.webp`);
}