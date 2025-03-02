import { ICardData, CardStyle, IServerCardData, ISetCode, IPreviewCard } from './CardTypes'

export interface ICardUtils {
    getBorderColor: (card: ICardData, player: string, promptType?: string) => string;
}

// Type guard to check if the card is ICardData
export const isGameCard = (card: ICardData | IServerCardData | ISetCode | IPreviewCard): card is ICardData => {
    return (card as ICardData).zone !== undefined || (card as ICardData).uuid !== undefined;
};

export const isSetCodeCard = (card: ICardData | IServerCardData | ISetCode | IPreviewCard): card is ISetCode => {
    return (card as ISetCode).type !== undefined || (card as ISetCode).setId !== undefined;
};

export const isPreviewCard = (card:ICardData | IServerCardData | ISetCode | IPreviewCard): card is IPreviewCard => {
    return (card as IPreviewCard).titleAndSubtitle !== undefined;
}

export const parseSetId = (fullCardId: string) => {
    const [setStr, numStr] = fullCardId.split('_');
    return {
        set: setStr || '',
        number: parseInt(numStr, 10) || 0,
    };
};


export const getBorderColor = (card: ICardData, player: string, promptType: string = '', style: CardStyle = CardStyle.Plain) => {
    if (!card) return '';

    if (style === CardStyle.Prompt) {
        if (card.selected) {
            return 'var(--selection-blue)';
        } else {
            return '';
        }
    }

    if (promptType === 'resource' && card.selected) {
        return 'var(--selection-blue)';
    } else if (promptType === 'resource' && card.selectable) {
        return 'var(--selection-yellow)';
    }

    if (card.selected) {
        return 'var(--selection-blue)';
    }
        
    if (card.selectable) {
        return card.controller.id === player ? 'var(--selection-green)' : 'var(--selection-red)';
    };

    return '';
}