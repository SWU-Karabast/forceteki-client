import { ICardData, CardAppLocation } from './CardTypes'

export interface ICardUtils {
    getBorderColor: (card: ICardData, player: string, promptType?: string) => string;
}

export const getBorderColor = (card: ICardData, player: string, promptType: string = '', location: CardAppLocation = CardAppLocation.Gameboard) => {
    if (!card) return '';

    if (location === CardAppLocation.Prompt) {
        if (card.selected) {
            return 'var(--selection-blue)';
        } else {
            return '';
        }
    }

    if (promptType === 'resource' && card.selected) {
        return 'var(--selection-yellow)';
    } else if (promptType === 'resource') {
        return '';
    }

    if (card.selected) {
        return 'var(--selection-blue)';
    }
        
    if (card.selectable) {
        return card.controller.id === player ? 'var(--selection-green)' : 'var(--selection-red)';
    };

    return '';
}