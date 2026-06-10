import { DeckSource } from '../deckTypes';
import { BackendResolvedDeckProvider } from './BackendResolvedDeckProvider';

export class SwudbDeckProvider extends BackendResolvedDeckProvider {
    public readonly source = DeckSource.SWUDB;
    public readonly displayName = 'swudb.com';
    public readonly hostNameMatch = 'swudb.com';
    public readonly tagColor = '#4CB5FF';
}
