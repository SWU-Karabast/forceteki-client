import { DeckSource } from '../deckTypes';
import { BackendResolvedDeckProvider } from './core/BackendResolvedDeckProvider';

export class SwudbDeckProvider extends BackendResolvedDeckProvider {
    public override readonly source = DeckSource.SWUDB;
    public override readonly displayName = 'swudb.com';
    public override readonly hostNameMatch = 'swudb.com';
    public override readonly tagColor = '#4CB5FF';
}
