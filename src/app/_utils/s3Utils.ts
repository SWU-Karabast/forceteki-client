import { ICardData, IServerCardData, ISetCode, CardStyle } from '../_components/_sharedcomponents/Cards/CardTypes';
import { isGameCard, isSetCodeCard, parseSetId } from '@/app/_components/_sharedcomponents/Cards/cardUtils';

export const s3ImageURL = (path: string) => {
    const s3Bucket = 'https://karabast-assets.s3.amazonaws.com/';
    return s3Bucket + path;
};

export const s3CardImageURL = (card: ICardData | IServerCardData | ISetCode, cardStyle: CardStyle ) => {
    if (((isGameCard(card) || isSetCodeCard(card)) && !card?.setId) && !card?.id) return s3ImageURL('game/swu-cardback.webp');

    // we check which type it is
    const isGameOrSetCard = isGameCard(card) || isSetCodeCard(card);
    const setId = isGameOrSetCard ? card.setId : parseSetId(card.id);
    // check if the card has a type
    const cardType = 'type' in card ? card.type || (Array.isArray(card.types) ? card.types.join() : card.types) : undefined;

    if (cardType?.includes('token')) {
        return s3ImageURL(`cards/_tokens/${card.id}.webp`);
    }

    let cardNumber = setId.number.toString().padStart(3, '0')
    
    if (cardType === 'leaderUnit') {
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