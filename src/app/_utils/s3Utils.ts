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

export const s3ImageURL = (path: string) => {
    const s3Bucket = 'https://karabast-data.s3.amazonaws.com/';
    return s3Bucket + path;
};

export const s3CardImageURL = (card: ICardData | IServerCardData | ISetCode | IPreviewCard, cardStyle: CardStyle | LeaderBaseCardStyle = CardStyle.Plain ) => {
    if (((isGameCard(card) || isSetCodeCard(card) || isPreviewCard(card)) && !card?.setId) && !card?.id) return s3ImageURL('game/swu-cardback.webp');

    // we check which type it is
    const isGameOrSetCard = isGameCard(card) || isSetCodeCard(card) || isPreviewCard(card);
    const setId = isGameOrSetCard ? card.setId : parseSetId(card.id);
    // check if the card has a type
    const cardType = 'type' in card ? card.type || (Array.isArray(card.types) ? card.types.join() : card.types) : 'types' in card ? card.types : undefined;
    const tokenIds = ['3941784506', '3463348370', '7268926664', '9415311381', '8752877738', '2007868442']
    if (cardType?.includes('token') || (card.id && tokenIds.includes(card.id))) {
        return s3ImageURL(`cards/_tokens/${card.id}.webp`);
    }

    let cardNumber = setId.number.toString().padStart(3, '0')

    if ((isGameCard(card) && cardType === 'leader' && (card.zone === 'base')) ||
        (cardStyle === CardStyle.PlainLeader)) {
        cardNumber += '-base';
    }
    if (cardType === 'leader' && 'onStartingSide' in card && !card.onStartingSide) {
        cardNumber += '2';
    }
    const format = cardStyle === CardStyle.InPlay ? 'truncated' : 'standard';

    return s3ImageURL(`cards/${setId.set}/${format}/large/${cardNumber}.webp?v=2`);
};



export const s3TokenImageURL = (token_name: string) =>{
    return s3ImageURL(`game/${token_name}.webp`);
}