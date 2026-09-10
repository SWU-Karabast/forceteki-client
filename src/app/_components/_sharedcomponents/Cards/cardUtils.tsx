import { ICardData, CardStyle, IServerCardData, ISetCode, IPreviewCard } from './CardTypes'

type BorderColorOptions = {
    card: ICardData;
    player: string;
    promptType?: string; 
    style?: CardStyle; 
    isOpponentEffect?: boolean;
    isHoveredInChat?:boolean;
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

/**
 * Card Status
 */
type CardStatusFn = (card: ICardData, cardStyle: CardStyle) => boolean;

export const cannotBeAttacked: CardStatusFn = (card) => !!card.cannotBeAttacked;
export const hasSentinel: CardStatusFn = (card, cardStyle) => cardStyle === CardStyle.InPlay && !!card.sentinel
export const isBlanked: CardStatusFn = (card) => !!card.isBlanked;
export const blockedFromPlay: CardStatusFn = (card) => !!card.blockedFromPlayReason;
// Held by someone other than its owner.
export const isStolen: CardStatusFn = (card) => !!card.controllerId && !!card.ownerId && card.controllerId !== card.ownerId;

export const getBorderColor = (options:BorderColorOptions) => {
    const {
        card,
        player,
        promptType = '',
        style = CardStyle.Plain,
        isOpponentEffect = false,
        isHoveredInChat = false,
    } = options;

    if (!card) return '';

    if (style === CardStyle.Prompt) {
        if (card.selected) {
            return 'var(--selection-blue)';
        } else {
            return '';
        }
    }

    if (isHoveredInChat) {
        return 'var(--selection-yellow)';
    } 

    if (card.zone === 'hand' && isOpponentEffect && card.selectable && !card.selected) {
        return 'var(--selection-purple)';
    }

    if (promptType === 'resource') {
        if (card.selectable && !card.selected) {
            return 'var(--selection-yellow)';
        }

        if (card.selected) {
            // TODO: look at other colors for this
            return 'var(--selection-blue)';
        }
    }

    if (card.selected) {
        return 'var(--selection-blue)';
    }
        
    if (card.selectable) {
        return card.controllerId === player ? 'var(--selection-green)' : 'var(--selection-red)';
    };

    return '';
}
