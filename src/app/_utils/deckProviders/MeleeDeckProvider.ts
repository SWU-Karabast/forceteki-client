import { DeckSource } from '../deckTypes';
import { BackendResolvedDeckProvider } from './BackendResolvedDeckProvider';

export class MeleeDeckProvider extends BackendResolvedDeckProvider {
    public readonly source = DeckSource.Melee;
    public readonly displayName = 'melee.gg';
    public readonly hostNameMatch = 'melee.gg';
    public readonly tagColor = '#ffa800';
}
