import { DeckJSON, parseInputAsDeckData } from '@/app/_utils/checkJson';
import { DeckSource, fetchDeckData, IDeckData } from '@/app/_utils/fetchDeckData';
import { v4 as uuid } from 'uuid';

export type DeckImportInputType = 'url' | 'json';

export interface ResolvedDeckImport {
    deckData: IDeckData;
    inputType: DeckImportInputType;
}

export const convertJsonToDeckData = (deckJson: DeckJSON, deckLink: string): IDeckData => ({
    metadata: deckJson.metadata,
    leader: deckJson.leader,
    secondleader: null,
    base: deckJson.base,
    deck: deckJson.deck,
    sideboard: deckJson.sideboard || [],
    deckSource: DeckSource.JSON,
    deckID: deckJson.deckID || uuid(),
    deckLink,
    isPresentInDb: deckJson.isPresentInDb,
});

export const resolveDeckImportInput = async (input: string): Promise<ResolvedDeckImport> => {
    const parsedInput = parseInputAsDeckData(input);

    if (parsedInput.type === 'url') {
        const deckData = await fetchDeckData(input, false);
        if (!deckData) {
            throw new Error('Invalid deck input');
        }
        return {
            deckData: {
                ...deckData,
                deckLink: input,
            },
            inputType: 'url',
        };
    }

    if (parsedInput.type === 'json' && parsedInput.data) {
        return {
            deckData: convertJsonToDeckData(parsedInput.data, input),
            inputType: 'json',
        };
    }

    throw new Error('Invalid deck input');
};
