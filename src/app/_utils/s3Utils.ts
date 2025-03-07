import {
    ICardData,
    IServerCardData,
    ISetCode,
    CardStyle,
    IPreviewCard
} from '../_components/_sharedcomponents/Cards/CardTypes';
import {
    isGameCard,
    isPreviewCard,
    isSetCodeCard,
    parseSetId
} from '@/app/_components/_sharedcomponents/Cards/cardUtils';

export const s3ImageURL = (path: string) => {
    const s3Bucket = 'https://karabast-assets.s3.amazonaws.com/';
    return s3Bucket + path;
};

export const s3CardImageURL = (card: ICardData | IServerCardData | ISetCode | IPreviewCard, cardStyle: CardStyle = CardStyle.Plain ) => {
    if (((isGameCard(card) || isSetCodeCard(card) || isPreviewCard(card)) && !card?.setId) && !card?.id) return s3ImageURL('game/swu-cardback.webp');

    // we check which type it is
    const isGameOrSetCard = isGameCard(card) || isSetCodeCard(card) || isPreviewCard(card);
    const setId = isGameOrSetCard ? card.setId : parseSetId(card.id);
    // check if the card has a type
    const cardType = 'type' in card ? card.type || (Array.isArray(card.types) ? card.types.join() : card.types) : undefined;

    if (cardType?.includes('token')) {
        return s3ImageURL(`cards/_tokens/${card.id}.webp`);
    }

    let cardNumber = setId.number.toString().padStart(3, '0')
    
    if (isGameCard(card) && cardType === 'leaderUnit' && card.epicDeployActionSpent) {
        cardNumber += '-portrait';
    }
    if (cardType === 'leader' && 'onStartingSide' in card && !card.onStartingSide) {
        cardNumber += '-side2';
    }
    const format = cardStyle === CardStyle.InPlay ? 'truncated' : 'standard';

    return s3ImageURL(`cards/${setId.set}/${format}/large/${cardNumber}.webp`);
};



export const s3TokenImageURL = (token_name: string) =>{
    return s3ImageURL(`game/${token_name}.webp`);
}