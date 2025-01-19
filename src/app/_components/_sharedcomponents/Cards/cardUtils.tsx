import type { ICardData } from './CardTypes'

export interface ICardUtils {
    getBorderColor: (card: ICardData, player: string, promptType?: string) => string;
}

export const getBorderColor = (card: ICardData, player: string, promptType: string = '') => {
    if (promptType === 'resource' && card?.selected) {
        return 'var(--selection-yellow)';
    } else if (promptType === 'resource') {
        return '';
    }
        
    if (card?.selectable) {
        return card.controller.id === player ? 'var(--selection-green)' : 'var(--selection-red)';
    };

    return '';
}